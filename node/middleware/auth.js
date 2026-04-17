// 后台接口权限校验（仅管理员可访问）
module.exports = (req, res, next) => {
  const token = req.headers.authorization;
  if (!token || token !== 'ADMIN_ROOT') {
    return res.json({ code: 401, message: "请先登录管理员账号" });
  }
  next();
};