require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { connectDB, sequelize } = require('./config/database');

const app = express();

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 100, 
});
app.use(limiter);

app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());

// Test route
app.get('/', (req, res) => {
  res.json({ message: 'InternNepal API is live!' });
});

const PORT = process.env.PORT || 5001;

const startServer = async () => {
  try {
    await connectDB();                   
    await sequelize.sync({ force: false });
    console.log('Database synced');

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
      console.log(`Test it: open http://localhost:${PORT} in browser`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
  }
};

startServer();