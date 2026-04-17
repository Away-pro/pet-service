<template>
  <div class="pet-purple-wrap">
    <div class="pet-title-bar">
      <h2>🐾 宠物档案管理</h2>
    </div>

    <div class="search-box">
      <el-input v-model="searchKey" placeholder="搜索宠物名/主人电话" style="width: 240px" clearable />
    </div>
    <br />

    <div class="table-card">
      <el-table :data="filterList" border stripe header-align="center" align="center">
        <el-table-column label="序号" type="index" width="70" />
        <el-table-column label="宠物照片" width="90">
          <template #default="scope">
            <el-avatar 
              :src="scope.row.avatarUrl" 
              :size="45" 
              icon="el-icon-user"
              fit="cover"
            />
          </template>
        </el-table-column>
        <el-table-column prop="petNickname" label="宠物名称" width="82"/>
        <el-table-column prop="petType" label="宠物类型" width="82" />
        <el-table-column prop="userName" label="主人姓名" width="82" />
        <el-table-column prop="userPhone" label="联系电话" width="115" />
        <el-table-column prop="age" label="年龄" width="55" />
        <el-table-column prop="weight" label="体重" width="65" />
        <el-table-column prop="vaccine" label="疫苗状态" width="82" />
        <el-table-column prop="allergy" label="过敏史" min-width="80" show-overflow-tooltip />
        <el-table-column prop="feeding" label="饮食禁忌" min-width="100" show-overflow-tooltip />
        <el-table-column prop="note" label="性格备注" min-width="100" show-overflow-tooltip />
        <el-table-column label="操作" width="100">
          <template #default="scope">
            <el-button size="small" type="danger" @click="del(scope.row.id)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue"
import request from "../utils/request"
import { ElMessage, ElMessageBox } from "element-plus"

const list = ref([])
const searchKey = ref("")

const parsePetInfo = (petName) => {
  const reg = /^(.+?)\[(.*?)\]$/
  const match = (petName || '').match(reg)
  return match ? {
    petNickname: match[1],  // 纯宠物名
    avatarUrl: match[2]     // 头像地址
  } : {
    petNickname: petName || '',
    avatarUrl: ''
  }
}

// 获取宠物列表 + 解析数据
const getList = async () => {
  const res = await request.get("/pet/list")
  // 遍历解析每个宠物的名称和头像
  list.value = (res.data || []).map(item => ({
    ...item,
    ...parsePetInfo(item.petName)
  }))
}

// 搜索过滤（按纯宠物名/电话搜索）
const filterList = computed(() => {
  const key = searchKey.value.trim()
  if (!key) return list.value
  return list.value.filter(item => 
    (item.petNickname || '').includes(key) || 
    (item.userPhone || '').includes(key)
  )
})

// 删除功能
const del = async (id) => {
  await ElMessageBox.confirm("确定删除该档案？")
  await request.delete(`/pet/delete/${id}`)
  ElMessage.success("删除成功")
  getList()
}

onMounted(() => getList())
</script>

<style scoped>
.pet-purple-wrap {
  padding: 24px;
  background: #f8f5ff;
  min-height: calc(100vh - 150px);
}
.pet-title-bar h2 {
  font-size: 22px;
  color: #7E22CE;
  margin: 0 0 20px 0;
}
.search-box { margin-bottom: 15px; }
.table-card {
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 10px rgba(126,34,206,0.08);
}
</style>