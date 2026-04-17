<template>
  <div class="login-page">
    <div class="login-card">
      <h2>用户登录</h2>
      <el-form 
        ref="loginFormRef" 
        :model="loginForm" 
        :rules="loginRules" 
        label-width="0px" 
        class="login-form"
      >
        <el-form-item prop="phone">
          <el-input 
            v-model="loginForm.phone" 
            placeholder="请输入手机号" 
            clearable 
            size="large"
          />
        </el-form-item>
        <el-form-item prop="password">
          <el-input 
            v-model="loginForm.password" 
            placeholder="请输入密码" 
            type="password" 
            clearable 
            size="large"
          />
        </el-form-item>
        <el-form-item>
          <el-button 
            type="primary" 
            round 
            size="large"
            style="width:100%" 
            @click="handleLogin"
          >
            登录
          </el-button>
        </el-form-item>
        <el-form-item style="text-align:center">
          <el-button type="text" @click="showRegister = true">
            还没有账号？立即注册
          </el-button>
        </el-form-item>
      </el-form>
    </div>

    <el-dialog v-model="showRegister" title="用户注册" width="450px">
      <el-form 
        ref="registerFormRef" 
        :model="registerForm" 
        :rules="registerRules" 
        label-width="90px"
      >
        <el-form-item label="用户名" prop="username">
          <el-input v-model="registerForm.username" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="registerForm.email" placeholder="请输入邮箱（如xxx@qq.com）" />
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="registerForm.phone" placeholder="请输入11位手机号" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input v-model="registerForm.password" type="password" placeholder="请输入6位以上，包含数字和字母的密码" />
        </el-form-item>
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input v-model="registerForm.confirmPassword" type="password" placeholder="再次输入密码" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showRegister = false">取消</el-button>
        <el-button type="primary" @click="handleRegister">注册</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'
import axios from 'axios'

// 配置后端地址
const request = axios.create({
  baseURL: '/api'
})

const router = useRouter()
const loginFormRef = ref(null)
const registerFormRef = ref(null)
const showRegister = ref(false)

// 登录表单
const loginForm = ref({ phone: '', password: '' })
const loginRules = ref({
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '手机号格式错误', trigger: 'blur' }
  ],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
})

// 注册表单
const registerForm = ref({ 
  username: '', 
  email: '',
  phone: '', 
  password: '', 
  confirmPassword: '' 
})

// 注册校验规则
const registerRules = ref({
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '邮箱格式不正确', trigger: 'blur' }
  ],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '手机号格式错误', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' },
    { 
      validator: (rule, value, callback) => {
        if (!/[a-zA-Z]/.test(value) || !/[0-9]/.test(value)) {
          callback(new Error('密码必须同时包含字母和数字'))
        } else {
          callback()
        }
      }, 
      trigger: 'blur' 
    }
  ],
  confirmPassword: [
    { required: true, message: '请再次输入密码', trigger: 'blur' },
    { validator: (r, v, cb) => v !== registerForm.value.password ? cb(new Error('两次密码不一致')) : cb(), trigger: 'blur' }
  ]
})

const handleLogin = async () => {
  const valid = await loginFormRef.value.validate().catch(() => false)
  if (!valid) return

  try {
    const { data } = await request.post('/login', {
      phone: loginForm.value.phone,
      password: loginForm.value.password
    })
    
    const fullUserInfo = {
      ...data.user,
      phone: data.user.phone || loginForm.value.phone, // 用登录时的手机号兜底
      accountType: data.user.accountType || '普通用户'
    }
    localStorage.setItem('userToken', data.token)
    localStorage.setItem('userInfo', JSON.stringify(fullUserInfo))
    
    window.dispatchEvent(new StorageEvent('storage'))
    
    ElMessage.success('登录成功！')
    router.push('/home')
  } catch (error) {
    ElMessage.error(error.response?.data?.message || '登录失败！')
  }
}

// 注册逻辑
const handleRegister = async () => {
  const valid = await registerFormRef.value.validate().catch(() => false)
  if (!valid) return

  try {
    await request.post('/register', {
      username: registerForm.value.username,
      email: registerForm.value.email,
      phone: registerForm.value.phone,
      password: registerForm.value.password
    })

    ElMessage.success('注册成功！')
    showRegister.value = false
    loginForm.value.phone = registerForm.value.phone
    registerForm.value = { username: '', email: '', phone: '', password: '', confirmPassword: '' }
  } catch (error) {
    ElMessage.error(error.response?.data?.message || '注册失败！')
  }
}
</script>

<style scoped>
.login-page {
  min-height: calc(100vh - 60px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: #f5f7fa;
}
.login-card {
  width: 100%;
  max-width: 420px;
  background: #fff;
  padding: 40px 30px;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.1);
}
.login-card h2 {
  text-align: center;
  margin-bottom: 30px;
  color: #333;
  font-size: 22px;
}
</style>