require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const fs = require('fs');
const path = require('path');
const { connectDB, sequelize } = require('./config/database');
const { startReminderCronJobs } = require('./utils/reminderCron');

const app = express();

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 300 : 5000, // relaxed in development to avoid local lockouts
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please try again in a few minutes.' },
});
app.use(limiter);

app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Serve uploaded files (e.g. avatars, banners)
const uploadsPath = path.join(__dirname, '..', 'uploads');
app.use('/uploads', express.static(uploadsPath));

// ── Mount Routes ──────────────────────────────────────────
const authRoutes = require('./routes/authRoutes');
const companyRoutes = require('./routes/companyRoutes');
const studentRoutes = require('./routes/studentRoutes');
const jobRoutes = require('./routes/jobRoutes');
const applicationRoutes = require('./routes/applicationRoutes');
const savedJobRoutes = require('./routes/savedJobRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const superAdminRoutes = require('./routes/superAdminRoutes');
const viewRoutes = require('./routes/viewRoutes');
const adminRoutes = require('./routes/adminRoutes');
const ratingRoutes = require('./routes/ratingRoutes');
const reportRoutes = require('./routes/reportRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/company', companyRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/student/saved-jobs', savedJobRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/superadmin', superAdminRoutes);
app.use('/api/views', viewRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/ratings', ratingRoutes);
app.use('/api/reports', reportRoutes);

// Test route
app.get('/', (req, res) => {
  res.json({ message: 'InternNepal API is live!' });
});

const PORT = process.env.PORT || 6060;

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
    console.info('Database synced (alter:true)');

    console.info('Models loaded:', Object.keys(models));

    app.listen(PORT, () => {
      console.info(`Server running on http://localhost:${PORT}`);
      console.info(`Test it: open http://localhost:${PORT} in browser`);
      startReminderCronJobs();
    });
  } catch (error) {
    console.error('Failed to start server:', error);
  }
};

startServer();
