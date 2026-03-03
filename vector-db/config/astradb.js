// AstraDB Client Configuration
const { DataAPIClient } = require('@datastax/astra-db-ts');
const { ASTRA_DB_TOKEN, ASTRA_DB_ENDPOINT, ASTRA_DB_KEYSPACE } = require('./env');

let db = null;

/**
 * Connect to AstraDB and return the database instance.
 * Uses a singleton pattern — initialises only once.
 */
const connectAstraDB = async () => {
  if (db) return db;

  if (!ASTRA_DB_TOKEN || !ASTRA_DB_ENDPOINT) {
    throw new Error('ASTRA_DB_TOKEN and ASTRA_DB_ENDPOINT must be set in .env');
  }

  const client = new DataAPIClient(ASTRA_DB_TOKEN);
  db = client.db(ASTRA_DB_ENDPOINT, { keyspace: ASTRA_DB_KEYSPACE });

  // Verify connection
  const colls = await db.listCollections();
  console.log(`✅ Connected to AstraDB. Collections: [${colls.map(c => c.name).join(', ') || 'none'}]`);

  return db;
};

const getDB = () => {
  if (!db) throw new Error('AstraDB not initialised. Call connectAstraDB() first.');
  return db;
};

module.exports = { connectAstraDB, getDB };
