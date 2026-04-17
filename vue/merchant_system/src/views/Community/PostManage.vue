<template>
  <div class="community-post-manage">
    <div class="page-header">
      <div class="title-area">
        <el-icon class="title-icon"><Document /></el-icon>
        <h1>社区动态管理</h1>
      </div>
      <el-input 
        v-model="keyword" 
        placeholder="搜索动态内容/发布用户名" 
        style="width: 280px"
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
      :row-style="{ height: '70px' }"
      :cell-style="{ padding: '8px 0' }"
    >
      <el-table-column prop="id" label="ID" width="70" />
      <el-table-column prop="username" label="发布用户" width="120" />
      <el-table-column prop="content" label="动态内容" min-width="350" show-overflow-tooltip />
      <el-table-column label="图片" width="120">
        <template #default="{ row }">
          <div v-if="row.imgUrl" class="img-thumbnail">
            <el-image 
              :src="row.imgUrl" 
              fit="cover" 
              style="width: 55px; height: 55px; border-radius: 8px;"
              preview-src-list="[row.imgUrl]"
              preview-teleport
            />
          </div>
          <span v-else class="no-img">无</span>
        </template>
      </el-table-column>

      <el-table-column prop="likes" label="点赞" width="80" />
      <el-table-column label="发布时间" width="180">
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
      <el-empty description="暂无社区动态数据" />
    </div>
    <el-pagination 
      v-model:current-page="page"
      :page-size="10"
      :total="total"
      background
      layout="total, prev, pager, next, jumper"
      style="margin-top: 20px; text-align: right;"
      @current-change="getList"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'
import { ElMessage, ElMessageBox, ElEmpty } from 'element-plus'
import { Document, Search, Refresh, Delete } from '@element-plus/icons-vue'

const request = axios.create({ baseURL: '/api' })
const list = ref([])
const keyword = ref('')
const page = ref(1)
const total = ref(0)

const getList = async () => {
  try {
    const { data } = await request.get('/community/post/list', { 
      params: { keyword: keyword.value, page: page.value } 
    })
    list.value = data.data || []
    total.value = data.data.length || 0
  } catch (e) { 
    ElMessage.error('获取动态失败') 
  }
}

// 搜索触发
const handleSearch = () => {
  page.value = 1
  getList()
}

// 重置搜索
const resetSearch = () => {
  keyword.value = ''
  page.value = 1
  getList()
}

// 前端搜索过滤
const filterList = computed(() => {
  const key = keyword.value.trim().toLowerCase()
  if (!key) return list.value
  
  return list.value.filter(item => {
    const username = (item.username || '').toLowerCase()
    const content = (item.content || '').toLowerCase()
    return username.includes(key) || content.includes(key)
  })
})

// 删除动态
const del = async (id) => {
  await ElMessageBox.confirm('确定删除该动态？删除后无法恢复！', '确认删除', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  })
  try {
    await request.post('/community/post/delete', { id })
    ElMessage.success('删除成功')
    getList()
  } catch (e) {
    ElMessage.error('删除失败')
  }
}

// 时间格式化
const formatTime = (time) => {
  if (!time) return '-'
  const date = new Date(time)
  return date.toLocaleString('zh-CN', { 
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
.community-post-manage {
  padding: 20px;
  background: #f9f5f0;
  min-height: calc(100vh - 100px);
}

/* 标题栏：和后台统一 */
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

/* 图片缩略图 */
.img-thumbnail {
  display: inline-block;
}

.no-img {
  color: #999;
  font-size: 12px;
}

/* 时间文本 */
.time-text {
  color: #6b5b45;
  font-size: 13px;
}

/* 空状态 */
.empty-tip {
  margin-top: 50px;
  text-align: center;
}

/* 表格样式强化 */
:deep(.el-table__row:hover) {
  background: #fffaf0 !important;
}

:deep(.el-button--danger) {
  background: #e53e3e;
  border: none;
}
</style>