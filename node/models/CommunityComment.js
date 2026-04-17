const { DataTypes } = require("sequelize");
const sequelize = require("../database");

const CommunityComment = sequelize.define("CommunityComment",{
  id:{
    type:DataTypes.INTEGER,
    primaryKey:true,
    autoIncrement:true
  },
  postId:{
    type:DataTypes.INTEGER,
    allowNull:false
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
    allowNull:false
  },
  parentId:{
    type:DataTypes.INTEGER,
    defaultValue: 0,
    allowNull:false
  },
  likes:{
    type:DataTypes.INTEGER,
    defaultValue: 0
  }
},{
  tableName:"communitycomments",
  timestamps: true,
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
});

CommunityComment.belongsTo(sequelize.models.User, { foreignKey: 'userId' });

module.exports = CommunityComment;