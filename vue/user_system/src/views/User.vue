<template>
  <div class="user-page">
    <div class="user-card">
      <div class="avatar">
        <el-icon size="48" color="#409eff"><User /></el-icon>
      </div>
      <div class="info">
        <h2>{{ userInfo.username || '普通用户' }}</h2>
        <p>手机号：{{ userInfo.phone || '未绑定' }}</p>
        <p>账号类型：普通用户</p>
      </div>
    </div>

    <div class="menu-grid">
      <div class="menu-item" @click="$router.push('/order')">
        <el-icon size="24"><List /></el-icon>
        <span>我的订单</span>
      </div>
      <div class="menu-item" @click="$router.push('/address')">
        <el-icon size="24"><Location /></el-icon>
        <span>收货地址</span>
      </div>
      <div class="menu-item" @click="$router.push('/foster')">
        <el-icon size="24"><Calendar /></el-icon>
        <span>我的寄养</span>
      </div>
      <div class="menu-item" @click="$router.push('/service')">
        <el-icon size="24"><Service /></el-icon>
        <span>联系客服</span>
      </div>
      <div class="menu-item" @click="openChangePwdDialog">
        <el-icon size="24"><Lock /></el-icon>
        <span>修改密码</span>
      </div>
    </div>

    <div class="logout-box">
      <el-button type="danger" round block @click="logout">退出登录</el-button>
    </div>

    <el-dialog
      v-model="showPwdDialog"
      title="修改密码"
      width="400px"
      @close="resetPwdForm"
      destroy-on-close
    >
      <el-form 
        :model="pwdForm" 
        :rules="pwdRules" 
        ref="pwdFormRef" 
        label-width="80px"
        size="large"
      >
        <el-form-item label="旧密码" prop="oldPwd">
          <el-input 
            v-model="pwdForm.oldPwd" 
            type="password" 
            show-password 
            placeholder="请输入旧密码"
          />
        </el-form-item>
        <el-form-item label="新密码" prop="newPwd">
          <el-input 
            v-model="pwdForm.newPwd" 
            type="password" 
            show-password 
            placeholder="请输入6-20位新密码"
          />
        </el-form-item>
        <el-form-item label="确认密码" prop="confirmPwd">
          <el-input 
            v-model="pwdForm.confirmPwd" 
            type="password" 
            show-password 
            placeholder="请再次输入新密码"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showPwdDialog = false">取消</el-button>
        <el-button type="primary" @click="submitChangePwd">确定修改</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import axios from 'axios'
import { User, List, Location, Calendar, Service, Lock } from '@element-plus/icons-vue'

const router = useRouter()
const userInfo = ref({})
const request = axios.create({
  baseURL: '/api',
  timeout: 10000
})

const showPwdDialog = ref(false)
const pwdFormRef = ref(null)
const pwdForm = ref({
  oldPwd: '',
  newPwd: '',
  confirmPwd: ''
})

const pwdRules = {
  oldPwd: [{ required: true, message: '请输入旧密码', trigger: 'blur' }],
  newPwd: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度需为6-20位', trigger: 'blur' }
  ],
  confirmPwd: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (value !== pwdForm.value.newPwd) {
          callback(new Error('两次输入的密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}

const openChangePwdDialog = () => {
  showPwdDialog.value = true
}

const resetPwdForm = () => {
  pwdForm.value = { oldPwd: '', newPwd: '', confirmPwd: '' }
  pwdFormRef.value?.clearValidate()
}

const submitChangePwd = async () => {
  const valid = await pwdFormRef.value?.validate().catch(() => false)
  if (!valid) return

  const localUser = JSON.parse(localStorage.getItem('userInfo') || '{}')
  if (!localUser.id) {
    ElMessage.error('请先登录')
    return
  }

  try {
    await request.post('/user/change-password', {
      userId: localUser.id,
      oldPassword: pwdForm.value.oldPwd,
      newPassword: pwdForm.value.newPwd
    })
    
    ElMessage.success('密码修改成功，请重新登录')
    showPwdDialog.value = false
    resetPwdForm()
    localStorage.clear()
    router.push('/login')
  } catch (err) {
    ElMessage.error(err.response?.data?.msg || '修改失败')
  }
}

const getUserInfo = () => {
  const info = JSON.parse(localStorage.getItem('userInfo') || '{}')
  userInfo.value = info
}

const logout = () => {
  localStorage.clear()
  ElMessage.success('退出成功')
  router.push('/login')
}

onMounted(() => {
  getUserInfo()
})
</script>

<style scoped>
.user-page {
  max-width: 700px;
  margin: 30px auto;
  padding: 0 20px;
}
.user-card {
  background: #fff;
  border-radius: 16px;
  padding: 30px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
  display: flex;
  align-items: center;
  gap: 24px;
  margin-bottom: 24px;
}
.avatar {
  width: 60px;
  height: 60px;
  background: #f0f7ff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}
.info h2 {
  margin: 0 0 8px 0;
  font-size: 22px;
  color: #333;
}
.info p {
  margin: 4px 0;
  color: #666;
  font-size: 14px;
}
.menu-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  margin-bottom: 30px;
}
.menu-item {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}
.menu-item:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}
.menu-item span {
  font-size: 15px;
  color: #333;
}
.logout-box {
  margin-top: 10px;
}
</style>