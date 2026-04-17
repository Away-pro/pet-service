const express = require("express");
const router = express.Router();
const User = require("../models/user");
const bcrypt = require('bcryptjs')

/* 注册：密码加密存储 */
router.post("/register", async (req, res) => {
  try {
    const { username, password, email, phone } = req.body;
    
    // 1. 密码加密（核心）
    const salt = await bcrypt.genSalt(10);
    const encryptedPwd = await bcrypt.hash(password, salt);

    // 2. 创建用户（存储加密密码）
    const user = await User.create({
      username,
      password: encryptedPwd,
      email,
      phone: phone || '' // 兼容前端传参
    });

    res.json({
      code:200,
      message:"注册成功",
      data:user
    });
  } catch (error) {
    res.json({ code: 500, message: "注册失败：" + error.message });
  }
});

/* 登录：验证加密密码 */
router.post("/login", async (req, res) => {
  try {
    const { phone, password } = req.body; // 适配前端手机号登录

    // 1. 根据手机号查询用户（你前端用手机号登录）
    const user = await User.findOne({ where:{ phone } });
    if(!user){
      return res.json({ code:401, message:"用户名或密码错误" });
    }

    // 2. 对比加密密码（核心）
    const isMatch = await bcrypt.compare(password, user.password);
    if(!isMatch){
      return res.json({ code:401, message:"用户名或密码错误" });
    }

    // 3. 登录成功
    res.json({
      code:200,
      message:"登录成功",
      data:user
    });

  } catch (error) {
    res.json({ code: 500, message: "登录失败：" + error.message });
  }
});

/* 用户列表 */
router.get("/list", async (req,res)=>{
  const users = await User.findAll();
  res.json({ code:200, data:users });
});

/* 删除用户 */
router.delete("/delete/:id", async (req,res)=>{
  const id = req.params.id;
  await User.destroy({ where:{id} });
  res.json({ code:200, message:"删除成功" });
});

/* 修改用户：新密码加密，不修改原密码 */
router.put("/update/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const { username, password, email } = req.body;

    // 构建更新对象
    const updateData = { username, email };

    // 仅当传入新密码时，才加密并更新密码
    if(password && password.trim() !== ''){
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(password, salt);
    }

    // 执行更新
    const [affectedRows] = await User.update(updateData, { where: { id } });

    if (affectedRows > 0) {
      res.json({ code: 200, message: "修改成功" });
    } else {
      res.json({ code: 404, message: "未找到该用户" });
    }
  } catch (error) {
    console.error("更新用户失败：", error);
    res.json({ code: 500, message: "更新失败：" + error.message });
  }
});

// ==============================================
// 🔥 新增：用户修改密码（适配前端，兼容原有模型）
// ==============================================
router.post("/change-password", async (req, res) => {
  try {
    const { userId, oldPassword, newPassword } = req.body;

    // 1. 校验必填参数
    if (!userId || !oldPassword || !newPassword) {
      return res.json({ code: 400, message: "参数不能为空" });
    }
    // 2. 校验新密码长度
    if (newPassword.length < 6 || newPassword.length > 20) {
      return res.json({ code: 400, message: "密码长度需为6-20位" });
    }

    // 3. 查询用户
    const user = await User.findByPk(userId);
    if (!user) {
      return res.json({ code: 404, message: "用户不存在" });
    }

    // 4. 校验旧密码是否正确
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.json({ code: 400, message: "旧密码错误" });
    }

    // 5. 加密新密码
    const salt = await bcrypt.genSalt(10);
    const newPwd = await bcrypt.hash(newPassword, salt);

    // 6. 更新密码
    await user.update({ password: newPwd });

    res.json({ code: 200, message: "密码修改成功" });
  } catch (error) {
    console.error("修改密码失败：", error);
    res.json({ code: 500, message: "修改密码失败：" + error.message });
  }
});

module.exports = router;