const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const StudentProfile = sequelize.define("StudentProfile", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  university: {
    type: DataTypes.STRING,
    allowNull: true
  },
  major: {
    type: DataTypes.STRING,
    allowNull: true
  },
  graduationYear: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  skills: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: []
  },
  resumeUrl: {
    type: DataTypes.STRING,
    allowNull: true
  },
  github: {
    type: DataTypes.STRING,
    allowNull: true
  },
  linkedin: {
    type: DataTypes.STRING,
    allowNull: true
  },
  portfolio: {
    type: DataTypes.STRING,
    allowNull: true
  },
  bio: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  avatar: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  banner: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  viewCount: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  openToWork: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  }
});

module.exports = StudentProfile;
