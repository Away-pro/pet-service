const express = require("express");
const router = express.Router();
const { Foster, Pet } = require("../models"); // 引入 Pet 模型

// 【修改版】用户端：提交寄养预约（手机号从登录用户获取，自动关联宠物档案）
router.post("/add", async (req, res) => {
  try {
    // 接收前端传递的 userPhone（登录用户手机号）
    const { userId, petId, checkIn, checkOut, fosterType, unitPrice, totalPrice, userPhone } = req.body;

    // 校验必填参数（新增手机号校验）
    if (!userId || !petId || !checkIn || !checkOut || !fosterType || !unitPrice || !totalPrice || !userPhone) {
      return res.json({ code: 400, message: "必填参数不能为空" });
    }

    // 从宠物档案自动获取宠物名、主人姓名
    const pet = await Pet.findByPk(petId);
    if (!pet) {
      return res.json({ code: 400, message: "宠物档案不存在" });
    }

    // 写入数据库：手机号使用登录用户的，满足非空约束
    const foster = await Foster.create({
      userId,
      petId,
      petName: pet.petName,
      userName: pet.userName,
      userPhone: userPhone, // 🔥 核心修改：使用前端传递的登录用户手机号
      checkIn,
      checkOut,
      fosterType,
      unitPrice,
      totalPrice,
      status: "待审核"
    });

    res.json({ code: 200, message: "寄养预约提交成功", data: foster });
  } catch (err) {
    console.error("寄养预约写入失败：", err); // 打印错误日志
    res.json({ code: 500, message: err.message });
  }
});

// 核心：强制按东八区（UTC+8）格式化时间，彻底消除时区偏移（你原有代码，不动）
const formatTime = (time) => {
  if (!time) return "";

  const date = new Date(time);
  if (isNaN(date.getTime())) return "";

  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  const hours = String(date.getUTCHours()).padStart(2, "0");
  const minutes = String(date.getUTCMinutes()).padStart(2, "0");
  const seconds = String(date.getUTCSeconds()).padStart(2, "0");

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

router.get("/my", async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) {
      return res.json({ code: 400, msg: "用户ID不能为空" });
    }

    // 🔥 直接用你已定义的 Foster 模型（Sequelize标准写法，无SQL报错）
    const list = await Foster.findAll({
      where: { userId }, // 匹配用户ID
      order: [["id", "DESC"]], // 按时间倒序
    });

    res.json({
      code: 200,
      data: list,
      msg: "获取成功",
    });
  } catch (error) {
    console.error("查询失败：", error);
    res.json({ code: 500, msg: "获取失败" });
  }
});

// 获取寄养列表（你原有代码，不动）
router.get("/list", async (req, res) => {
  try {
    const fosters = await Foster.findAll({ order: [["id", "DESC"]] });

    const formattedFosters = fosters.map((foster) => {
      const data = foster.toJSON();
      data.checkIn = formatTime(data.checkIn);
      data.checkOut = formatTime(data.checkOut);
      return data;
    });

    res.json({ code: 200, data: formattedFosters });
  } catch (error) {
    res.json({ code: 500, data: [], msg: "获取失败" });
  }
});

// 删除寄养（你原有代码，不动）
router.delete("/delete/:id", async (req, res) => {
  try {
    await Foster.destroy({ where: { id: req.params.id } });
    res.json({ code: 200, msg: "删除成功" });
  } catch (error) {
    res.json({ code: 500, msg: "删除失败" });
  }
});

// 修改状态（你原有代码，不动）
router.put("/update/:id", async (req, res) => {
  try {
    await Foster.update(
      { status: req.body.status },
      { where: { id: req.params.id } }
    );
    res.json({ code: 200, msg: "状态更新成功" });
  } catch (error) {
    res.json({ code: 500, msg: "修改失败" });
  }
});

module.exports = router;