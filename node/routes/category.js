const express = require("express");
const router = express.Router();
const Category = require("../models/category");

// 分类列表
router.get("/list", async (req, res) => {
  try {
    const list = await Category.findAll();
    res.json({ code: 200, data: list });
  } catch (err) {
    res.json({ code: 500, message: err.message });
  }
});

// 添加分类（修复500错误）
router.post("/add", async (req, res) => {
  try {
    // 接收前端参数：name
    const { name } = req.body;
    const category = await Category.create({ name });
    res.json({ code: 200, message: "分类创建成功", data: category });
  } catch (err) {
    console.error("新增分类错误：", err);
    res.json({ code: 500, message: err.message });
  }
});

// 编辑分类
router.put("/update/:id", async (req, res) => {
  try {
    await Category.update(req.body, { where: { id: req.params.id } });
    res.json({ code: 200, message: "修改成功" });
  } catch (err) {
    res.json({ code: 500, message: err.message });
  }
});

// 删除分类
router.delete("/delete/:id", async (req, res) => {
  try {
    await Category.destroy({ where: { id: req.params.id } });
    res.json({ code: 200, message: "删除成功" });
  } catch (err) {
    res.json({ code: 500, message: err.message });
  }
});

module.exports = router;