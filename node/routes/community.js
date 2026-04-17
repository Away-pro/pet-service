const express = require("express");
const router = express.Router();
const CommunityPost = require("../models/CommunityPost");
const CommunityComment = require("../models/CommunityComment");
const CommunityUserProfile = require("../models/CommunityUserProfile");
const CommunityFollow = require('../models/CommunityFollow');
const ServiceMsg = require('../models/ServiceMsg');
const User = require('../models/user');
const CommunityActivity = require("../models/CommunityActivity");
const sequelize = require('../database');
const { Op } = require("sequelize");

// ====================== 图片上传配置 ======================
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, "../public/images");
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const filename = Date.now() + ext;
    cb(null, filename);
  }
});

const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

router.post("/upload", upload.single("file"), (req, res) => {
  if (!req.file) return res.json({ code: 400, msg: "上传失败" });
  const url = `/images/${req.file.filename}`;
  res.json({ code: 200, data: url });
});

// ====================== 用户/好友相关接口 ======================
router.get('/user/profile', async (req, res) => {
  try {
    const userId = req.query.userId; 
    if (!userId || isNaN(userId)) return res.status(401).json({ msg: "请先登录" });
    const user = await User.findByPk(userId);
    if (!user) return res.status(401).json({ msg: "用户不存在，请重新登录" });
    let profile = await CommunityUserProfile.findOne({ 
      where: { userId },
      include: [{ model: User, attributes: ['id', 'username'] }]
    });
    if (!profile) {
      await CommunityUserProfile.create({
        userId,
        signature: "养宠达人 | 分享宠物日常",
        gender: "secret",
        birthday: null,
        location: "",
        avatar: ""
      });
      profile = await CommunityUserProfile.findOne({ 
        where: { userId },
        include: [{ model: User, attributes: ['id', 'username'] }]
      });
    }
    res.json({ code: 200, data: profile });
  } catch (err) {
    console.error("获取用户资料失败:", err);
    res.status(500).json({ msg: "获取资料失败" });
  }
});

router.get("/friend/check-follow", async (req, res) => {
  try {
    const { followerId, followingId } = req.query;
    if (!followerId || !followingId) return res.json({ code: 400, msg: "参数缺失" });
    const followRecord = await CommunityFollow.findOne({ where: { followerId, followingId } });
    res.json({ code: 200, data: { isFollowed: !!followRecord } });
  } catch (error) {
    res.json({ code: 500, msg: "查询关注状态失败" });
  }
});

router.post("/user/profile/update", async (req, res) => {
  try {
    const { userId, signature, gender, birthday, location, avatar } = req.body;
    if (!userId) return res.json({ code: 400, msg: "userId 不能为空" });
    let profile = await CommunityUserProfile.findOne({ where: { userId } });
    if (!profile) {
      profile = await CommunityUserProfile.create(req.body);
    } else {
      await profile.update(req.body);
    }
    res.json({ code: 200, msg: "保存成功", data: profile });
  } catch (error) {
    res.json({ code: 500, msg: "保存失败" });
  }
});

// ====================== 私信相关接口 ======================
router.get("/friend/message-list", async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.json({ code: 400, msg: "userId不能为空" });
    const messages = await ServiceMsg.findAll({
      where: { type: 'friend', [Op.or]: [{ userId: userId }, { toUserId: userId }] },
      attributes: ['userId', 'toUserId']
    });
    const contactIds = new Set();
    messages.forEach(msg => {
      if (msg.userId == userId) contactIds.add(msg.toUserId);
      if (msg.toUserId == userId) contactIds.add(msg.userId);
    });
    if (contactIds.size === 0) return res.json({ code: 200, data: [] });
    const contacts = await User.findAll({
      where: { id: Array.from(contactIds) },
      include: [{ model: CommunityUserProfile, attributes: ["avatar"], required: false }]
    });
    const result = await Promise.all(contacts.map(async (item) => {
      const unreadCount = await ServiceMsg.count({
        where: { type: 'friend', userId: item.id, toUserId: userId, isRead: 0 }
      });
      const lastMessage = await ServiceMsg.findOne({
        where: { type: 'friend', [Op.or]: [{ userId: item.id, toUserId: userId }, { userId: userId, toUserId: item.id }] },
        order: [['createdAt', 'DESC']]
      });
      return {
        id: item.id,
        username: item.username || `用户${item.id}`,
        avatar: item.CommunityUserProfile?.avatar || "/images/default_avatar.png",
        unreadCount: unreadCount,
        lastMsg: lastMessage?.content || '',
        lastTime: lastMessage?.createdAt || null
      };
    }));
    res.json({ code: 200, data: result });
  } catch (error) {
    console.error("获取消息联系人失败:", error);
    res.json({ code: 500, msg: "获取消息联系人失败" });
  }
});

router.get("/friend/message/list", async (req, res) => {
  try {
    const { userId, friendId } = req.query;
    if (!userId || !friendId) return res.json({ code: 400, msg: "参数缺失" });
    const messages = await ServiceMsg.findAll({
      where: { type: 'friend', [Op.or]: [{ userId: userId, toUserId: friendId }, { userId: friendId, toUserId: userId }] },
      order: [['createdAt', 'ASC']]
    });
    res.json({ code: 200, data: messages });
  } catch (error) {
    console.error("获取聊天记录失败:", error);
    res.json({ code: 500, msg: "获取聊天记录失败" });
  }
});

router.post('/friend/message/send', async (req, res) => {
  try {
    const { userId, friendId, content } = req.body;
    const sender = await User.findByPk(userId);
    await ServiceMsg.create({
      userId: userId,
      username: sender?.username || '用户',
      content: content,
      type: 'friend',
      toUserId: friendId,
      isRead: 0
    });
    res.json({ code: 200, msg: '发送成功' });
  } catch (error) {
    console.error("发送消息失败:", error);
    res.json({ code: 500, msg: '发送失败' });
  }
});

router.post('/friend/message/read', async (req, res) => {
  try {
    const { userId, friendId } = req.body;
    await ServiceMsg.update(
      { isRead: 1 },
      { where: { type: 'friend', userId: friendId, toUserId: userId, isRead: 0 } }
    );
    res.json({ code: 200, msg: '标记已读成功' });
  } catch (error) {
    console.error("标记已读失败:", error);
    res.json({ code: 500, msg: "标记已读失败" });
  }
});

router.get("/friend/list", async (req, res) => {
  try {
    const currentUserId = req.query.currentUserId;
    const users = await User.findAll({ 
      limit: 10, 
      include: [{ model: CommunityUserProfile, attributes: ["avatar"] }] 
    });
    const followRecords = await CommunityFollow.findAll({ where: { followerId: currentUserId } });
    const followingIds = followRecords.map(item => item.followingId);
    const data = users.map(item => ({
      id: item.id,
      username: item.username || `用户${item.id}`,
      avatar: item.CommunityUserProfile?.avatar || '/images/default_avatar.png',
      isFollowed: followingIds.includes(item.id)
    }));
    res.json({ code: 200, data: data });
  } catch (error) {
    res.json({ code: 500, msg: "获取宠友列表失败" });
  }
});

// ====================== 关注/点赞/评论接口（修复：删除所有非法字段） ======================
router.post("/friend/follow", async (req, res) => {
  try {
    const { followerId, followingId } = req.body;
    if (followerId == followingId) return res.json({ code: 400, msg: "不能关注自己" });
    const existFollow = await CommunityFollow.findOne({ where: { followerId, followingId } });
    if (existFollow) return res.json({ code: 400, msg: "已关注该用户" });

    await CommunityFollow.create(req.body);
    const follower = await User.findByPk(followerId);
    const followerProfile = await CommunityUserProfile.findOne({ where: { userId: followerId } });
    await ServiceMsg.create({
      userId: followerId,
      toUserId: followingId,
      username: follower?.username || '用户',
      avatar: followerProfile?.avatar || "/images/default_avatar.png",
      content: "关注了你",
      type: "follow",
      isRead: 0
    });

    res.json({ code: 200, msg: "关注成功" });
  } catch (err) {
    console.error("关注失败:", err);
    res.json({ code: 500, msg: "关注失败" });
  }
});

router.post("/friend/unfollow", async (req, res) => {
  try {
    await CommunityFollow.destroy({ where: req.body });
    res.json({ code: 200, msg: "取消关注成功" });
  } catch (err) {
    res.json({ code: 500, msg: "操作失败" });
  }
});

router.get("/post/list", async (req, res) => {
  try {
    const list = await CommunityPost.findAll({ 
      order: [["createdAt", "DESC"]],
      include: [{ model: User, attributes: ["username"], include: [{ model: CommunityUserProfile, attributes: ["avatar"] }] }]
    });
    const result = list.map(item => {
      const data = item.toJSON();
      data.username = data.User?.username || "匿名用户";
      data.avatar = data.User?.CommunityUserProfile?.avatar || '/images/default_avatar.png';
      delete data.User;
      return data;
    });
    res.json({ code: 200, data: result });
  } catch (error) {
    res.json({ code: 200, data: [] });
  }
});

router.post("/post/add", async (req, res) => {
  try {
    await CommunityPost.create(req.body);
    res.json({ code: 200, msg: "发布成功" });
  } catch (error) {
    res.json({ code: 500, msg: "发布失败" });
  }
});

router.get("/post/detail", async (req, res) => {
  try {
    const post = await CommunityPost.findByPk(req.query.id, {
      include: [{ 
        model: User, 
        attributes: ["username"], 
        include: [{ model: CommunityUserProfile, attributes: ["avatar"], required: false }] 
      }]
    });
    const comments = await CommunityComment.findAll({ 
      where: { postId: req.query.id }, 
      order: [["createdAt", "ASC"]] 
    });

    const postData = post ? post.toJSON() : {};
    postData.username = postData.User?.username || "匿名用户";
    postData.avatar = postData.User?.CommunityUserProfile?.avatar || "/images/default_avatar.png";
    delete postData.User;

    const commentWithAvatar = await Promise.all(
      comments.map(async (comment) => {
        const commentData = comment.toJSON();
        const user = await User.findByPk(commentData.userId, {
          include: [{ model: CommunityUserProfile, attributes: ["avatar"], required: false }]
        });
        commentData.avatar = user?.CommunityUserProfile?.avatar || "/images/default_avatar.png";
        commentData.children = [];
        return commentData;
      })
    );

    postData.comments = commentWithAvatar;
    res.json({ code: 200, data: postData });
  } catch (error) {
    console.error("获取动态详情失败:", error);
    res.json({ code: 500, msg: "获取详情失败" });
  }
});

// 🔥 修复：帖子点赞 - 删除非法字段，拼接ID到内容
router.post("/post/like", async (req, res) => {
  try {
    const { id: postId, userId: likeUserId, isLiked } = req.body;
    if (!likeUserId) {
      return res.json({ code: 400, msg: "请先登录" });
    }

    const post = await CommunityPost.findByPk(postId);
    if (!post) return res.json({ code: 404, msg: "帖子不存在" });

    if (isLiked) {
      await CommunityPost.increment({ likes: 1 }, { where: { id: postId } });
      
      const likeUser = await User.findByPk(likeUserId);
      const profile = await CommunityUserProfile.findOne({ where: { userId: likeUserId } });
      
      if (likeUserId !== post.userId) {
        await ServiceMsg.create({
          userId: likeUserId,
          toUserId: post.userId,
          username: likeUser?.username || "匿名用户",
          avatar: profile?.avatar || "/images/default_avatar.png",
          // 拼接ID，不修改模型
          content: `赞了你的帖子[postId:${postId}]`,
          type: "like",
          isRead: 0
        });
      }
    } else {
      await CommunityPost.decrement(
        { likes: 1 },
        { where: { id: postId, likes: { [Op.gt]: 0 } } }
      );
    }

    res.json({ code: 200, msg: isLiked ? "点赞成功" : "取消点赞成功" });
  } catch (error) {
    console.error("文章点赞报错:", error);
    res.json({ code: 500, msg: "操作失败" });
  }
});

// 🔥 修复：评论/回复 - 删除非法字段，拼接ID到内容
router.post("/comment/add", async (req, res) => {
  try {
    const { postId, userId, username, content, parentId = 0 } = req.body;
    const post = await CommunityPost.findByPk(postId);
    if (!post) return res.json({ code: 404, msg: "帖子不存在" });

    const newComment = await CommunityComment.create({ postId, userId, username, content, parentId });
    await CommunityPost.increment({ comments: 1 }, { where: { id: postId } });

    if (userId === post.userId) {
      return res.json({ code: 200, msg: "评论成功" });
    }

    const commentUserProfile = await CommunityUserProfile.findOne({ where: { userId } });

    if (parentId > 0) {
      const parentComment = await CommunityComment.findByPk(parentId);
      if (parentComment && parentComment.userId !== userId) {
        await ServiceMsg.create({
          userId: userId,
          toUserId: parentComment.userId,
          username: username || '用户',
          avatar: commentUserProfile?.avatar || "/images/default_avatar.png",
          content: `回复了你：${content}[postId:${postId},commentId:${newComment.id}]`,
          type: "comment",
          isRead: 0
        });
        return res.json({ code: 200, msg: "回复成功" });
      }
    }

    await ServiceMsg.create({
      userId: userId,
      toUserId: post.userId,
      username: username || '用户',
      avatar: commentUserProfile?.avatar || "/images/default_avatar.png",
      content: `${content}[postId:${postId}]`,
      type: "comment",
      isRead: 0
    });

    res.json({ code: 200, msg: "评论成功" });
  } catch (error) {
    console.error("评论发布失败:", error);
    res.json({ code: 500, msg: "评论失败" });
  }
});

// 🔥 修复：评论点赞 - 删除非法字段，拼接ID到内容
router.post("/comment/like", async (req, res) => {
  try {
    const { commentId, userId, isLiked } = req.body;
    if (!userId) {
      return res.json({ code: 400, msg: "用户ID不能为空，请登录后操作" });
    }

    const comment = await CommunityComment.findByPk(commentId);
    if (!comment) {
      return res.json({ code: 404, msg: "评论不存在" });
    }

    if (isLiked) {
      await CommunityComment.increment({ likes: 1 }, { where: { id: commentId } });

      const likeUser = await User.findByPk(userId);
      const likeUserProfile = await CommunityUserProfile.findOne({ where: { userId } });

      if (userId !== comment.userId) {
        await ServiceMsg.create({
          userId: userId,
          toUserId: comment.userId,
          username: likeUser?.username || '匿名用户',
          avatar: likeUserProfile?.avatar || "/images/default_avatar.png",
          content: `❤️ 赞了你的评论[postId:${comment.postId},commentId:${commentId}]`,
          type: "like",
          isRead: 0
        });
      }
    } else {
      await CommunityComment.decrement(
        { likes: 1 }, 
        { where: { id: commentId, likes: { [Op.gt]: 0 } } }
      );
    }

    res.json({ code: 200, msg: isLiked ? "点赞成功" : "取消点赞成功" });
  } catch (error) {
    console.error("评论点赞失败:", error);
    res.json({ code: 500, msg: `点赞失败: ${error.message}` });
  }
});

router.get("/post/my", async (req, res) => {
  try {
    const list = await CommunityPost.findAll({ where: { userId: req.query.userId }, order: [["createdAt", "DESC"]] });
    res.json({ code: 200, data: list });
  } catch (error) {
    res.json({ code: 500, msg: "获取我的动态失败" });
  }
});

router.post("/post/delete", async (req, res) => {
  try {
    await CommunityPost.destroy({ where: { id: req.body.id } });
    await CommunityComment.destroy({ where: { postId: req.body.id } });
    res.json({ code: 200, msg: "删除成功" });
  } catch (error) {
    res.json({ code: 500, msg: "删除失败" });
  }
});

router.post("/post/update", async (req, res) => {
  try {
    await CommunityPost.update({ content: req.body.content, imgUrl: req.body.imgUrl }, { where: { id: req.body.id } });
    res.json({ code: 200, msg: "修改成功" });
  } catch (error) {
    res.json({ code: 500, msg: "修改失败" });
  }
});

// ====================== 活动/管理接口 ======================
router.get("/activity/list", async (req, res) => {
  try {
    const list = await CommunityActivity.findAll({ order: [["createdAt", "DESC"]] });
    res.json({ code: 200, data: list });
  } catch (e) {
    res.json({ code: 500, data: [] });
  }
});

router.get("/activity/detail/:id", async (req, res) => {
  try {
    const activity = await CommunityActivity.findByPk(req.params.id);
    if (!activity) return res.json({ code: 404, msg: "活动不存在" });
    res.json({ code: 200, data: activity });
  } catch (e) {
    res.json({ code: 500, msg: "获取活动详情失败" });
  }
});

router.get("/comment/list", async (req, res) => {
  try {
    const list = await CommunityComment.findAll({
      order: [["createdAt", "DESC"]],
      include: [{ model: User, attributes: ["username"] }]
    });
    const result = list.map(item => {
      const data = item.toJSON();
      data.username = data.User?.username || "匿名用户";
      delete data.User;
      return data;
    });
    res.json({ code: 200, data: result });
  } catch (e) {
    console.error(e);
    res.json({ code: 500, data: [] });
  }
});

router.post("/comment/delete", async (req, res) => {
  try {
    await CommunityComment.destroy({ where: { id: req.body.id } });
    res.json({ code: 200, msg: "删除成功" });
  } catch (e) {
    res.json({ code: 500, msg: "删除失败" });
  }
});

router.get("/user/list", async (req, res) => {
  try {
    const { keyword } = req.query;
    const where = {};
    if (keyword) {
      where.username = { [Op.like]: `%${keyword}%` };
    }
    const users = await User.findAll({
      where,
      include: [{ model: CommunityUserProfile }]
    });
    const data = await Promise.all(users.map(async (u) => {
      const followCount = await CommunityFollow.count({ where: { followerId: u.id } });
      const followerCount = await CommunityFollow.count({ where: { followingId: u.id } });
      return {
        userId: u.id,
        username: u.username || `用户${u.id}`,
        avatar: u.CommunityUserProfile?.avatar || "/images/default_avatar.png",
        signature: u.CommunityUserProfile?.signature || "这家伙很懒~",
        followerCount: followerCount,
        followCount: followCount
      };
    }));
    res.json({ code: 200, data: data });
  } catch (e) {
    console.error(e);
    res.json({ code: 500, data: [] });
  }
});

router.post("/activity/save", async (req, res) => {
  try {
    const { id, title, content, status } = req.body;
    if (id) {
      await CommunityActivity.update({ title, content, status }, { where: { id } });
    } else {
      await CommunityActivity.create({ title, content, status });
    }
    res.json({ code: 200, msg: "保存成功" });
  } catch (e) {
    res.json({ code: 500, msg: "保存失败" });
  }
});

router.post("/activity/delete", async (req, res) => {
  try {
    await CommunityActivity.destroy({ where: { id: req.body.id } });
    res.json({ code: 200, msg: "删除成功" });
  } catch (e) {
    res.json({ code: 500, msg: "删除失败" });
  }
});

// ====================== 🔥 终极修复：系统消息接口（无模型修改、无反向查询） ======================
// ====================== 🔥 最终修复：系统消息接口（ID提取100%正确） ======================
router.get("/message/list", async (req, res) => {
  try {
    const { userId, type } = req.query;
    if (!userId || !type) return res.json({ code: 400, msg: "参数缺失" });

    const msgList = await ServiceMsg.findAll({
      where: { toUserId: userId, type: type },
      order: [["createdAt", "DESC"]],
      include: [{
        model: User,
        attributes: ['id', 'username'],
        include: [{ model: CommunityUserProfile, attributes: ['avatar'] }]
      }]
    });

    // ✅ 终极正则：无视前后字符，精准提取ID
    const formattedList = msgList.map(item => {
      const data = item.toJSON();
      let postId = null;
      let commentId = null;
      let showContent = data.content;

      // 提取postId：匹配「postId:数字」，兼容中英文冒号，无视前后字符
      const postMatch = data.content.match(/postId[:：](\d+)/);
      if (postMatch) postId = Number(postMatch[1]);

      // 提取commentId：匹配「commentId:数字」，兼容中英文冒号，无视前后字符
      const commentMatch = data.content.match(/commentId[:：](\d+)/);
      if (commentMatch) commentId = Number(commentMatch[1]);

      // 隐藏所有ID标记，给用户显示干净内容
      showContent = data.content.replace(/\[?\w+[:：]\d+\]?/g, '').trim();

      return {
        id: data.id,
        userId: data.userId,
        toUserId: data.toUserId,
        username: data.User?.username || data.username || "用户",
        avatar: data.User?.CommunityUserProfile?.avatar || "/images/default_avatar.png",
        content: showContent,
        type: data.type,
        isRead: data.isRead,
        createdAt: data.createdAt,
        postId: postId,
        commentId: commentId
      };
    });

    res.json({ code: 200, data: formattedList });
  } catch (error) {
    console.error("获取消息列表失败:", error);
    res.json({ code: 500, msg: "获取消息失败" });
  }
});

router.post("/message/read", async (req, res) => {
  try {
    const { msgId } = req.body;
    await ServiceMsg.update({ isRead: 1 }, { where: { id: msgId } });
    res.json({ code: 200, msg: "标记已读成功" });
  } catch (error) {
    res.json({ code: 500, msg: "操作失败" });
  }
});

router.post("/message/read-all", async (req, res) => {
  try {
    const { userId, type } = req.body;
    if (!userId || !type) return res.json({ code: 400, msg: "参数缺失" });
    await ServiceMsg.update(
      { isRead: 1 },
      { where: { toUserId: userId, type: type } }
    );
    res.json({ code: 200, msg: "全部已读" });
  } catch (error) {
    res.json({ code: 500, msg: "操作失败" });
  }
});

router.post("/message/clear", async (req, res) => {
  try {
    const { userId, type } = req.body;
    if (!userId || !type) return res.json({ code: 400, msg: "参数缺失" });
    await ServiceMsg.destroy({
      where: { toUserId: userId, type: type }
    });
    res.json({ code: 200, msg: "清空成功" });
  } catch (error) {
    res.json({ code: 500, msg: "清空失败" });
  }
});

router.get("/message/unread-count", async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.json({ code: 400, msg: "参数缺失" });

    const count = {
      like: await ServiceMsg.count({ where: { toUserId: userId, type: "like", isRead: 0 } }),
      follow: await ServiceMsg.count({ where: { toUserId: userId, type: "follow", isRead: 0 } }),
      comment: await ServiceMsg.count({ where: { toUserId: userId, type: "comment", isRead: 0 } }),
      system: await ServiceMsg.count({ where: { toUserId: userId, type: "system", isRead: 0 } }),
      chat: await ServiceMsg.count({ where: { toUserId: userId, type: "friend", isRead: 0 } })
    };

    res.json({ code: 200, data: count });
  } catch (error) {
    console.error("获取未读计数失败:", error);
    res.json({ code: 500, data: {} });
  }
});

module.exports = router;