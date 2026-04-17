const { DataTypes } = require("sequelize");
const sequelize = require("../database");
const User = require("./user");

const ServiceMsg = sequelize.define("ServiceMsg", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  type: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: "user" 
  },
  toUserId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  isRead: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  }
}, {
  tableName: "service_msgs",
  timestamps: true
});

ServiceMsg.belongsTo(User, { foreignKey: "userId" });

module.exports = ServiceMsg;