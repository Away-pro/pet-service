const express = require('express');
const router = express.Router();

// 🔥 修复 1：重命名模型，避免冲突 + 大写规范
const Address = require('../models/address');

/**
 * 获取用户的收货地址列表
 * GET /address/list?userId=xxx
 */
router.get('/list', async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) {
      return res.json({ code: 400, msg: '用户ID不能为空' });
    }
    const list = await Address.findAll({
      where: { userId },
      order: [['isDefault', 'DESC']]
    });
    res.json({ code: 200, data: list, msg: '获取成功' });
  } catch (error) {
    res.json({ code: 500, msg: '获取失败', error: error.message });
  }
});

/**
 * 新增收货地址
 * POST /address/add
 */
router.post('/add', async (req, res) => {
  try {
    // 🔥 修复 2：绝不使用 address 作为变量名，彻底避免冲突
    const { userId, name, phone, address: region, detail, isDefault } = req.body;

    console.log("新增地址参数：", req.body);

    if (isDefault === 1) {
      await Address.update({ isDefault: 0 }, { where: { userId } });
    }

    // 🔥 修复 3：使用正确模型 Address 创建
    const newAddress = await Address.create({
      userId,
      name,
      phone,
      address: region, // 重命名后存入
      detail,
      isDefault: isDefault || 0
    });

    console.log("新增地址成功：", newAddress.toJSON());
    res.json({ code: 200, data: newAddress, msg: '新增成功' });
  } catch (error) {
    console.error("新增地址失败：", error);
    res.json({ code: 500, msg: '新增失败', error: error.message });
  }
});

/**
 * 编辑收货地址
 * POST /address/update
 */
router.post('/update', async (req, res) => {
  try {
    const { id, userId, name, phone, address: region, detail, isDefault } = req.body;
    if (isDefault === 1) {
      await Address.update({ isDefault: 0 }, { where: { userId } });
    }
    await Address.update(
      { name, phone, address: region, detail, isDefault: isDefault || 0 },
      { where: { id } }
    );
    res.json({ code: 200, msg: '修改成功' });
  } catch (error) {
    res.json({ code: 500, msg: '修改失败', error: error.message });
  }
});

/**
 * 设为默认地址
 * POST /address/default
 */
router.post('/default', async (req, res) => {
  try {
    const { id, userId } = req.body;
    await Address.update({ isDefault: 0 }, { where: { userId } });
    await Address.update({ isDefault: 1 }, { where: { id } });
    res.json({ code: 200, msg: '设置成功' });
  } catch (error) {
    res.json({ code: 500, msg: '设置失败', error: error.message });
  }
});

/**
 * 删除收货地址
 * POST /address/delete
 */
router.post('/delete', async (req, res) => {
  try {
    const { id } = req.body;
    await Address.destroy({ where: { id } });
    res.json({ code: 200, msg: '删除成功' });
  } catch (error) {
    res.json({ code: 500, msg: '删除失败', error: error.message });
  }
});

module.exports = router;