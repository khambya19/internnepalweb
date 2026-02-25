const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const SavedCandidate = sequelize.define("SavedCandidate", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  }
});

module.exports = SavedCandidate;
