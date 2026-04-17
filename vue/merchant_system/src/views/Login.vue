<template>
  <div class="login-page">
    <div class="login-card">
      <h3>宠物寄养&商城管理系统</h3>
      <el-form
        ref="loginFormRef"
        :model="loginForm"
        :rules="loginRules"
        label-width="70px"
        autocomplete="off"
      >
        <el-form-item label="账号" prop="phone">
          <el-input 
            v-model="loginForm.phone" 
            placeholder="请输入管理员账号"
            autocomplete="new-password"
          />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input 
            v-model="loginForm.password" 
            type="password" 
            placeholder="请输入密码"
            autocomplete="new-password"
          />
        </el-form-item>
      </el-form>

      <el-button type="primary" @click="handleLogin" style="width:100%">
        登录
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import request from '../utils/request'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'

const router = useRouter()
const loginFormRef = ref(null)

const loginForm = reactive({
  phone: '',
  password: ''
})

const loginRules = {
  phone: [
    { required: true, message: '请输入账号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '账号格式不正确', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码不能少于6位', trigger: 'blur' }
  ]
}

const handleLogin = async () => {
  const valid = await loginFormRef.value.validate().catch(() => false)
  if (!valid) return

  try {
    const res = await request.post('/login/login', loginForm)
    
    if (res.code === 200) {
      localStorage.setItem('token', res.data.token)
      localStorage.setItem('username', res.data.username)
      ElMessage.success('登录成功！')
      router.push('/dashboard')
    } else {
      alert("❌ 账号或密码错误，请重新输入！")
    }
  } catch (error) {
    alert("❌ 网络异常，请重试！")
  }
}
</script>

<style scoped>
.login-page{height:100vh;display:flex;align-items:center;justify-content:center;background:#f5f7fa}
.login-card{width:420px;padding:40px;background:#fff;border-radius:12px;box-shadow:0 0 20px #eee}
h3{text-align:center;margin-bottom:30px;color:#e67e22}
</style>