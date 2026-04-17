const express = require("express");
const router = express.Router();
const Product = require("../models/product");
const Category = require("../models/category");
// 🔥 导入模糊查询操作符
const { Op } = require("sequelize");

// 商品列表（支持：名称搜索+分类筛选+宠物类型筛选）
router.get("/list", async (req, res) => {
  try {
    const { categoryId, apply_pet, name } = req.query;
    const where = {};

    // 1. 商品分类筛选
    if (categoryId) where.categoryId = categoryId;

    // 2. 商品名称模糊搜索
    if (name) where.name = { [Op.like]: `%${name}%` };

    // 3. 宠物类型筛选
    const petSortMap = {
      '狗': 1, '狗狗': 1,
      '猫': 2, '猫咪': 2,
      '鸟': 3,
      '小宠': 4,
      '通用': 0
    };
    if (apply_pet && petSortMap[apply_pet] !== undefined) {
      where.sort = petSortMap[apply_pet];
    }

    // 查询商品+关联分类
    const products = await Product.findAll({
      where,
      order: [["id", "DESC"]],
      include: [{ model: Category, as: 'Category' }]
    });

    res.json({ code: 200, data: products });
  } catch (error) {
    console.error(error);
    res.json({ code: 500, data: [], msg: "获取商品失败" });
  }
});

// 添加商品
router.post("/add", async (req, res) => {
  try {
    const product = await Product.create(req.body);
    res.json({ code: 200, message: "商品新增成功", data: product });
  } catch (err) {
    console.error(err);
    res.json({ code: 500, message: err.message });
  }
});

// 修改商品
router.put("/update/:id", async (req, res) => {
  try {
    await Product.update(req.body, { where: { id: req.params.id } });
    res.json({ code: 200, message: "商品修改成功" });
  } catch (err) {
    res.json({ code: 500, message: err.message });
  }
});

// 删除商品
router.delete("/delete/:id", async (req, res) => {
  try {
    await Product.destroy({ where: { id: req.params.id } });
    res.json({ code: 200, message: "商品删除成功" });
  } catch (err) {
    res.json({ code: 500, message: err.message });
  }
});

module.exports = router;