const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");

// 配置图片上传
const imageStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, "../public/productimages")),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + Math.round(Math.random() * 1000) + path.extname(file.originalname))
});
const imageUpload = multer({ storage: imageStorage });

// 配置视频上传
const videoStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, "../public/productvideo")),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + Math.round(Math.random() * 1000) + path.extname(file.originalname))
});
const videoUpload = multer({ storage: videoStorage });

// ===================== 新增：3D模型上传配置 =====================
const modelStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, "../public/model")),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + Math.round(Math.random() * 1000) + path.extname(file.originalname))
});
// 限制仅上传 glb/gltf 3D模型文件
const modelUpload = multer({ 
  storage: modelStorage,
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext === '.glb' || ext === '.gltf') {
      cb(null, true);
    } else {
      cb(new Error('仅支持 .glb / .gltf 格式的3D模型！'), false);
    }
  }
});

// 图片上传接口
router.post("/image", imageUpload.single("file"), (req, res) => {
  res.json({ code: 200, url: "/productimages/" + req.file.filename });
});

// 视频上传接口
router.post("/video", videoUpload.single("file"), (req, res) => {
  res.json({ code: 200, url: "/productvideo/" + req.file.filename });
});

// ===================== 新增：3D模型上传接口 =====================
router.post("/model", modelUpload.single("file"), (req, res) => {
  res.json({ code: 200, url: "/model/" + req.file.filename });
});

module.exports = router;