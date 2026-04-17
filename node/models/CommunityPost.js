const { DataTypes } = require("sequelize");
const sequelize = require("../database");
const User = require('./user');

const CommunityPost = sequelize.define("CommunityPost",{
  id:{
    type:DataTypes.INTEGER,
    primaryKey:true,
    autoIncrement:true
  },
  userId:{
    type:DataTypes.INTEGER,
    allowNull:false
  },
  username:{
    type:DataTypes.STRING,
    allowNull:false
  },
  content:{
    type:DataTypes.TEXT,
    allowNull:false,
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci'
  },
  imgUrl:{
    type:DataTypes.STRING,
    defaultValue:""
  },
  likes:{
    type:DataTypes.INTEGER,
    defaultValue:0
  },
  comments:{
    type:DataTypes.INTEGER,
    defaultValue:0
  }
},{
  tableName:"communityposts",
  charset: 'utf8mb4',
  collate: 'utf8mb4_unicode_ci'
});

CommunityPost.belongsTo(User, { foreignKey: 'userId' });
User.hasMany(CommunityPost, { foreignKey: 'userId' });

module.exports = CommunityPost;