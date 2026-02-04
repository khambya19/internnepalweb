const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const CompanyReview = sequelize.define(
  'CompanyReview',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    companyId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'CompanyProfiles',
        key: 'id'
      }
    },
    studentId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    rating: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 5
      }
    },
    review: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: null
    }
  },
  {
    updatedAt: false,
    indexes: [
      {
        unique: true,
        fields: ['companyId', 'studentId'],
        name: 'company_reviews_company_student_unique'
      }
    ]
  }
);

module.exports = CompanyReview;
