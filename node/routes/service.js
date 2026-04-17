const express = require('express');
const router = express.Router();
const ServiceMsg = require('../models/ServiceMsg');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { Op } = require('sequelize');

// ✅ 固定客服ID
const SERVICE_USER_ID = 1;

// 图片上传配置
const imageDir = path.join(__dirname, '../public/images');
if (!fs.existsSync(imageDir)) {
  fs.mkdirSync(imageDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, imageDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const fileName = `chat_${Date.now()}_${Math.random().toString(36).slice(2)}${ext}`;
    cb(null, fileName);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('仅支持上传图片'), false);
    }
  },
  limits: { fileSize: 20 * 1024 * 1024 }
});

// 商家端：获取总未读消息数（客户发给商家的）
router.get('/unread/count', async (req, res) => {
  try {
    const totalUnread = await ServiceMsg.count({
      where: {
        type: 'user',
        toUserId: SERVICE_USER_ID,
        isRead: 0
      }
    });
    res.json({ code: 200, data: totalUnread });
  } catch (err) {
    console.error('获取总未读数失败：', err);
    res.json({ code: 500, data: 0 });
  }
});

// 1. 用户发送文字消息给客服
router.post('/send', async (req, res) => {
  try {
    const { userId, username, content } = req.body;
    await ServiceMsg.create({
      userId, 
      username, 
      content, 
      type: 'user', 
      toUserId: SERVICE_USER_ID, 
      isRead: false
    });
    res.json({ code: 200, msg: '发送成功' });
  } catch (error) {
    console.error('用户发送失败：', error);
    res.json({ code: 500, msg: '发送失败' });
  }
});

// 2. 用户发送图片消息给客服
router.post('/send/image', upload.single('image'), async (req, res) => {
  try {
    const { userId, username } = req.body;
    const imageUrl = `/images/${req.file.filename}`;
    await ServiceMsg.create({
      userId, 
      username, 
      content: imageUrl, 
      type: 'user', 
      toUserId: SERVICE_USER_ID, 
      isRead: false
    });
    res.json({ code: 200, msg: '图片发送成功' });
  } catch (error) {
    console.error('用户图片发送失败：', error);
    res.json({ code: 500, msg: '图片发送失败' });
  }
});

// 3. 获取聊天记录（✅ 核心修复：区分商家端/客户端标记已读）
router.get('/history/:userId', async (req, res) => {
  try {
    const userId = Number(req.params.userId);
    const markRead = req.query.markRead === 'true';
    const source = req.query.source;

    // ✅ 区分端侧标记已读（终极修复）
    if (markRead) {
      if (source === 'admin') {
        // 商家端：标记【客户 → 客服】的消息为已读
        await ServiceMsg.update(
          { isRead: 1 },
          {
            where: {
              userId: userId,
              toUserId: SERVICE_USER_ID,
              isRead: 0
            }
          }
        );
      } else {
        // 客户端：标记【客服 → 客户】的消息为已读
        await ServiceMsg.update(
          { isRead: 1 },
          {
            where: {
              userId: SERVICE_USER_ID,
              toUserId: userId,
              isRead: 0
            }
          }
        );
      }
    }

    const list = await ServiceMsg.findAll({
      where: {
        [Op.or]: [
          { userId: userId, toUserId: SERVICE_USER_ID },
          { userId: SERVICE_USER_ID, toUserId: userId }
        ],
        type: { [Op.in]: ['user', 'service'] }
      },
      order: [['createdAt', 'ASC']]
    });

    const data = list.map(item => {
      const msg = item.toJSON();
      if (msg.userId === SERVICE_USER_ID) {
        msg.avatar = "/images/default_avatar.png";
      }
      return msg;
    });

    res.json({ code: 200, data });
  } catch (err) {
    console.error('聊天记录查询失败：', err);
    res.json({ code: 500, data: [] });
  }
});

// 4. 商家端：获取客户列表
router.get('/customer/list', async (req, res) => {
  try {
    const allMsgs = await ServiceMsg.findAll({ 
      attributes: ['userId'], 
      where: { type: 'user', toUserId: SERVICE_USER_ID },
      raw: true 
    });
    const userIds = [...new Set(allMsgs.map(item => item.userId))];

    const customerList = [];
    for (const userId of userIds) {
      const userMsg = await ServiceMsg.findOne({
        where: { userId, type: 'user', toUserId: SERVICE_USER_ID },
        order: [['createdAt', 'ASC']],
        raw: true
      });
      const lastMsg = await ServiceMsg.findOne({
        where: {
          [Op.or]: [
            { userId: userId, toUserId: SERVICE_USER_ID },
            { userId: SERVICE_USER_ID, toUserId: userId }
          ]
        },
        order: [['createdAt', 'DESC']],
        raw: true
      });
      const unreadCount = await ServiceMsg.count({
        where: { userId, type: 'user', toUserId: SERVICE_USER_ID, isRead: 0 }
      });

      if (lastMsg) {
        customerList.push({
          userId: userId,
          username: userMsg?.username || '客户',
          lastMsg: lastMsg.content.slice(0, 20) + (lastMsg.content.length > 20 ? '...' : ''),
          unread: unreadCount
        });
      }
    }

    res.json({ code: 200, data: customerList });
  } catch (err) {
    console.error('客户列表查询失败：', err);
    res.json({ code: 500, data: [] });
  }
});

// 5. 商家文字回复用户
router.post('/reply', async (req, res) => {
  try {
    const { userId, content } = req.body;
    await ServiceMsg.create({
      userId: SERVICE_USER_ID,
      username: '官方客服',
      content: content,
      type: 'service',
      toUserId: userId,
      isRead: false
    });
    res.json({ code: 200, msg: '回复成功' });
  } catch (err) {
    console.error('客服文字回复失败：', err);
    res.json({ code: 500, msg: '回复失败' });
  }
});

// 6. 商家图片回复用户
router.post('/reply/image', upload.single('image'), async (req, res) => {
  try {
    const { userId } = req.body;
    const imageUrl = `/images/${req.file.filename}`;
    await ServiceMsg.create({
      userId: SERVICE_USER_ID,
      username: '官方客服',
      content: imageUrl,
      type: 'service',
      toUserId: userId,
      isRead: false
    });
    res.json({ code: 200, msg: '图片回复成功' });
  } catch (error) {
    console.error('客服图片回复失败：', error);
    res.json({ code: 500, msg: '图片发送失败' });
  }
});

// 7. 客户端：获取未读消息数
router.get('/unread/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const count = await ServiceMsg.count({
      where: { 
        toUserId: userId,
        type: 'service',
        isRead: 0
      }
    });
    res.json({ code: 200, count });
  } catch (err) {
    console.error('客户端未读接口错误：', err);
    res.json({ code: 200, count: 0 });
  }
});

module.exports = router;