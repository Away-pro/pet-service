// 引入核心模块
const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

// 数据库连接
const sequelize = require("./database/index.js");

// 引入权限中间件（仅管理员/商家后台使用！）
const auth = require("./middleware/auth");

// 引入所有路由
const loginRouter = require("./routes/login");
const userRouter = require("./routes/user");
const productRouter = require("./routes/product");
const categoryRouter = require('./routes/category');
const orderRouter = require("./routes/order");
const orderUserRouter = require('./routes/orderUser');
const petRouter = require('./routes/pet');
const fosterRouter = require('./routes/foster');
const authRoutes = require('./routes/auth');
const addressRouter = require('./routes/address');
const communityRouter = require('./routes/community');
const serviceRouter = require("./routes/service");
const uploadRouter = require("./routes/upload");

const CommunityFollow = require('./models/CommunityFollow');
const Category = require('./models/category');
const CommunityPost = require('./models/CommunityPost');
const CommunityComment = require('./models/CommunityComment');
const CommunityUserProfile = require('./models/CommunityUserProfile');
const User = require('./models/user');

const app = express();

// 全局中间件
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// 静态资源
const imageDir = path.join(__dirname, 'public/images');
if (!fs.existsSync(imageDir)) {
  fs.mkdirSync(imageDir, { recursive: true });
}

app.use(express.static(path.join(__dirname, 'public')));

app.use('/api', authRoutes);
app.use("/api/category", categoryRouter);
app.use("/api/address", addressRouter);
app.use("/api/user", userRouter);
app.use("/api/product", productRouter);
app.use("/api/order", orderRouter);
app.use("/api/user-order", orderUserRouter);
app.use("/api/pet", petRouter);
app.use("/api/foster", fosterRouter);
app.use("/api/login", loginRouter);
app.use("/api/login/login", loginRouter);
app.use('/api/community', communityRouter);
app.use("/api/service", serviceRouter);
app.use("/api/upload", uploadRouter);
app.use('/api', require('./routes/ai_route'));

app.use((err, req, res, next) => {
  console.error("🔥 服务器错误详情：", err);
  res.status(500).json({
    code: 500,
    msg: "服务器错误：" + err.message
  });
});

// 健康检查
app.get("/", (req, res) => {
  res.send("宠物寄养&用品商城一体化管理系统 - 服务启动成功！");
});

//数据库同步
sequelize.sync({ alter: false, force: false })
  .then(() => {
    console.log("✅ 数据库同步成功");
  })
  .catch(err => {
    console.error("❌ 数据库同步失败：", err);
  });

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});

module.exports = app;