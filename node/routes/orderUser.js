const express = require('express');
const router = express.Router();

// 🔥 完全匹配你的项目：小写 address + 你的 Order + OrderItem
const Order = require('../models/order');
const OrderItem = require('../models/OrderItem');
const Address = require('../models/address');

// 用户创建订单（写入数据库）
router.post('/add', async (req, res) => {
  try {
    const { orderNo, userId, userName, userPhone, goodsName, address, addressId, totalPrice } = req.body;

    // 直接创建订单（适配你的表结构）
    const order = await Order.create({
      orderNo,
      userId,
      userName,
      userPhone,
      goodsName,
      address,
      addressId,
      totalPrice,
      status: '待付款'
    });

    res.json({ code: 200, data: order, msg: '订单创建成功' });
  } catch (error) {
    console.error('创建订单失败：', error);
    res.json({ code: 500, msg: '创建失败' });
  }
});

// 用户支付订单
router.post('/pay', async (req, res) => {
  try {
    const { orderId } = req.body;
    await Order.update(
      { status: '已付款' },
      { where: { id: orderId } }
    );
    res.json({ code: 200, msg: '支付成功' });
  } catch (error) {
    res.json({ code: 500, msg: '支付失败' });
  }
});

// 获取我的订单列表
router.get('/my', async (req, res) => {
  try {
    const { userId } = req.query;
    const orders = await Order.findAll({
      where: { userId },
      order: [['createTime', 'DESC']]
    });
    res.json({ code: 200, data: orders });
  } catch (error) {
    res.json({ code: 500, msg: '获取订单失败' });
  }
});

module.exports = router;