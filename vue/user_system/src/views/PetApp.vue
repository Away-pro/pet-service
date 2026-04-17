<template>
  <div class="pet-archive-container">
    <!-- 顶部标题栏 -->
    <div class="header">
      <h2 class="title">🐾 宠物档案管理</h2>
      <el-button type="primary" class="add-btn" @click="openDialog()">+ 添加宠物档案</el-button>
    </div>

    <!-- 宠物列表区域 -->
    <div class="pet-list">
      <!-- 空数据提示 -->
      <div class="empty-tip" v-if="petList.length === 0">
        <div class="empty-icon">🐱</div>
        <div class="empty-text">还没有添加宠物哦~，快去添加吧</div>
        <el-button type="primary" size="small" @click="openDialog()">立即添加</el-button>
      </div>

      <!-- 宠物档案卡片：点击卡片直接编辑 -->
      <div class="pet-card-list" v-else>
        <el-card 
          v-for="(item, index) in petList" 
          :key="item.id || index" 
          class="pet-card"
          shadow="hover"
          @click="openDialog(item)"
          style="cursor: pointer"
        >
          <!-- 卡片头部 -->
          <div class="card-header">
            <el-avatar 
              :src="item.avatarUrl" 
              class="pet-avatar" 
              :size="90"
              icon="el-icon-user"
            />
            <div class="pet-name">{{ item.petNickname }}</div>
          </div>

          <!-- 卡片内容 -->
          <div class="card-content">
            <div class="info-row">
              <span class="label">宠物类型：</span>
              <span class="value">{{ item.petType }}</span>
            </div>
            <div class="info-row">
              <span class="label">年龄：</span>
              <span class="value">{{ item.age }}</span>
            </div>
            <div class="info-row">
              <span class="label">体重：</span>
              <span class="value">{{ item.weight }}</span>
            </div>
            <div class="info-row">
              <span class="label">疫苗状态：</span>
              <span class="value">{{ item.vaccine }}</span>
            </div>
            <div class="info-row">
              <span class="label">过敏史：</span>
              <span class="value">{{ item.allergy || '无' }}</span>
            </div>
            <div class="info-row">
              <span class="label">饮食禁忌：</span>
              <span class="value">{{ item.feeding || '无' }}</span>
            </div>
            <div class="info-row">
              <span class="label">性格备注：</span>
              <span class="value">{{ item.note || '无' }}</span>
            </div>
          </div>
        </el-card>
      </div>
    </div>

    <!-- 添加/编辑宠物弹窗 -->
    <el-dialog 
      v-model="dialogVisible" 
      :title="isEdit ? '编辑宠物档案' : '新增宠物档案'" 
      width="600px"
      append-to-body
      class="pet-dialog"
    >
      <el-form 
        ref="formRef" 
        :model="form" 
        :rules="rules" 
        label-width="100px"
        class="pet-form"
      >
        <!-- 宠物照片上传 -->
        <el-form-item label="宠物照片" prop="avatar">
          <div class="upload-container">
            <el-upload
              class="avatar-uploader"
              action="/api/upload/image"
              :show-file-list="false"
              :on-success="handleAvatarSuccess"
              :before-upload="beforeAvatarUpload"
              accept="image/*"
            >
              <div v-if="!form.avatar" class="upload-box">
                <i class="el-icon-plus upload-icon"></i>
                <div class="upload-text">点击上传宠物照片</div>
              </div>
              <img v-else :src="form.avatar" class="preview-img" />
            </el-upload>
            <div class="upload-tip">支持JPG/PNG格式，大小不超过2MB</div>
          </div>
        </el-form-item>

        <el-form-item label="宠物名称" prop="petName">
          <el-input 
            v-model="form.petName" 
            placeholder="请输入宠物名字" 
            class="form-input"
          />
        </el-form-item>

        <el-form-item label="宠物类型" prop="petType">
          <el-select 
            v-model="form.petType" 
            placeholder="请选择宠物类型"
            class="form-select"
          >
            <el-option label="猫咪" value="猫咪" />
            <el-option label="狗狗" value="狗狗" />
            <el-option label="小宠" value="小宠" />
            <el-option label="鸟儿" value="鸟儿" />
          </el-select>
        </el-form-item>

        <el-form-item label="年龄" prop="age">
          <el-input 
            v-model="form.age" 
            placeholder="例如：2岁" 
            class="form-input"
          />
        </el-form-item>

        <el-form-item label="体重" prop="weight">
          <el-input 
            v-model="form.weight" 
            placeholder="例如：5kg" 
            class="form-input"
          />
        </el-form-item>

        <el-form-item label="疫苗状态" prop="vaccine">
          <el-select 
            v-model="form.vaccine" 
            placeholder="请选择疫苗状态"
            class="form-select"
          >
            <el-option label="已接种" value="已接种" />
            <el-option label="未接种" value="未接种" />
          </el-select>
        </el-form-item>

        <el-form-item label="过敏史" prop="allergy">
          <el-input 
            v-model="form.allergy" 
            type="textarea" 
            placeholder="请输入宠物过敏史，无则填无"
            class="form-textarea"
            :rows="3"
          />
        </el-form-item>

        <el-form-item label="饮食禁忌" prop="feeding">
          <el-input 
            v-model="form.feeding" 
            type="textarea" 
            placeholder="请输入宠物饮食禁忌，无则填无"
            class="form-textarea"
            :rows="3"
          />
        </el-form-item>

        <el-form-item label="性格备注" prop="note">
          <el-input 
            v-model="form.note" 
            type="textarea" 
            placeholder="请输入宠物性格备注，无则填无"
            class="form-textarea"
            :rows="3"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          
          <!-- 编辑模式：显示删除按钮 -->
          <el-button 
            v-if="isEdit" 
            type="danger" 
            icon="el-icon-delete"
            @click="handleDeleteInDialog"
          >
            删除
          </el-button>

          <el-button 
            type="primary" 
            @click="submitForm()"
            :loading="submitLoading"
          >
            {{ isEdit ? '保存修改' : '保存档案' }}
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, nextTick } from 'vue'
import axios from 'axios'
import { ElMessage, ElMessageBox } from 'element-plus'

// 基础配置
const request = axios.create({ baseURL: '/api' })
const formRef = ref(null)
const dialogVisible = ref(false)
const isEdit = ref(false)
const submitLoading = ref(false)
const petList = ref([])

// 表单数据
const form = reactive({
  id: '', // 编辑时存储宠物ID
  petName: '',
  petType: '',
  age: '',
  weight: '',
  vaccine: '',
  allergy: '',
  feeding: '',
  note: '',
  avatar: '' // 宠物照片URL
})

// 所有字段必填校验规则
const rules = {
  avatar: [{ required: true, message: '请上传宠物照片', trigger: 'change' }],
  petName: [{ required: true, message: '请输入宠物名称', trigger: 'blur' }],
  petType: [{ required: true, message: '请选择宠物类型', trigger: 'change' }],
  age: [{ required: true, message: '请输入宠物年龄', trigger: 'blur' }],
  weight: [{ required: true, message: '请输入宠物体重', trigger: 'blur' }],
  vaccine: [{ required: true, message: '请选择疫苗状态', trigger: 'change' }],
  allergy: [{ required: true, message: '请输入过敏史（无则填无）', trigger: 'blur' }],
  feeding: [{ required: true, message: '请输入饮食禁忌（无则填无）', trigger: 'blur' }],
  note: [{ required: true, message: '请输入性格备注（无则填无）', trigger: 'blur' }]
}

const parsePetInfo = (petName) => {
  const reg = /^(.+?)\[(.*?)\]$/
  const match = petName.match(reg)
  if (match) {
    return {
      petNickname: match[1],
      avatarUrl: match[2]
    }
  }
  return { petNickname: petName, avatarUrl: '' }
}

const restorePetInfo = (pet) => {
  const { petNickname, avatarUrl } = parsePetInfo(pet.petName)
  Object.assign(form, {
    id: pet.id,
    petName: petNickname,
    petType: pet.petType,
    age: pet.age,
    weight: pet.weight,
    vaccine: pet.vaccine,
    allergy: pet.allergy || '',
    feeding: pet.feeding || '',
    note: pet.note || '',
    avatar: avatarUrl || ''
  })
}

// 打开弹窗
const openDialog = (pet = null) => {
  // 重置表单
  Object.assign(form, {
    id: '',
    petName: '',
    petType: '',
    age: '',
    weight: '',
    vaccine: '',
    allergy: '',
    feeding: '',
    note: '',
    avatar: ''
  })
  
  if (pet) {
    // 编辑模式
    isEdit.value = true
    restorePetInfo(pet)
  } else {
    // 新增模式
    isEdit.value = false
  }
  
  dialogVisible.value = true
  // 重置表单校验
  nextTick(() => {
    formRef.value?.clearValidate()
  })
}

// 图片上传前校验
const beforeAvatarUpload = (file) => {
  const isImage = file.type.startsWith('image/')
  const isLt2M = file.size / 1024 / 1024 < 2

  if (!isImage) {
    ElMessage.error('只能上传图片格式文件！')
    return false
  }
  if (!isLt2M) {
    ElMessage.error('上传图片大小不能超过2MB！')
    return false
  }
  return true
}

// 图片上传成功回调
const handleAvatarSuccess = (res) => {
  form.avatar = res.url
  ElMessage.success('宠物照片上传成功！')
}

// 获取宠物列表
const getPetList = async () => {
  const user = JSON.parse(localStorage.getItem('userInfo'))
  if (!user) return
  
  try {
    const res = await request.get('/pet/list', { params: { userId: user.id } })
    if (res.data.code === 200) {
      petList.value = res.data.data
        .map(item => ({ ...item, ...parsePetInfo(item.petName) }))
        .sort((a, b) => a.id - b.id)
    }
  } catch (e) {
    console.error('获取宠物列表失败：', e)
    ElMessage.error('获取宠物档案失败，请稍后重试')
  }
}

const submitForm = async () => {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  const user = JSON.parse(localStorage.getItem('userInfo'))
  if (!user) {
    ElMessage.warning('请先登录！')
    return
  }

  submitLoading.value = true
  
  try {
    const petNameStr = `${form.petName}[${form.avatar}]`
    const submitData = {
      ...form,
      petName: petNameStr,
      userId: user.id,
      userName: user.username,
      userPhone: user.phone || ""
    }

    if (!isEdit.value) {
      delete submitData.id;
    }

    let res
    if (isEdit.value) {
      res = await request.put(`/pet/update/${form.id}`, submitData)
    } else {
      res = await request.post('/pet/add', submitData)
    }

    if (res.data.code === 200) {
      ElMessage.success(isEdit.value ? '修改成功！' : '新增成功！')
      dialogVisible.value = false
      getPetList()
    } else {
      ElMessage.error(res.data.message || '操作失败，请稍后重试')
    }
  } catch (err) {
    console.error('提交失败：', err)
    // 捕获axios错误
    if (err.response?.data?.message) {
      ElMessage.error(err.response.data.message)
    } else {
      ElMessage.error('服务器异常，请稍后重试')
    }
  } finally {
    submitLoading.value = false
  }
}

// 弹窗内删除宠物
const handleDeleteInDialog = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要删除该宠物档案吗？此操作不可恢复！',
      '删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    const res = await request.delete(`/pet/delete/${form.id}`)
    if (res.data.code === 200) {
      ElMessage.success('删除成功！')
      dialogVisible.value = false
      getPetList()
    } else {
      ElMessage.error(res.data.message || '删除失败，请稍后重试')
    }
  } catch (err) {
    if (err !== 'cancel') {
      console.error('删除失败：', err)
      ElMessage.error('删除操作异常，请稍后重试')
    }
  }
}

// 页面加载时获取列表
onMounted(() => {
  getPetList()
})
</script>

<style scoped>
.pet-archive-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 30px 20px;
  font-family: "Microsoft Yahei", sans-serif;
}
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  border-bottom: 1px solid #f0f0f0;
  padding-bottom: 15px;
}
.title { margin: 0; font-size: 24px; color: #333; }
.pet-list { width: 100%; }
.empty-tip { text-align: center; padding: 80px 0; background: #f9f9f9; border-radius: 12px; }
.pet-card-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, 350px);
  gap: 20px;
  max-width: calc(3 * 350px + 2 * 20px);
  margin: 0 auto;
  justify-content: center;
}
.pet-card {
  border-radius: 12px;
  transition: all 0.3s;
  border: 1px solid #e8e8e8;
  overflow: hidden;
}
.pet-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 20px rgba(0,0,0,0.08);
  border-color: #409eff;
}
.card-header {
  text-align: center;
  padding: 20px 0;
  border-bottom: 1px solid #f5f5f5;
  background: #fff !important;
}
.pet-avatar { margin-bottom: 10px; border: 3px solid #fff; }
.pet-name { font-size: 18px; font-weight: 600; margin: 0; }
.card-content { padding: 20px; }
.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  font-size: 14px;
  padding: 4px 0;
}
.label { color: #666; font-weight: 500; }
.value { color: #333; font-weight: 500; text-align: right; }
.dialog-footer { display: flex; gap: 10px; justify-content: flex-end; }
.upload-box { width: 150px; height: 150px; border: 2px dashed #dcdfe6; display: flex; flex-direction: column; align-items: center; justify-content: center; border-radius: 8px; }
.preview-img { width: 150px; height: 150px; object-fit: cover; border-radius: 8px; }
</style>