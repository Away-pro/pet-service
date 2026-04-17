const { DataTypes } = require('sequelize');
const sequelize = require('../database'); 
const User = require('./user'); 

const CommunityUserProfile = sequelize.define('CommunityUserProfile', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
    references: { model: User, key: 'id' },
    onDelete: 'CASCADE'
  },
  signature: { type: DataTypes.TEXT, defaultValue: '养宠达人 | 分享科学养宠经验 🐾' },
  gender: { type: DataTypes.ENUM('male', 'female', 'secret'), defaultValue: 'secret' },
  birthday: { type: DataTypes.DATEONLY, allowNull: true },
  location: { type: DataTypes.STRING(100), allowNull: true },
  avatar: { type: DataTypes.STRING(255), allowNull: true, defaultValue: '' }
}, {
  tableName: 'community_user_profiles',
  timestamps: true
});

User.hasOne(CommunityUserProfile, { foreignKey: 'userId', onDelete: 'CASCADE' });
CommunityUserProfile.belongsTo(User, { foreignKey: 'userId',onDelete: 'SET NULL', onUpdate: 'CASCADE' });

module.exports = CommunityUserProfile;