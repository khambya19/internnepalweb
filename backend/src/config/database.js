require('dotenv').config(); // Load the .env file
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DB_NAME,     // DB password
  process.env.DB_USER,     // DB password
  process.env.DB_PASSWORD,  // DB password
  {
    host: process.env.DB_HOST,// DB password
    port: process.env.DB_PORT, 
    dialect: 'postgres',
    logging: false,            
    dialectOptions: {
    
      ssl: process.env.NODE_ENV === 'production' 
        ? { require: true, rejectUnauthorized: false } 
        : false,
    },
  }
);

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log(` PostgreSQL Connected to database: ${process.env.DB_NAME}`);
  } catch (error) {
    console.error(' Database Connection Failed:', error.message);
    process.exit(1);
  }
};

module.exports = { connectDB, sequelize };