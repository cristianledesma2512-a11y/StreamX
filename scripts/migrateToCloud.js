#!/usr/bin/env node
/**
 * scripts/migrateToCloud.js
 * Copia todos los datos de la MongoDB local a una MongoDB en la nube.
 *
 * Uso:
 *   MONGODB_URI=mongodb://127.0.0.1:27017/streamx \
 *   CLOUD_MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/streamx \
 *   node scripts/migrateToCloud.js
 */
require('dotenv').config();
const mongoose = require('mongoose');

const LOCAL_URI = process.env.MONGODB_URI;
const CLOUD_URI = process.env.CLOUD_MONGODB_URI;

if (!LOCAL_URI || !CLOUD_URI) {
  console.error('Necesitás definir MONGODB_URI (local) y CLOUD_MONGODB_URI (nube)');
  process.exit(1);
}

const collections = ['movies', 'series', 'adminusers', 'pageviews'];

(async () => {
  console.log('Conectando a BD local...');
  const localConn = await mongoose.createConnection(LOCAL_URI).asPromise();

  console.log('Conectando a BD en la nube...');
  const cloudConn = await mongoose.createConnection(CLOUD_URI).asPromise();

  for (const col of collections) {
    const localCol = localConn.collection(col);
    const cloudCol = cloudConn.collection(col);

    const docs = await localCol.find({}).toArray();
    if (docs.length === 0) {
      console.log(`  ${col}: vacía, saltando.`);
      continue;
    }

    console.log(`  ${col}: migrando ${docs.length} documentos...`);
    await cloudCol.deleteMany({});
    await cloudCol.insertMany(docs);
    console.log(`  ${col}: ✅ OK`);
  }

  await localConn.close();
  await cloudConn.close();
  console.log('\n✅ Migración completada.');
  process.exit(0);
})().catch((err) => {
  console.error('Error en migración:', err.message);
  process.exit(1);
});
