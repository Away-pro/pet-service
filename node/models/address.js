const { DataTypes } = require("sequelize");
const sequelize = require("../database");
const User = require("./user"); // 关联用户表

const Address = sequelize.define("Address", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: "id"
    },
    comment: "所属用户ID"
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: "收货人姓名"
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: "联系电话"
  },
  address: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: "省/市/区"
  },
  detail: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: "详细地址"
  },
  isDefault: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
    comment: "是否默认：0否 1是"
  }
}, {
  tableName: "addresses",
  timestamps: true,
  createdAt: "createTime",
  updatedAt: "updateTime"
});

module.exports = Address;