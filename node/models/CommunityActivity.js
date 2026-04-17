const { DataTypes } = require("sequelize");
const sequelize = require("../database");

const CommunityActivity = sequelize.define("CommunityActivity", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  // 活动标题
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  // 活动内容/描述
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  // 活动状态 1=进行中 0=已结束
  status: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    allowNull: false
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: "community_activities",
  timestamps: true,
  updatedAt: false
});

module.exports = CommunityActivity;