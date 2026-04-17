const { Sequelize } = require("sequelize");


const sequelize = new Sequelize("db_baby_planet", "root", "123456789", {
  host: "localhost",
  dialect: "mysql",
  port: 3306,
  charset: 'utf8mb4',
  collate: 'utf8mb4_unicode_ci',
  logging: false
  
});

sequelize.authenticate()
  .then(() => {
    console.log("数据库连接成功");
  })
  .catch(err => {
    console.error("数据库连接失败:", err);
  });

module.exports = sequelize;