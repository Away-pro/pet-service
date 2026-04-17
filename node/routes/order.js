const express = require("express");
const router = express.Router();
const Order = require("../models/order");

// 🔥 核心：强制格式化时间，100% 匹配数据库本地时间，无时差
const formatTime = (time) => {
  if (!time) return "";
  const date = new Date(time);
  if (isNaN(date.getTime())) return "";

  // 直接提取 UTC 时间（不加减、不转换，和数据库完全一致）
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  const hours = String(date.getUTCHours()).padStart(2, "0");
  const minutes = String(date.getUTCMinutes()).padStart(2, "0");
  const seconds = String(date.getUTCSeconds()).padStart(2, "0");

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

// 获取订单列表
router.get("/list", async (req, res) => {
  try {
    const list = await Order.findAll({
      order: [["createTime", "DESC"]]
    });

    // 格式化所有时间
    const formattedList = list.map(item => {
      const data = item.toJSON();
      data.createTime = formatTime(data.createTime);
      return data;
    });

    res.json({ code: 200, data: formattedList });
  } catch (err) {
    res.json({ code: 500, message: err.message });
  }
});

// 修改订单状态
router.post("/update", async (req, res) => {
  try {
    const { id, status } = req.body;
    await Order.update({ status }, { where: { id } });
    res.json({ code: 200, message: "状态修改成功" });
  } catch (err) {
    res.json({ code: 500, message: err.message });
  }
});

module.exports = router;