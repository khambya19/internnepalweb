require('dotenv').config();
const { Sequelize } = require('sequelize');

const dbHost = process.env.DB_HOST || 'localhost';
const dbPort = parseInt(process.env.DB_PORT || '5432', 10);

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: dbHost,
    port: dbPort,
    dialect: 'postgres',
    logging: false,
    dialectOptions: {
      ssl: process.env.NODE_ENV === 'production'
        ? { require: true, rejectUnauthorized: false }
        : false,
    },
  }
);

const connectDB = async (retries = 2) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await sequelize.authenticate();
      console.info(` PostgreSQL Connected to database: ${process.env.DB_NAME}`);
      return;
    } catch (error) {
      console.error(` Database connection attempt ${attempt}/${retries} failed:`, error.message);
      if (error?.original?.code === 'EPERM' || error?.original?.code === 'EACCES') {
        console.error(' Connection blocked by OS/sandbox policy (not a DB credential error).');
        console.error(' Try running from a normal terminal session and allow local network/socket access.');
      }
      if (attempt < retries) {
        const delay = 2000;
        console.info(` Retrying in ${delay / 1000}s...`);
        await new Promise((r) => setTimeout(r, delay));
      } else {
        console.error('\n If using Postgres.app, run: node scripts/fix-postgres-app-auth.js');
        process.exit(1);
      }
    }
  }
};

module.exports = { connectDB, sequelize };
