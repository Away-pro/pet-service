const { DataTypes } = require("sequelize");
const sequelize = require("../database");

const OrderItem = sequelize.define("OrderItem",{

  id:{
    type:DataTypes.INTEGER,
    primaryKey:true,
    autoIncrement:true
  },

  orderId:{
    type:DataTypes.INTEGER
  },

  productId:{
    type:DataTypes.INTEGER
  },

  quantity:{
    type:DataTypes.INTEGER
  }

},{
  tableName:"order_items"
});

module.exports = OrderItem;