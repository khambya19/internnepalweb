require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const fs = require('fs');
const path = require('path');
const { connectDB, sequelize } = require('./config/database');

const app = express();

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per window
});
app.use(limiter);

app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());

// Mount authentication routes
const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authRoutes);

// Test route
app.get('/', (req, res) => {
  res.json({ message: 'InternNepal API is live!' });
});

const PORT = process.env.PORT || 5050;

const startServer = async () => {
  try {
    await connectDB();
    
    
    const models = {};
    const modelsPath = path.join(__dirname, 'models');
    fs.readdirSync(modelsPath)
      .filter(file => file.endsWith('.js'))
      .forEach(file => {
        const model = require(path.join(modelsPath, file));
        if (model && model.name) {
          models[model.name] = model;
        }
      });

    await sequelize.sync({ alter: true });
    console.log('Database synced (alter:true)');

    console.log('Models loaded:', Object.keys(models));

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
      console.log(`Test it: open http://localhost:${PORT} in browser`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
  }
};

startServer();
