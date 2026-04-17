const express = require("express");
const router = express.Router();
const { Pet } = require("../models");

// 用户端创建宠物档案
router.post("/add", async (req, res) => {
  try {
    console.log("前端传入数据：", req.body);
    const { userId, userName, userPhone, petName, petType, age, weight, vaccine, allergy, feeding, note } = req.body;

    if (!userId || !userName || !petName || !petType || !vaccine) {
      return res.status(400).json({ code: 400, message: "必填字段不能为空" });
    }

    const pet = await Pet.create({
      userId,
      userName,
      userPhone: userPhone || "",
      petName,
      petType,
      age,
      weight,
      vaccine,
      allergy,
      feeding,
      note
    });

    console.log("数据库写入成功：", pet.toJSON());
    res.json({ code: 200, message: "宠物档案创建成功", data: pet });
  } catch (err) {
    console.error("创建失败：", err);
    res.status(500).json({ code: 500, message: "创建失败：" + err.message });
  }
});

// 获取宠物档案列表
router.get("/list", async (req, res) => {
  try {
    const { userId } = req.query;
    const where = userId ? { userId } : {};
    const pets = await Pet.findAll({ where, order: [["id", "DESC"]] });
    res.json({ code: 200, data: pets, message: "获取成功" });
  } catch (error) {
    res.json({ code: 500, data: [], message: "获取失败" });
  }
});

// 🔥 新增：修改/更新宠物档案接口（适配前端编辑功能）
router.put("/update/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { petName, petType, age, weight, vaccine, allergy, feeding, note } = req.body;

    // 基础校验
    if (!petName || !petType || !vaccine) {
      return res.status(400).json({ code: 400, message: "必填字段不能为空" });
    }

    // 执行更新
    const [updatedRow] = await Pet.update(
      { petName, petType, age, weight, vaccine, allergy, feeding, note },
      { where: { id } }
    );

    if (updatedRow === 0) {
      return res.json({ code: 400, message: "未找到该宠物档案" });
    }

    res.json({ code: 200, message: "宠物档案修改成功" });
  } catch (err) {
    console.error("修改失败：", err);
    res.status(500).json({ code: 500, message: "修改失败：" + err.message });
  }
});

// 删除档案
router.delete("/delete/:id", async (req, res) => {
  try {
    await Pet.destroy({ where: { id: req.params.id } });
    res.json({ code: 200, message: "删除成功" });
  } catch (error) {
    res.json({ code: 500, message: "删除失败" });
  }
});

module.exports = router;