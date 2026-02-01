const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Job = sequelize.define("Job", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  category: {
    type: DataTypes.STRING,
    allowNull: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  responsibilities: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  requirements: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  skills: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: []
  },
  minEducation: {
    type: DataTypes.STRING,
    allowNull: true
  },
  experienceLevel: {
    type: DataTypes.STRING,
    allowNull: true
  },
  openings: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  },
  duration: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  startDate: {
    type: DataTypes.STRING,
    allowNull: true
  },
  locations: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: []
  },
  workMode: {
    type: DataTypes.STRING,
    allowNull: true
  },
  isPaid: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  stipend: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  stipendNote: {
    type: DataTypes.STRING,
    allowNull: true
  },
  perks: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: []
  },
  deadline: {
    type: DataTypes.STRING,
    allowNull: true
  },
  salary: {
    type: DataTypes.STRING,
    allowNull: true
  },
  location: {
    type: DataTypes.STRING,
    allowNull: true
  },
  type: {
    type: DataTypes.ENUM('internship', 'full-time', 'part-time', 'contract'),
    defaultValue: 'internship'
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'active'
  },
  hiringPaused: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  isRemovedByAdmin: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  removedByAdminAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  removedByReportId: {
    type: DataTypes.UUID,
    allowNull: true
  },
  removedPreviousStatus: {
    type: DataTypes.STRING,
    allowNull: true
  },
  removedPreviousHiringPaused: {
    type: DataTypes.BOOLEAN,
    allowNull: true
  },
  viewCount: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  }
});

module.exports = Job;
