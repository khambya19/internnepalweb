const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database'); // Import connection directly

const User = sequelize.define("User", {
    phone: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        is: {
          args: [/^(96|97|98)[0-9]{8}$/],
          msg: 'Phone number must be 10 digits and start with 96, 97, or 98',
        },
        len: {
          args: [10, 10],
          msg: 'Phone number must be exactly 10 digits',
        },
      },
    },
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4, // Generates a unique ID automatically
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Full Name is required'
      },
      len: {
        args: [2, 255],
        msg: 'Full Name must be at least 2 characters'
      }
    }
  },
  email: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
    validate: {
      isEmail: {
        msg: 'Enter a valid email'
      }
    }
  },
  // Password validation is enforced both in frontend (zod) and backend (Sequelize)
  password: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isStrongPassword(value) {
        if (!value) {
          throw new Error('Password is required.');
        }
        if (value.length < 8) {
          throw new Error('Password must be at least 8 characters.');
        }
        if (!/[A-Z]/.test(value)) {
          throw new Error('Password must include an uppercase letter.');
        }
        if (!/[a-z]/.test(value)) {
          throw new Error('Password must include a lowercase letter.');
        }
        if (!/[0-9]/.test(value)) {
          throw new Error('Password must include a number.');
        }
        if (!/[^A-Za-z0-9]/.test(value)) {
          throw new Error('Password must include a special character.');
        }
      }
    }
  },
  role: {
    type: DataTypes.STRING,
    defaultValue: "user"
  },
  isVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  otp: {
    type: DataTypes.STRING,
    allowNull: true
  },
  otpExpires: {
    type: DataTypes.DATE,
    allowNull: true
  }
});

module.exports = User;