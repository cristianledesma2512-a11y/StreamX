// =============================================
//   StreamX - Auto-Refresh con Puppeteer
//   PM2: pm2 start auto-refresh.js --name streamx-refresh
// =============================================
require('dotenv').config();
const mongoose  = require('mongoose');
const https     = require('https');
const http      = require('http');
const puppeteer = require('puppeteer');

const channelSchema = new mongoose.Schema({
  name: String, slug: String, logo: String,
  category: String, streamUrl: String, quality: String,
  language: String, country: String,
  isLive: Boolean, viewers: Number,
  currentShow: String, active: Boolean,
  isDynamic: Boolean, sourceUrl: String, tokenExpiresAt: Date,
}, { timestamps: true });
const Channel = mongoose.models.Channel || mongoose.model('Channel', channelSchema);

const MONGO          = process.env.MONGO_URI || 'mongodb://localhost:27017/streamx';
const CHECK_INTERVAL = parseInt(process.env.REFRESH_INTERVAL_MS || '300000');

// Canales con tokens dinámicos (Pelota Libre)
const DYNAMIC_CHANNELS = [
  { slug: 'tnt-sports-ar',    name: 'TNT Sports Argentina', url: 'https://www.pelotalibretv2.pl/en-vivo/tnt-sports-argentina.php' },
  { slug: 'espn-premium',     name: 'ESPN Premium',         url: 'https://www.pelotalibretv2.pl/en-vivo/espn-premium.php' },
  { slug: 'espn-hd',          name: 'ESPN HD',              url: 'https://www.pelotalibretv2.pl/en-vivo/espn.php' },
  { slug: 'fox-sports',       name: 'Fox Sports',           url: 'https://www.pelotalibretv2.pl/en-vivo/fox-sports.php' },
  { slug: 'fox-sports-2',     name: 'Fox Sports 2',         url: 'https://www.pelotalibretv2.pl/en-vivo/fox-sports-2.php' },
  { slug: 'tyc-sports',       name: 'TyC Sports',           url: 'https://www.pelotalibretv2.pl/en-vivo/tyc-sports.php' },
];

function testStream(url, ms = 4000) {
  return new Promise(resolve => {
    try {
      const mod = url.startsWith('https') ? https : http;
      const req = mod.request(url, { method: 'HEAD', timeout: ms }, res => {
        resolve(res.statusCode < 400);
        req.destroy();
      });
      req.on('error', () => resolve(false));
      req.on('timeout', () => { req.destroy(); resolve(false); });
      req.end();
    } catch { resolve(false); }
  });
}

async function scrapeM3u8(pageUrl) {
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    });
    const page = await browser.newPage();
    let m3u8Url = null;

    page.on('request', req => {
      const u = req.url();
      if (u.includes('.m3u8') && !m3u8Url) {
        m3u8Url = u;
        console.log(`  🎯 Capturado: ${u.substring(0, 80)}...`);
      }
    });
    page.on('response', async res => {
      const u = res.url();
      if (u.includes('.m3u8') && !m3u8Url) m3u8Url = u;
    });

    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
    await page.goto(pageUrl, { waitUntil: 'networkidle2', timeout: 25000 });
    if (!m3u8Url) await new Promise(r => setTimeout(r, 6000));

    return m3u8Url;
  } catch (err) {
    console.error(`  ⚠️  Scraping error: ${err.message}`);
    return null;
  } finally {
    if (browser) await browser.close();
  }
}

async function refreshDynamicChannels() {
  console.log(`[${new Date().toLocaleTimeString()}] 🔄 Renovando tokens dinámicos...`);
  let renewed = 0;

  for (const dyn of DYNAMIC_CHANNELS) {
    try {
      const ch = await Channel.findOne({ slug: dyn.slug, active: true });
      if (!ch) { console.log(`  ⏭️  ${dyn.name} → no está en DB`); continue; }

      const alive = ch.streamUrl ? await testStream(ch.streamUrl) : false;
      if (alive) { console.log(`  ✅ ${dyn.name} → token válido`); continue; }

      console.log(`  🔁 ${dyn.name} → scrapeando...`);
      const newUrl = await scrapeM3u8(dyn.url);

      if (newUrl) {
        await Channel.updateOne({ slug: dyn.slug }, {
          streamUrl: newUrl, isLive: true,
          tokenExpiresAt: new Date(Date.now() + 6 * 60 * 60 * 1000),
        });
        console.log(`  ✅ ${dyn.name} → renovado`);
        renewed++;
      } else {
        await Channel.updateOne({ slug: dyn.slug }, { isLive: false });
        console.log(`  ❌ ${dyn.name} → sin stream`);
      }

      await new Promise(r => setTimeout(r, 3000));
    } catch (err) {
      console.error(`  ⚠️  ${dyn.name}:`, err.message);
    }
  }
  console.log(`[${new Date().toLocaleTimeString()}] ✅ Renovación completa: ${renewed} actualizados\n`);
}

async function refreshViewers() {
  const channels = await Channel.find({ active: true, isLive: true });
  for (const ch of channels) {
    const delta = Math.floor(ch.viewers * (Math.random() * 0.3 - 0.15));
    await Channel.updateOne({ _id: ch._id }, { viewers: Math.max(50, ch.viewers + delta) });
  }
  console.log(`[${new Date().toLocaleTimeString()}] 👁  Viewers actualizados (${channels.length} canales)`);
}

async function checkStreams() {
  const channels = await Channel.find({ active: true });
  let online = 0, offline = 0;
  for (const ch of channels) {
    if (!ch.streamUrl) continue;
    const alive = await testStream(ch.streamUrl);
    if (ch.isLive !== alive) {
      await Channel.updateOne({ _id: ch._id }, { isLive: alive });
      console.log(`  ${alive ? '✅' : '❌'} ${ch.name} → ${alive ? 'online' : 'offline'}`);
    }
    alive ? online++ : offline++;
  }
  console.log(`[${new Date().toLocaleTimeString()}] 📡 Streams: ${online} online, ${offline} offline\n`);
}

async function run() {
  console.log('🔄 StreamX Auto-Refresh iniciado');
  console.log(`   Intervalo: ${CHECK_INTERVAL / 1000}s`);
  await mongoose.connect(MONGO);
  console.log('✅ MongoDB conectado\n');

  await refreshViewers();
  await refreshDynamicChannels();

  setInterval(refreshViewers,        CHECK_INTERVAL);
  setInterval(checkStreams,          CHECK_INTERVAL * 3);
  setInterval(refreshDynamicChannels, 1000 * 60 * 120); // cada 2h
}

run().catch(err => { console.error('❌', err.message); process.exit(1); });
