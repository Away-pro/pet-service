const express = require("express");
const router = express.Router();
const User = require("../models/user");

router.post("/", async (req, res) => {
  try {
    const { phone, password } = req.body;
    const user = await User.findOne({ where: { phone, password, role: "admin" } });

    if (!user) {
      return res.json({ code: 401, message: "账号/密码错误或无管理员权限" });
    }

    // 返回固定令牌（企业级简化版）
    res.json({
      code: 200,
      message: "登录成功",
      data: { token: "ADMIN_ROOT", username: user.username }
    });
  } catch (err) {
    res.json({ code: 500, message: err.message });
  }
});

module.exports = router;