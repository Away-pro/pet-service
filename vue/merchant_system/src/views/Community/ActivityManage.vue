<template>
  <div class="community-activity-manage">
    <div class="page-header">
      <div class="title-area">
        <el-icon class="title-icon"><Tickets /></el-icon>
        <h1>社区活动管理</h1>
      </div>
      <el-button type="primary" @click="openDialog" icon="Plus">新增活动</el-button>
    </div>

    <el-table 
      :data="list" 
      border 
      stripe 
      style="width:100%; margin-top: 20px;"
      header-align="center"
      align="center"
      :header-cell-style="{ background: '#fffaf0', color: '#d97706', fontWeight: '600' }"
    >
      <el-table-column prop="id" label="活动ID" width="80" />
      <el-table-column prop="title" label="活动标题" min-width="200" />
      <el-table-column prop="content" label="活动描述" min-width="300" show-overflow-tooltip />
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="row.status === 1 ? 'success' : 'warning'">
            {{ row.status === 1 ? '进行中' : '已结束' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="创建时间" width="180">
        <template #default="{ row }">
          <span class="time-text">{{ formatTime(row.createdAt) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="180">
        <template #default="{ row }">
          <el-button size="small" @click="edit(row)" icon="Edit">编辑</el-button>
          <el-button type="danger" size="small" @click="del(row.id)" icon="Delete">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="visible" title="活动信息" width="500px">
      <el-form :model="form" label-width="80px">
        <el-form-item label="活动标题">
          <el-input v-model="form.title" placeholder="请输入活动标题" />
        </el-form-item>
        <el-form-item label="活动描述">
          <el-input v-model="form.content" type="textarea" :rows="4" placeholder="请输入活动描述" />
        </el-form-item>
        <el-form-item label="活动状态">
          <el-radio-group v-model="form.status">
            <el-radio :label="1">进行中</el-radio>
            <el-radio :label="0">已结束</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="visible = false">取消</el-button>
        <el-button type="primary" @click="save">保存</el-button>
      </template>
    </el-dialog>

    <div v-if="list.length === 0" class="empty-tip">
      <el-empty description="暂无活动数据" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'
import { ElMessage, ElMessageBox, ElEmpty } from 'element-plus'
import { Tickets, Plus, Edit, Delete } from '@element-plus/icons-vue'

const request = axios.create({ baseURL: '/api/community' })
const list = ref([])
const visible = ref(false)
const form = ref({ id: '', title: '', content: '', status: 1 })

const getList = async () => {
  const { data } = await request.get('/activity/list')
  list.value = data.data || []
}

const openDialog = () => {
  form.value = { id: '', title: '', content: '', status: 1 }
  visible.value = true
}

const edit = (row) => {
  form.value = { ...row }
  visible.value = true
}

const save = async () => {
  if (!form.value.title) return ElMessage.warning('请输入活动标题')
  await request.post('/activity/save', form.value)
  ElMessage.success('保存成功')
  visible.value = false
  getList()
}

const del = async (id) => {
  await ElMessageBox.confirm('确定删除该活动？')
  await request.post('/activity/delete', { id })
  ElMessage.success('删除成功')
  getList()
}

const formatTime = (time) => {
  if (!time) return '-'
  return new Date(time).toLocaleString('zh-CN', { 
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' 
  })
}

onMounted(() => getList())
</script>

<style scoped>
.community-activity-manage {
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
.title-area { display: flex; align-items: center; gap: 10px; }
.title-icon { font-size: 20px; color: #d97706; }
h1 { margin: 0; font-size: 18px; color: #d97706; font-weight: 600; }
.time-text { color: #6b5b45; font-size: 13px; }
.empty-tip { margin-top: 50px; text-align: center; }
:deep(.el-table__row:hover) { background: #fffaf0 !important; }
</style>