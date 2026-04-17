const { DataTypes } = require("sequelize");
const sequelize = require("../database");

const Pet = sequelize.define("Pet", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },

  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: "所属用户ID"
  },

  userName: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: "主人姓名"
  },

  userPhone: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: "主人电话"
  },

  petName: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: "宠物名称"
  },

  petType: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: "宠物类型：猫咪/狗狗/异宠"
  },

  age: {
    type: DataTypes.STRING,
    comment: "年龄"
  },

  weight: {
    type: DataTypes.STRING,
    comment: "体重"
  },

  vaccine: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: "疫苗状态"
  },

  allergy: {
    type: DataTypes.TEXT,
    comment: "过敏史"
  },

  feeding: {
    type: DataTypes.TEXT,
    comment: "饮食禁忌"
  },

  note: {
    type: DataTypes.TEXT,
    comment: "性格备注"
  }
}, {
  tableName: "pets",
  timestamps: true,
  createdAt: "createTime",
  updatedAt: false
});

module.exports = Pet;