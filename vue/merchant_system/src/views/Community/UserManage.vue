<template>
  <div class="community-user-manage">
    <div class="page-header">
      <div class="title-area">
        <el-icon class="title-icon"><User /></el-icon>
        <h1>社区用户管理</h1>
      </div>
      <el-input 
        v-model="keyword" 
        placeholder="搜索用户名" 
        style="width: 280px"
        clearable
        @keyup.enter="getList"
      >
        <template #append>
          <el-button @click="getList" icon="Search">搜索</el-button>
          <el-button @click="resetSearch" icon="Refresh">重置</el-button>
        </template>
      </el-input>
    </div>

    <el-table 
      :data="filterList" 
      border 
      stripe 
      style="width:100%; margin-top: 20px;"
      header-align="center"
      align="center"
      :header-cell-style="{ background: '#fffaf0', color: '#d97706', fontWeight: '600' }"
    >
      <el-table-column prop="userId" label="用户ID" width="80" />
      <el-table-column prop="username" label="用户名" width="130" />
      <el-table-column label="头像" width="100">
        <template #default="{ row }">
          <el-image 
            :src="row.avatar" 
            fit="cover" 
            style="width: 40px; height: 40px; border-radius: 50%;"
            :preview-src-list="[row.avatar]"
          />
        </template>
      </el-table-column>
      <el-table-column prop="signature" label="个性签名" min-width="250" show-overflow-tooltip />
      <el-table-column prop="followerCount" label="粉丝数" width="90" />
      <el-table-column prop="followCount" label="关注数" width="90" />
    </el-table>

    <div v-if="filterList.length === 0" class="empty-tip">
      <el-empty description="暂无社区用户数据" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'
import { ElEmpty } from 'element-plus'
import { User, Search, Refresh } from '@element-plus/icons-vue'

const request = axios.create({ baseURL: '/api' })
const list = ref([])
const keyword = ref('')
const getList = async () => {
  const { data } = await request.get('/community/user/list', { params: { keyword: keyword.value } })
  list.value = data.data || []
}

const resetSearch = () => {
  keyword.value = ''
  getList()
}

const filterList = computed(() => {
  const key = keyword.value.trim().toLowerCase()
  if (!key) return list.value
  
  return list.value.filter(item => {
    // 模糊搜索用户名
    return (item.username || '').toLowerCase().includes(key)
  })
})

onMounted(() => getList())
</script>

<style scoped>
.community-user-manage {
  padding: 20px;
  background: #f9f5f0;
  min-height: calc(100vh - 100px);
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}

.title-area {
  display: flex;
  align-items: center;
  gap: 10px;
}

.title-icon {
  font-size: 20px;
  color: #d97706;
}

h1 {
  margin: 0;
  font-size: 18px;
  color: #d97706;
  font-weight: 600;
}

.empty-tip {
  margin-top: 50px;
  text-align: center;
}

:deep(.el-table__row:hover) {
  background: #fffaf0 !important;
}
</style>