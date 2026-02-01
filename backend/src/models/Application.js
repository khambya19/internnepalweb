const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Application = sequelize.define("Application", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  coverLetter: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'pending'
  },
  interviewDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  interviewTime: {
    type: DataTypes.STRING,
    allowNull: true
  },
  interviewMessage: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  companyNotes: {
    type: DataTypes.TEXT,
    allowNull: true,
    defaultValue: null
  },
  rejectionReason: {
    type: DataTypes.TEXT,
    allowNull: true,
    defaultValue: null
  },
  isStarred: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  statusHistory: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: []
  }
}, {
  indexes: [
    { unique: true, fields: ['jobId', 'studentId'], name: 'applications_job_student_unique' }
  ]
});

module.exports = Application;
