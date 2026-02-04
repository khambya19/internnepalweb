const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const JobReport = sequelize.define('JobReport', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  jobId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  reporterId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  reason: {
    type: DataTypes.ENUM('fake_job', 'spam', 'inappropriate', 'already_filled', 'other'),
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('pending', 'reviewed', 'dismissed'),
    defaultValue: 'pending',
  },
}, {
  indexes: [
    {
      unique: true,
      fields: ['jobId', 'reporterId']
    }
  ]
});

module.exports = JobReport;
