const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const InternRating = sequelize.define(
  'InternRating',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    rating: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 5,
      },
    },
    review: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: null,
    },
    skills: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: false,
      defaultValue: [],
    },
  },
  {
    indexes: [
      {
        unique: true,
        fields: ['applicationId'],
        name: 'intern_ratings_application_unique',
      },
    ],
  }
);

module.exports = InternRating;
