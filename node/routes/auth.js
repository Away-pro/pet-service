const express = require('express');
const router = express.Router();
const User = require('../models/user');
// 引入加密和token库
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// 【密钥】正式项目请修改，比赛可固定使用
const SECRET_KEY = "pet_admin_2026";

// 注册接口（密码加密存储）
router.post('/register', async (req, res) => {
  try {
    const { username, email, phone, password } = req.body;

    // 必填校验
    if (!username || !email || !phone || !password) {
      return res.status(400).json({ code: 400, message: '所有字段均为必填项' });
    }

    // 手机号重复校验
    const existingUser = await User.findOne({ where: { phone } });
    if (existingUser) {
      return res.status(400).json({ code: 400, message: '该手机号已注册' });
    }

    // 邮箱格式校验
    const emailReg = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailReg.test(email)) {
      return res.status(400).json({ code: 400, message: '邮箱格式不正确' });
    }

    // ========== 密码加密（核心） ==========
    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(password, salt);

    // 创建用户（存入加密密码）
    const newUser = await User.create({
      username,
      email,
      phone,
      password: hashPassword, // 加密密码
    });

    res.status(200).json({
      code: 200,
      message: '注册成功',
      data: { 
        id: newUser.id, 
        username: newUser.username, 
        email: newUser.email,
        phone: newUser.phone 
      }
    });

  } catch (error) {
    res.status(500).json({ code: 500, message: '服务器错误', error: error.message });
  }
});

// 登录接口（JWT生成 + 密码验证）
router.post('/login', async (req, res) => {
  try {
    const { phone, password } = req.body;

    // 查询用户
    const user = await User.findOne({ where: { phone } });
    if (!user) {
      return res.status(400).json({ code: 400, message: '用户不存在' });
    }

    // ========== 验证加密密码（核心） ==========
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ code: 400, message: '密码错误' });
    }

    // ========== 生成JWT令牌（24小时有效） ==========
    const token = jwt.sign(
      { 
        id: user.id,
        username: user.username,
        phone: user.phone,
        role: user.role 
      },
      SECRET_KEY,
      { expiresIn: "24h" }
    );

    // 返回给前端
    res.status(200).json({
      code: 200,
      message: '登录成功',
      token,
      user: { 
        id: user.id, 
        username: user.username,
        email: user.email,
        phone: user.phone, 
        role: user.role 
      }
    });

  } catch (error) {
    res.status(500).json({ code: 500, message: '服务器错误', error: error.message });
  }
});

module.exports = router;