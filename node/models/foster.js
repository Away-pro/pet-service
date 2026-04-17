const { DataTypes } = require("sequelize");
const sequelize = require("../database");

const Foster = sequelize.define("Foster", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },

  userId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },

  petId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },

  petName: {
    type: DataTypes.STRING,
    allowNull: false
  },

  userName: {
    type: DataTypes.STRING,
    allowNull: false
  },

  userPhone: {
    type: DataTypes.STRING,
    allowNull: false
  },

  checkIn: {
    type: DataTypes.DATE,
    allowNull: false,
    comment: "入住时间"
  },

  checkOut: {
    type: DataTypes.DATE,
    allowNull: false,
    comment: "离店时间"
  },

  fosterType: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: "寄养类型"
  },

  unitPrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    comment: "单日单价"
  },

  totalPrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    comment: "总费用"
  },

  status: {
    type: DataTypes.STRING,
    defaultValue: "待审核",
    comment: "待审核/已入住/已完成/已取消"
  }
}, {
  tableName: "fosters",
  timestamps: true,
  createdAt: "createTime",
  updatedAt: false
});

module.exports = Foster;