const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ViewLog = sequelize.define(
  'ViewLog',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    viewerId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    targetType: {
      type: DataTypes.ENUM('job', 'student_profile'),
      allowNull: false
    },
    targetId: {
      type: DataTypes.UUID,
      allowNull: false
    }
  },
  {
    updatedAt: false,
    indexes: [
      {
        unique: true,
        fields: ['viewerId', 'targetType', 'targetId'],
        name: 'unique_viewer_target'
      }
    ]
  }
);

module.exports = ViewLog;
