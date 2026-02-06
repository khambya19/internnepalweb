const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database'); // Import connection directly

const User = sequelize.define("User", {
    phone: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isValidPhone(value) {
          // Accept mobile: +977 followed by 10 digits starting with 96/97/98
          const mobileWithPrefix = /^\+977(96|97|98)[0-9]{8}$/.test(value);
          // Accept mobile without prefix: 10 digits starting with 96/97/98
          const mobileWithout = /^(96|97|98)[0-9]{8}$/.test(value);
          // Accept landline with +977 prefix: +977 followed by 9 digits NOT starting with 96/97/98
          const landlineWithPrefix = /^\+977(?!9[678])[0-9]{7,9}$/.test(value);
          // Accept landline without prefix: 9 digits NOT starting with 96/97/98
          const landlineWithout = /^(?!9[678])[0-9]{9}$/.test(value);

          if (!mobileWithPrefix && !mobileWithout && !landlineWithPrefix && !landlineWithout) {
            throw new Error(
              'Phone must be a valid 10-digit mobile number (starting with 96/97/98) or a 9-digit landline number (not starting with 96/97/98)'
            );
          }
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
  // Password is validated by Joi in the controller BEFORE hashing.
  // The value stored here is the bcrypt hash, not the raw password.
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  role: {
    type: DataTypes.STRING,
    defaultValue: "user",
    validate: {
      isIn: [["user", "student", "company", "admin", "superadmin"]]
    }
  },
  isVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  otp: {
    type: DataTypes.STRING,
    allowNull: true
  },
  otpExpires: {
    type: DataTypes.DATE,
    allowNull: true
  },
  otpAttempts: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  otpBlockedUntil: {
    type: DataTypes.DATE,
    allowNull: true
  },
  tokenVersion: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  }
});

module.exports = User;
