<template>
  <div class="pet-layout">
    <div class="sidebar">
      <div class="sidebar-title">
        <span class="logo-text">🐾 宠伴朝夕</span>
      </div>

      <el-menu
        mode="vertical"
        background-color="#f8f5f0"
        text-color="#6b5b45"
        active-text-color="#d97706"
        router
        :default-active="$route.path"
        class="menu"
      >
        <el-menu-item index="/product">
          <el-icon><ShoppingBag /></el-icon>
          <span class="menu-text">商品管理</span>
        </el-menu-item>
        <el-menu-item index="/category">
          <el-icon><Folder /></el-icon>
          <span class="menu-text">分类管理</span>
        </el-menu-item>
        <el-menu-item index="/order">
          <el-icon><List /></el-icon>
          <span class="menu-text">订单管理</span>
        </el-menu-item>
        <el-menu-item index="/pet">
          <el-icon><List /></el-icon>
          <span class="menu-text">宠物档案</span>
        </el-menu-item>
        <el-menu-item index="/foster">
          <el-icon><List /></el-icon>
          <span class="menu-text">寄养管理</span>
        </el-menu-item>
        <el-menu-item index="/user">
          <el-icon><User /></el-icon>
          <span class="menu-text">用户管理</span>
        </el-menu-item>
        <!-- ✅ 新增：客服中心入口 -->
        <el-menu-item index="/admin-service">
          <el-icon><Service /></el-icon>
          <span class="menu-text">客服中心</span>
          <el-badge 
            v-if="totalUnread > 0" 
            :value="totalUnread" 
            class="menu-badge" 
            :max="99"
          />
        </el-menu-item>
        <el-sub-menu index="community">
          <template #title>
            <el-icon><Document /></el-icon>
            <span class="menu-text">社区管理</span>
          </template>
          <el-menu-item index="/community/post">
            <el-icon><Document /></el-icon>
            <span>动态管理</span>
          </el-menu-item>
          <el-menu-item index="/community/comment">
            <el-icon>💬</el-icon>
            <span>评论管理</span>
          </el-menu-item>
          <el-menu-item index="/community/activity">
            <el-icon><Document /></el-icon>
            <span>活动管理</span>
          </el-menu-item>
          <el-menu-item index="/community/user">
            <el-icon><User /></el-icon>
            <span>社区用户</span>
          </el-menu-item>
        </el-sub-menu>
      </el-menu>
    </div>
    <div class="main">
      <div class="top-bar">
        <el-button type="text" @click="$router.push('/dashboard')" class="home-btn">
          🏠 首页（数据概览）
        </el-button>
        <div class="top-right">
          <el-tag type="warning" size="small">管理员</el-tag>
          <span class="admin-name">admin</span>
          <el-button type="danger" size="small" @click="logout">退出</el-button>
        </div>
      </div>
      <div class="content-box">
        <router-view />
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRoute } from 'vue-router'
import { ShoppingBag, Folder, List, User, Service, Document } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { ref, onMounted, onUnmounted } from 'vue'
import axios from 'axios'

const request = axios.create({ baseURL: '/api' })
const totalUnread = ref(0)
const route = useRoute()
let timer = null

const getTotalUnread = async () => {
  try {
    const res = await request.get('/service/unread/count')
    if (res.data.code === 200) totalUnread.value = res.data.data || 0
  } catch (err) {
    totalUnread.value = 0
  }
}

const logout = () => {
  localStorage.clear()
  window.location.href = '/login'
  ElMessage.success('退出成功')
}

onMounted(() => {
  getTotalUnread()
  timer = setInterval(getTotalUnread, 1500)
})

onUnmounted(() => clearInterval(timer))
</script>

<style scoped>
.pet-layout {
  display: flex;
  height: 100vh;
  margin: 0;
  padding: 0;
  overflow: hidden;
  background: #f9fafb;
}

.sidebar {
  width: 180px;
  background: #f8f5f0;
  color: #6b5b45;
  padding: 20px 0;
  box-shadow: 2px 0 10px rgba(0,0,0,0.05);
  border-right: 1px solid #e5e0d8;
}
.sidebar-title {
  text-align: center;
  margin-bottom: 20px;
}
.logo-text {
  font-size: 18px;
  font-weight: bold;
  color: #d97706;
}
.menu {
  border-right: none;
  background: transparent;
}
:deep(.el-menu-item) {
  height: 46px !important;
  line-height: 46px !important;
  margin: 4px 12px;
  border-radius: 8px !important;
}
:deep(.el-menu-item.is-active) {
  background: #fffaf0 !important;
  color: #d97706 !important;
  font-weight: 600;
}
.menu-text {
  font-size: 14px;
}

.main {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.top-bar {
  height: 50px;
  background: #f8f5f0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 20px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  position: relative;
}
.top-right {
  display: flex;
  align-items: center;
  gap: 10px;
  position: absolute;
  right: 20px;
  top: 50%;
  transform: translateY(-50%);
}
.admin-name {
  font-size: 14px;
  color: #6b5b45;
}
.content-box {
  flex: 1;
  overflow-y: auto;
  padding: 10px;
}

.home-btn {
  color: #d97706;
  font-weight: 500;
}

.menu-badge {
  margin-left: 4px;
  transform: translateY(-2px);
}
</style>

<style>
*::-webkit-scrollbar {
  width: 0 !important;
  height: 0 !important;
  display: none !important;
}
html, body {
  scrollbar-width: none !important;
  -ms-overflow-style: none !important;
}
::-webkit-scrollbar {
  display: none !important;
}
</style>