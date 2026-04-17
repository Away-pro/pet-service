const { DataTypes } = require('sequelize');
const sequelize = require('../database');
const User = require('./user');

const CommunityFollow = sequelize.define('CommunityFollow', {
  followerId: {  // 关注人的ID
    type: DataTypes.INTEGER,
    allowNull: false
  },
  followingId: { // 被关注人的ID
    type: DataTypes.INTEGER,
    allowNull: false
  }
}, {
  tableName: 'community_follows',
  timestamps: false
});

module.exports = CommunityFollow;