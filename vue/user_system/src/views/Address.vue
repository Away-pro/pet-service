<template>
  <div class="address-page">
    <div class="header">
      <h3>收货地址管理</h3>
      <el-button type="primary" @click="openDialog()">新增地址</el-button>
    </div>

    <div class="address-list">
      <div class="address-item" v-for="item in addressList" :key="item.id">
        <div class="info">
          <p><b>{{ item.name }}</b> {{ item.phone }}</p>
          <p>{{ item.address }} {{ item.detail }}</p>
          <el-tag type="success" v-if="item.isDefault">默认地址</el-tag>
        </div>
        <div class="operate">
          <el-button size="small" @click="openDialog(item)">编辑</el-button>
          <el-button size="small" type="warning" @click="setDefault(item.id)">设默认</el-button>
          <el-button size="small" type="danger" @click="delAddress(item.id)">删除</el-button>
        </div>
      </div>
    </div>

    <!-- 新增/编辑弹窗 -->
    <el-dialog v-model="dialogVisible" title="地址信息">
      <el-form :model="form" label-width="80px">
        <el-form-item label="收货人">
          <el-input v-model="form.name" placeholder="请输入姓名" />
        </el-form-item>
        <el-form-item label="手机号">
          <el-input v-model="form.phone" placeholder="请输入手机号" />
        </el-form-item>
        <el-form-item label="所在地区">
          <el-input v-model="form.address" placeholder="省/市/区" />
        </el-form-item>
        <el-form-item label="详细地址">
          <el-input v-model="form.detail" type="textarea" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible=false">取消</el-button>
        <el-button type="primary" @click="saveAddress">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import axios from 'axios'

const request = axios.create({ baseURL: '/api' })
const addressList = ref([])
const dialogVisible = ref(false)
const form = ref({ name: '', phone: '', address: '', detail: '', isDefault: 0 })
const editId = ref(null)
const userId = JSON.parse(localStorage.getItem('userInfo') || '{}').id

// 获取地址列表
const getAddressList = async () => {
  const { data } = await request.get('/address/list', { params: { userId } })
  addressList.value = data.data || []
}

// 打开弹窗
const openDialog = (row = null) => {
  editId.value = row?.id || null
  form.value = row ? { ...row } : { name: '', phone: '', address: '', detail: '', isDefault: 0 }
  dialogVisible.value = true
}

// 保存地址
const saveAddress = async () => {
  const params = { ...form.value, userId }
  if (editId.value) {
    await request.post('/address/update', { id: editId.value, ...params })
    ElMessage.success('修改成功')
  } else {
    await request.post('/address/add', params)
    ElMessage.success('新增成功')
  }
  dialogVisible.value = false
  getAddressList()
}

// 设为默认
const setDefault = async (id) => {
  await request.post('/address/default', { id, userId })
  getAddressList()
  ElMessage.success('设置成功')
}

// 删除地址
const delAddress = async (id) => {
  await request.post('/address/delete', { id })
  getAddressList()
  ElMessage.success('删除成功')
}

onMounted(() => {
  getAddressList()
})
</script>

<style scoped>
.address-page { max-width: 800px; margin: 30px auto; padding: 0 20px; }
.header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.address-item {
  background: #fff; padding: 20px; border-radius: 12px;
  display: flex; justify-content: space-between; margin-bottom: 12px;
}
.operate { display: flex; gap: 8px; align-items: center; }
</style>