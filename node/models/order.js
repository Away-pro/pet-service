const { DataTypes } = require("sequelize");
const sequelize = require("../database");
const Address = require("./address");

const Order = sequelize.define("Order", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  orderNo: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: "订单编号"
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: "用户ID"
  },
  userName: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: "用户名称"
  },
  userPhone: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: "联系电话"
  },
  goodsName: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: "商品名称"
  },
  address: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: "配送地址"
  },
  addressId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: Address,
      key: "id"
    },
    comment: "收货地址ID"
  },
  totalPrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    comment: "订单金额"
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: "待付款",
    comment: "订单状态"
  }
}, {
  tableName: "orders", 
  timestamps: true,
  createdAt: "createTime",
  updatedAt: "updateTime"
});
Order.belongsTo(Address, { foreignKey: "addressId", as: "orderAddress" });
Address.hasMany(Order, { foreignKey: "addressId" });

module.exports = Order;