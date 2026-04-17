const { DataTypes, Model } = require("sequelize");
const sequelize = require("../database");

const Product = sequelize.define("Product",{
  id:{
    type:DataTypes.INTEGER,
    primaryKey:true,
    autoIncrement:true
  },
  // 商品名称
  name:{
    type:DataTypes.STRING,
    allowNull:false
  },
  // 售价
  price:{
    type:DataTypes.DECIMAL(10,2),
    allowNull:false
  },
  // 原价
  originalPrice:{
    type:DataTypes.DECIMAL(10,2),
    allowNull:true
  },
  // 库存
  stock:{
    type:DataTypes.INTEGER,
    defaultValue:0
  },
  // 商品描述
  description:{
    type:DataTypes.TEXT
  },
  // 分类ID
  categoryId:{
    type:DataTypes.INTEGER
  },
  model:{ type:DataTypes.STRING, allowNull:true }, // 3D模型文件URL
  detailImages:{ type:DataTypes.TEXT, allowNull:true }, // 详情图
  video:{ type:DataTypes.STRING, allowNull:true }, // 商品视频
  brand:{ type:DataTypes.STRING, allowNull:true }, // 品牌
  origin:{ type:DataTypes.STRING, allowNull:true }, // 产地
  spec:{ type:DataTypes.STRING, allowNull:true }, // 规格
  unit:{ type:DataTypes.STRING, allowNull:true, defaultValue:"件" }, // 单位（件/个/袋）

  // 宠物类型映射
  status:{
    type:DataTypes.ENUM("online","offline"),
    defaultValue:"online"
  },
  sort:{ type:DataTypes.INTEGER, defaultValue:0 }

},{
  tableName:"products"
});

module.exports = Product;