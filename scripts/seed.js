#!/usr/bin/env node
/**
 * scripts/seed.js
 * Crea el primer usuario super admin desde la línea de comandos.
 * Uso: node scripts/seed.js
 */
require('dotenv').config();
const readline = require('readline');
const bcrypt   = require('bcryptjs');
const { connectDB } = require('../config/db');
const AdminUser = require('../models/AdminUser');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const q  = (msg) => new Promise((res) => rl.question(msg, res));

(async () => {
  try {
    await connectDB();
    const count = await AdminUser.countDocuments();
    if (count > 0) {
      console.log(`Ya existen ${count} admins. Abortando.`);
      process.exit(0);
    }

    const username = await q('Usuario super admin: ');
    const password = await q('Contraseña: ');
    rl.close();

    const hash = await bcrypt.hash(String(password), 12);
    await AdminUser.create({ username: String(username).trim().toLowerCase(), passwordHash: hash, role: 'super' });
    console.log(`\n✅ Admin creado: ${username}`);
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
})();
