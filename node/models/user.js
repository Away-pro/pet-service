const { DataTypes } = require("sequelize");
const sequelize = require("../database");

const User = sequelize.define("User", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  // 用户名
  username: {
    type: DataTypes.STRING,
    allowNull: false
  },
  // 密码
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  // 邮箱（保留原有）
  email: {
    type: DataTypes.STRING
  },
  phone: {
    type: DataTypes.STRING(11),
    unique: true, // 手机号唯一
    allowNull: false
  },
  role: {
    type: DataTypes.ENUM("admin", "customer"),
    defaultValue: "customer", // 默认普通用户
    allowNull: false
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: "users",
  timestamps: true,
  updatedAt: false
});

module.exports = User;