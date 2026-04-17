const { DataTypes } = require("sequelize");
const sequelize = require("../database");
const Category = require("./category");
const Product = require("./product");
const Order = require("./order");
const User = require("./user");
const Pet = require("./pet");
const Foster = require("./foster");

Category.hasMany(Product, {
  foreignKey: "categoryId"
});
Product.belongsTo(Category, {
  foreignKey: "categoryId"
});
User.hasMany(Pet, {
  foreignKey: "userId"
});
Pet.belongsTo(User, {
  foreignKey: "userId"
});
Pet.hasMany(Foster, {
  foreignKey: "petId"
});
Foster.belongsTo(Pet, {
  foreignKey: "petId"
});
User.hasMany(Foster, {
  foreignKey: "userId"
});
Foster.belongsTo(User, {
  foreignKey: "userId"
});
module.exports = {
  Category,
  Product,
  Order,
  User,
  Pet,
  Foster
};