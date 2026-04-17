<template>
  <div class="community-page">
    <el-container style="height: 100%">
      <el-aside width="160px" class="community-sidebar">
        <el-menu
          mode="vertical"
          background-color="#f8f5f0"
          text-color="#6b5b45"
          active-text-color="#d97706"
          router
          :default-active="$route.path"
        >
          <el-menu-item index="/community/post">
            <el-icon><Document /></el-icon>
            <span>动态管理</span>
          </el-menu-item>
          <el-menu-item index="/community/comment">
            <el-icon><ChatDotRound /></el-icon>
            <span>评论管理</span>
          </el-menu-item>
          <el-menu-item index="/community/activity">
            <el-icon><Tickets /></el-icon>
            <span>活动管理</span>
          </el-menu-item>
          <el-menu-item index="/community/user">
            <el-icon><User /></el-icon>
            <span>社区用户</span>
          </el-menu-item>
        </el-menu>
      </el-aside>

      <el-main class="community-main">
        <router-view />
      </el-main>
    </el-container>
  </div>
</template>

<script setup>
import { Document, ChatDotRound, Tickets, User } from '@element-plus/icons-vue'
import { useRoute } from 'vue-router'
const route = useRoute()
</script>

<style scoped>
.community-page {
  height: calc(100vh - 80px);
  background: #f9f5f0;
}
.community-sidebar {
  background: #f8f5f0;
  border-right: 1px solid #e5d9c8;
}
.community-main {
  padding: 20px;
  overflow-y: auto;
}
:deep(.el-menu-item) {
  border-radius: 8px;
  margin: 4px 10px;
}
:deep(.el-menu-item.is-active) {
  background: #fffaf0 !important;
  color: #d97706 !important;
  font-weight: 600;
}
</style>