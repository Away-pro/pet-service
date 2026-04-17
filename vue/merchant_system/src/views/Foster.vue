<template>
  <div class="foster-orange-wrap">
    <div class="foster-title-bar">
      <h2>📅 寄养预约管理</h2>
    </div>

    <div class="search-box">
      <el-select v-model="searchStatus" placeholder="筛选状态" style="width: 180px" clearable>
        <el-option label="待审核" value="待审核" />
        <el-option label="已入住" value="已入住" />
        <el-option label="已完成" value="已完成" />
      </el-select>
    </div>
    <br />

    <div class="table-card">
      <el-table :data="filterList" border stripe header-align="center" align="center">
        <el-table-column label="序号" type="index" width="55" />
        <el-table-column prop="petName" label="宠物名称" width="82" />
        <el-table-column prop="userName" label="主人" width="85" />
        <el-table-column prop="checkIn" label="入住时间" width="165" />
        <el-table-column prop="checkOut" label="离店时间" width="165" />
        <el-table-column prop="fosterType" label="寄养类型" width="120" />
        <el-table-column prop="unitPrice" label="单日单价" width="100" />
        <el-table-column prop="totalPrice" label="寄养费用" width="100" />
        <el-table-column prop="status" label="状态" width="120">
          <template #default="scope">
            <el-tag :type="getStatusColor(scope.row.status)">{{ scope.row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180">
          <template #default="scope">
            <el-button size="small" type="primary" @click="updateStatus(scope.row.id, '已入住')">入住</el-button>
            <el-button size="small" type="success" @click="updateStatus(scope.row.id, '已完成')">完成</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue"
import request from "../utils/request"
import { ElMessage } from "element-plus"

const list = ref([])
const searchStatus = ref("")

// 获取寄养列表
const getList = async () => {
  const res = await request.get("/foster/list")
  list.value = res.data || []
}
// 筛选状态
const filterList = computed(() => {
  if (!searchStatus.value) return list.value
  return list.value.filter(item => item.status === searchStatus.value)
})

// 状态标签颜色
const getStatusColor = (status) => {
  const map = { "待审核": "warning", "已入住": "primary", "已完成": "success", "已取消": "danger" }
  return map[status] || ""
}

// 修改状态
const updateStatus = async (id, status) => {
  await request.put(`/foster/update/${id}`, { status })
  ElMessage.success("状态更新成功")
  getList()
}

onMounted(() => getList())
</script>

<style scoped>
.foster-orange-wrap {
  padding: 24px;
  background: #fff9f5;
  min-height: calc(100vh - 150px);
}
.foster-title-bar h2 {
  font-size: 22px;
  color: #e67e22;
  margin: 0 0 20px 0;
}
.search-box { margin-bottom: 15px; }
.table-card {
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 10px rgba(230,126,34,0.08);
}
</style>