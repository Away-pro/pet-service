<template>
  <div class="community-comment-manage">
    <div class="page-header">
      <div class="title-area">
        <el-icon class="title-icon"><ChatDotRound /></el-icon>
        <h1>社区评论管理</h1>
      </div>
      <el-input 
        v-model="keyword" 
        placeholder="搜索评论内容/用户名" 
        style="width: 380px"
        clearable
        @keyup.enter="handleSearch"
      >
        <template #append>
          <el-button @click="handleSearch" icon="Search">搜索</el-button>
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
      <el-table-column prop="id" label="评论ID" width="80" />
      <el-table-column prop="username" label="评论用户" width="120" />
      <el-table-column prop="content" label="评论内容" min-width="350" show-overflow-tooltip />
      <el-table-column prop="postId" label="动态ID" width="100" />
      <el-table-column label="评论时间" width="180">
        <template #default="{ row }">
          <span class="time-text">{{ formatTime(row.createdAt) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="130">
        <template #default="{ row }">
          <el-button 
            type="danger" 
            size="small" 
            @click="del(row.id)"
            icon="Delete"
            round
          >
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <div v-if="filterList.length === 0" class="empty-tip">
      <el-empty description="暂无评论数据" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'
import { ElMessage, ElMessageBox, ElEmpty } from 'element-plus'
import { ChatDotRound, Search, Refresh, Delete } from '@element-plus/icons-vue'

const request = axios.create({ baseURL: '/api' })
const list = ref([])
const keyword = ref('')

// 获取原始列表
const getList = async () => {
  try {
    const { data } = await request.get('/community/comment/list', { 
      params: { keyword: keyword.value } 
    })
    list.value = data.data || []
  } catch (e) {
    ElMessage.error('获取评论列表失败')
    list.value = []
  }
}

// 搜索触发
const handleSearch = () => {
  getList()
}

// 重置搜索
const resetSearch = () => {
  keyword.value = ''
  getList()
}

// 前端模糊过滤
const filterList = computed(() => {
  const key = keyword.value.trim().toLowerCase()
  if (!key) return list.value
  
  return list.value.filter(item => {
    const username = (item.username || '').toLowerCase()
    const content = (item.content || '').toLowerCase()
    return username.includes(key) || content.includes(key)
  })
})

// 删除评论
const del = async (id) => {
  await ElMessageBox.confirm('确定删除该评论？')
  await request.post('/community/comment/delete', { id })
  ElMessage.success('删除成功')
  getList()
}

// 时间格式化
const formatTime = (time) => {
  if (!time) return '-'
  return new Date(time).toLocaleString('zh-CN', { 
    year: 'numeric', 
    month: '2-digit', 
    day: '2-digit', 
    hour: '2-digit', 
    minute: '2-digit' 
  })
}

onMounted(() => getList())
</script>

<style scoped>
.community-comment-manage { 
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
.time-text { 
  color: #6b5b45; 
  font-size: 13px; 
}
.empty-tip { 
  margin-top: 50px; 
  text-align: center; 
}
:deep(.el-table__row:hover) { 
  background: #fffaf0 !important; 
}
</style>