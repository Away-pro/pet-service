# 🐾 宠伴朝夕 - 一站式宠物服务平台
<p align="center">
  <a href="https://cn.vuejs.org/"><img src="https://img.shields.io/badge/Vue-3.x-4FC08D" alt="Vue"></a>
  <a href="https://nodejs.org/"><img src="https://img.shields.io/badge/Backend-Node.js-339933" alt="Node.js"></a>
  <a href="https://www.python.org/"><img src="https://img.shields.io/badge/AI-Python-3776AB" alt="Python"></a>
  <a href="https://chengzheng.xyz"><img src="https://img.shields.io/badge/🌐%20在线预览-chengzheng.xyz-blue" alt="在线预览"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-green" alt="License"></a>
</p>

<p align="center">
  <strong>面向宠物行业的全场景服务平台，集用户端、商家端、后端服务与AI健康顾问于一体的完整解决方案</strong><br>
  <a href="https://chengzheng.xyz">👉 立即体验：https://chengzheng.xyz</a>
</p>

> 面向宠物行业的**多端一体化服务平台**，包含用户端、商家端、后端服务与AI健康顾问，已正式上线：  
> 👉 **[在线预览：https://chengzheng.xyz](https://chengzheng.xyz)**  
> 项目仓库：[Away-pro/pet-service](https://github.com/Away-pro/pet-service)

---

## 📖 项目简介
本项目是面向宠物主人与商家的一站式服务平台，采用前后端分离架构，包含四大核心模块：
- **用户端（user_system）**：宠物电商、社区交流、寄养预约、AI健康咨询等C端服务
- **商家端（merchant_system）**：商品管理、订单处理、服务预约审核等B端后台
- **后端服务（node）**：统一API接口、数据管理、用户鉴权、业务逻辑处理
- **AI健康顾问（python-ai-service）**：基于大模型的宠物健康智能对话服务

---

## ✨ 核心功能
### 👤 用户端（user_system）
- 🏠 首页导航与智能搜索
- 🛒 宠伴商城：商品浏览、购物车、订单管理
- 🐾 宠物档案：多宠物信息维护、健康记录管理
- 🏡 寄养预约：服务查询、在线预约、订单追踪
- 💬 宠伴社区：帖子发布、评论互动、内容推荐
- 🤖 AI健康顾问：症状咨询、对话历史管理
- 👤 用户中心：个人信息、收藏、客服消息通知

### 🏪 商家端（merchant_system）
- 📦 商品管理：上下架、库存维护、分类管理
- 📋 订单管理：用户订单处理、状态更新
- 📅 服务管理：寄养服务信息维护、预约审核
- 📊 数据看板：订单统计、商品销量、用户数据概览
- 🔐 商家权限管理：多角色后台权限控制

### 🤖 AI健康顾问服务
- 宠物健康问题在线对话
- 症状分析与建议回复
- 流式打字机交互体验
- 对话上下文理解与记忆

---

## 🛠️ 技术栈
| 模块 | 技术栈 |
| :--- | :--- |
| **用户端前端** | Vue 3 (Composition API) + Vite + Element Plus + Vue Router + Axios |
| **商家端前端** | Vue 3 + Vite + Element Plus + 后台管理模板 |
| **后端服务** | Node.js + Express + MySQL + JWT 鉴权 |
| **AI服务** | Python + FastAPI + 对话式大模型 |
| **部署** | 宝塔Linux面板 + Nginx 反向代理 |

---

## 📁 项目结构
```
pet-service/
├── vue/                      # 前端项目目录
│   ├── user_system/          # 用户端（面向普通用户）
│   │   ├── public/           # 静态资源
│   │   ├── src/              # 业务代码
│   │   ├── index.html
│   │   ├── package.json
│   │   └── vite.config.js
│   └── merchant_system/      # 商家端（后台管理系统）
│       ├── admin/            # 后台管理页面
│       ├── public/
│       ├── src/
│       ├── index.html
│       └── vite.config.js
├── node/                     # 后端服务
│   ├── database/             # 数据库配置与初始化
│   ├── middleware/           # 中间件（鉴权、日志等）
│   ├── models/               # 数据库模型
│   ├── routes/               # API路由定义
│   ├── app.js                # 项目入口
│   └── package.json
├── python-ai-service/        # AI健康顾问服务
│   └── main.py               # 服务入口与核心逻辑
├── .gitignore
└── README.md
```

---

## 🚀 快速启动
### 环境要求
- Node.js >= 16.0.0
- Python >= 3.8
- MySQL >= 8.0

### 1. 克隆项目
```bash
git clone https://github.com/Away-pro/pet-service.git
cd pet-service
```

### 2. 启动用户端（user_system）
```bash
# 进入用户端目录
cd vue/user_system

# 安装依赖
npm install

# 启动开发环境
npm run dev

# 本地访问地址：http://localhost:5173
```

### 3. 启动商家端（merchant_system）
```bash
# 进入商家端目录
cd vue/merchant_system

# 安装依赖
npm install

# 启动开发环境
npm run dev

# 本地访问地址：http://localhost:5174（端口可在vite.config.js中配置）
```

### 4. 启动后端服务（node）
```bash
# 进入后端目录
cd node

# 安装依赖
npm install

# 配置数据库连接（修改database目录下的配置文件）
# 启动服务
node app.js

# 服务默认端口：3000
```

### 5. 启动AI健康顾问服务
```bash
# 进入AI服务目录
cd python-ai-service

# 安装依赖（根据需要安装fastapi、uvicorn等）
pip install fastapi uvicorn

# 启动服务
python main.py

# 服务默认端口：8000
```

---

## 🌐 在线部署
项目已部署上线，访问地址：
- 用户端：https://chengzheng.xyz


---

## 🤝 贡献指南
欢迎提交Issue和Pull Request，一起完善项目：
1.  Fork 本仓库
2.  创建你的功能分支：`git checkout -b feature/你的功能名`
3.  提交修改：`git commit -m 'Add: 新增XX功能'`
4.  推送到分支：`git push origin feature/你的功能名`
5.  提交 Pull Request

---

## 📄 开源协议
本项目基于 **MIT License** 开源，可自由学习、使用、修改，二次开发请保留项目原作者信息。

---

## 📞 联系方式
- GitHub：[Away-pro](https://github.com/Away-pro)
- 项目用途：学习交流 / 毕业设计 / 宠物服务平台开发
