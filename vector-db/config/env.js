// Environment Configuration
require('dotenv').config();

module.exports = {
  PORT:                process.env.PORT || 8081,
  NODE_ENV:            process.env.NODE_ENV || 'development',
  ASTRA_DB_TOKEN:      process.env.ASTRA_DB_TOKEN,
  ASTRA_DB_ENDPOINT:   process.env.ASTRA_DB_ENDPOINT,
  ASTRA_DB_KEYSPACE:   process.env.ASTRA_DB_KEYSPACE || 'default_keyspace',
};
