<template>
  <div class="profile-edit-page">
    <h3>编辑个人主页</h3>
    
    <!-- 头像上传 -->
    <div class="form-item avatar-section">
      <label>头像</label>
      <div class="avatar-wrapper">
        <img 
          :src="previewAvatar || form.avatar || '/images/default_avatar.png'" 
          class="avatar-preview" 
        />
        <el-button size="small" @click="triggerAvatarUpload">更换头像</el-button>
        <input 
          ref="avatarInput"
          type="file"
          accept="image/*"
          style="display: none"
          @change="handleAvatarChange"
        />
      </div>
    </div>

    <!-- 个性签名 -->
    <div class="form-item">
      <label>个性签名</label>
      <el-input 
        v-model="form.signature" 
        type="textarea" 
        :rows="3" 
        placeholder="分享你的养宠理念~" 
      />
    </div>

    <!-- 性别 + 生日 -->
    <div class="form-row">
      <div class="form-item">
        <label>性别</label>
        <el-select v-model="form.gender" placeholder="请选择">
          <el-option label="男" value="male" />
          <el-option label="女" value="female" />
          <el-option label="保密" value="secret" />
        </el-select>
      </div>
      <div class="form-item">
        <label>生日</label>
        <el-date-picker 
          v-model="form.birthday" 
          type="date" 
          placeholder="选择日期" 
          value-format="YYYY-MM-DD" 
        />
      </div>
    </div>

    <!-- 所在地 -->
    <div class="form-item">
      <label>所在地</label>
      <el-input v-model="form.location" placeholder="请输入城市或地区" />
    </div>

    <el-button type="primary" @click="saveProfile">保存修改</el-button>
  </div>
</template>

<script setup>
import { ref, reactive, inject, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import axios from 'axios'

const user = inject('user')
const router = useRouter()
const request = axios.create({ baseURL: '/api' })

const avatarInput = ref(null)
const previewAvatar = ref('')

// 表单数据
const form = reactive({
  signature: '',
  gender: 'secret',
  birthday: '',
  location: '',
  avatar: ''
})

// 点击按钮触发选择图片
const triggerAvatarUpload = () => {
  avatarInput.value?.click()
}

const handleAvatarChange = async (event) => {
  const file = event.target.files[0]
  if (!file) return

  // 校验
  if (!file.type.startsWith('image/')) {
    ElMessage.warning('请选择图片文件！')
    return
  }
  if (file.size > 5 * 1024 * 1024) {
    ElMessage.warning('图片不能超过5MB！')
    return
  }

  try {
    const formData = new FormData()
    formData.append('file', file)

    // 请求上传
    const { data } = await request.post('/community/upload', formData)
    if (data.code === 200) {
      const imageUrl = data.data  
      previewAvatar.value = imageUrl
      form.avatar = imageUrl
      ElMessage.success('头像上传成功！')
    } else {
      ElMessage.error(data.msg || '上传失败')
    }
  } catch (error) {
    ElMessage.error('头像上传失败')
    console.error(error)
  } finally {
    event.target.value = '' 
  }
}

// 加载时获取数据库中的资料
const getCurrentProfile = async () => {
  try {
    const { data } = await request.get('/community/user/profile', {
      params: { userId: user.id }
    })
    if (data.code === 200) {
      form.signature = data.data.signature || '养宠达人 | 分享科学养宠经验 🐾'
      form.gender = data.data.gender || 'secret'
      form.birthday = data.data.birthday || ''
      form.location = data.data.location || ''
      form.avatar = data.data.avatar || ''
      previewAvatar.value = data.data.avatar || ''
    }
  } catch (e) { ElMessage.error('获取资料失败') }
}

// 保存资料（提交URL到数据库）
const saveProfile = async () => {
  try {
    //处理无效日期，未选择则传null
    const submitData = {
      userId: user.id,
      signature: form.signature,
      gender: form.gender,
      birthday: form.birthday === 'Invalid date' || !form.birthday ? null : form.birthday,
      location: form.location,
      avatar: form.avatar
    }

    const { data } = await request.post('/community/user/profile/update', submitData)
    if (data.code === 200) {
      ElMessage.success('保存成功！')
      router.push('/community/profile')
    }
  } catch (error) {
    ElMessage.error('保存失败！')
    console.error(error)
  }
}

onMounted(() => {
  if (user.id) getCurrentProfile()
})
</script>

<style scoped>
.profile-edit-page { max-width: 700px; margin: 50px auto; padding: 0 20px; }
.form-item { margin-bottom: 20px; }
.form-item label { 
  display: block; 
  margin-bottom: 8px; 
  font-weight: bold; 
  color: #333; 
}
.form-row { display: flex; gap: 20px; }
.form-row .form-item { flex: 1; }
.avatar-section { display: flex; align-items: center; gap: 20px; }
.avatar-wrapper { display: flex; align-items: center; gap: 15px; }
.avatar-preview { 
  width: 80px; 
  height: 80px; 
  border-radius: 50%; 
  object-fit: cover; 
  border: 2px solid #f0f9ff; 
}
</style>