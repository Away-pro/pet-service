<template>
  <div class="user-wrapper">
    <div class="user-header">
      <el-icon style="font-size:22px;margin-right:8px;color:#409eff;"><User /></el-icon>
      <h2>用户管理</h2>
    </div>
    <div class="user-search">
      <el-input
        v-model="searchName"
        placeholder="搜索用户名称"
        style="width:240px"
        clearable
      />
      <el-button type="primary" @click="getUserList" round>
        <el-icon><Search /></el-icon>搜索
      </el-button>
    </div>
    <div class="table-card">
      <el-table
        :data="pageList"
        border
        header-align="center"
        align="center"
        :row-style="{height:'50px'}"
      >
        <el-table-column label="序号" width="70">
          <template #default="scope">
            {{ (pageNum - 1) * pageSize + scope.$index + 1 }}
          </template>
        </el-table-column>
        <el-table-column prop="id" label="用户ID" width="100" />
        <el-table-column prop="username" label="用户名称" width="130" />
        <el-table-column prop="email" label="邮箱" width="140" />
        <el-table-column label="登录密码" width="160">
          <template #default="scope">
            <el-tag type="info" size="small">已加密</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" min-width="190">
          <template #default="scope">
            {{ formatTime(scope.row.createdAt ) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200">
          <template #default="scope">
            <el-button type="success" size="small" icon="edit" @click="openEditDialog(scope.row)">编辑</el-button>
            <el-button type="warning" size="small" icon="delete" @click="deleteUser(scope.row.id)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
    <div class="pagination-box">
      <el-pagination
        v-model:current-page="pageNum"
        v-model:page-size="pageSize"
        :total="total"
        layout="total, prev, pager, next, jumper"
        prev-text="上一页"
        next-text="下一页"
        jumper-text="跳至"
        background
      />
    </div>
    <el-dialog v-model="dialogVisible" title="编辑用户信息" width="460px">
      <el-form :model="form" label-width="100px">
        <el-form-item label="用户名称">
          <el-input v-model="form.username" placeholder="请输入用户名称" />
        </el-form-item>
        <el-form-item label="邮箱">
          <el-input v-model="form.email" placeholder="请输入邮箱" />
        </el-form-item>
        <el-form-item label="登录密码">
          <el-input v-model="form.password" placeholder="请输入登录密码" show-password />
        </el-form-item>
      </el-form>
      <div style="text-align:right;margin-top:20px">
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveUser">保存</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue"
import request from "../utils/request"
import { ElMessage, ElMessageBox } from "element-plus"
import { User, Search } from '@element-plus/icons-vue'

// 数据
const userList = ref([])
const searchName = ref("")

// 分页配置
const pageNum = ref(1)
const pageSize = ref(8)
const total = computed(() => filterList.value.length)

// 弹窗
const dialogVisible = ref(false)
const form = ref({ id: "", username: "", phone: "", password: "" })

// 时间格式化
const formatTime = (timeStr) => {
  if (!timeStr) return ""
  const date = new Date(timeStr)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  const hours = String(date.getHours()).padStart(2, "0")
  const minutes = String(date.getMinutes()).padStart(2, "0")
  return `${year}-${month}-${day} ${hours}:${minutes}`
}

// 筛选
const filterList = computed(() => {
  let arr = [...userList.value]
  if (searchName.value) arr = arr.filter(i => i.username.includes(searchName.value))
  return arr
})

// 分页数据
const pageList = computed(() => {
  const start = (pageNum.value - 1) * pageSize.value
  return filterList.value.slice(start, start + pageSize.value)
})

// 获取列表
const getUserList = async () => {
  try {
    const res = await request.get("/user/list")
    userList.value = res.data || []
  } catch (error) {
    ElMessage.error("加载失败")
  }
}

// 编辑
const openEditDialog = (row) => {
  form.value = { ...row }
  form.value.password = ''
  dialogVisible.value = true
}

// 保存时，如果密码为空，就不修改密码字段
const saveUser = async () => {
  if (!form.value.username) {
    ElMessage.warning("用户名不能为空！");
    return;
  }
  if (!form.value.id) { 
    ElMessage.warning("用户ID异常，无法更新！");
    return;
  }

  try {
    // 构建更新数据：密码为空则不传递
    const updateData = {
      username: form.value.username,
      email: form.value.email
    };
    if (form.value.password && form.value.password.trim() !== '') {
      updateData.password = form.value.password;
    }

    const response = await request.put(`/user/update/${form.value.id}`, updateData);
    
    // 适配后端返回的两种可能格式
    if (response.code === 200 || response.data?.code === 200) {
      ElMessage.success("保存成功！");
      dialogVisible.value = false;
      getUserList(); // 刷新列表
    } else {
      ElMessage.error(response.message || response.data?.message || "保存失败");
    }
  } catch (error) {
    console.error("保存请求失败：", error);
    ElMessage.error(
      "保存失败：" + (error.response?.data?.message || error.message)
    );
  }
};




// 删除
const deleteUser = async (id) => {
  try {
    await ElMessageBox.confirm("确认删除？")
    await request.delete(`/user/delete/${id}`)
    ElMessage.success("删除成功")
    getUserList()
  } catch (e) { ElMessage.info("取消") }
}

onMounted(() => { getUserList() })
</script>

<style scoped>
.user-wrapper {
  padding: 24px;
  background: #f5f7fa;
  min-height: calc(100vh - 30px);
}

.user-header {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
  padding-left: 12px;
  border-left: 4px solid #409eff;
}
.user-header h2 {
  margin: 0;
  font-size: 20px;
  color: #303133;
}

.user-search {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 20px;
  padding: 16px 20px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.table-card {
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.08);
}
:deep(.el-table) {
  border-radius: 8px;
  overflow: hidden;
}
:deep(.el-table__header) {
  background-color: #f8f9fc !important;
}

.pagination-box {
  margin-top: 25px;
  text-align: center;
}
.pagination-box :deep(.el-pagination) {
  display: inline-flex;
}
</style>