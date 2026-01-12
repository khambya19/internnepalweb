const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database'); // Import connection directly

const User = sequelize.define("User", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4, // Generates a unique ID automatically
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: true
  },
  email: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
    validate: {
      isEmail: true // Adds email validation
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  role: {
    type: DataTypes.STRING,
    defaultValue: "user"
  }
}, {
  timestamps: true // Adds createdAt and updatedAt
});

module.exports = User;