<template>
  <div class="profile-page">
    <div class="user-header">
      <div class="avatar-wrapper">
        <img 
          :src="userProfile.avatar || '/images/default_avatar.png'" 
          class="avatar" 
        />
      </div>
      <div class="user-info">
        <h2>{{ userProfile.User?.username || user.username }}</h2>
        <p class="bio">{{ userProfile.signature || '养宠达人 | 分享科学养宠经验 🐾' }}</p>
        
        <div class="user-details">
          <div class="detail-item" v-if="userProfile.gender && userProfile.gender !== 'secret'">
            <span class="label">性别：</span>
            <span class="value">{{ userProfile.gender === 'male' ? '男' : '女' }}</span>
          </div>
          <div class="detail-item" v-if="userProfile.birthday">
            <span class="label">生日：</span>
            <span class="value">{{ userProfile.birthday }}</span>
          </div>
          <div class="detail-item" v-if="userProfile.location">
            <span class="label">所在地：</span>
            <span class="value">{{ userProfile.location }}</span>
          </div>
        </div>

        <div class="stats">
          <div class="stat-item">
            <span class="number">{{ myList.length }}</span>
            <span class="label">动态</span>
          </div>
          <div class="stat-item">
            <span class="number">{{ totalLikes }}</span>
            <span class="label">获赞</span>
          </div>
          <div class="stat-item">
            <span class="number">{{ totalComments }}</span>
            <span class="label">评论</span>
          </div>
          <div class="stat-item">
            <span class="number">{{ followerCount }}</span>
            <span class="label">粉丝</span>
          </div>
          <div class="stat-item">
            <span class="number">{{ followCount }}</span>
            <span class="label">关注</span>
          </div>
        </div>

        <el-button type="primary" size="small" style="margin-top:10px" @click="goToProfileEdit">
          编辑主页
        </el-button>
      </div>
    </div>

    <div class="post-section">
      <h3>📝 我的动态</h3>
      <div class="post-list">
        <div class="post-item" v-for="item in myList" :key="item.id">
          <div class="post-header">
            <img :src="userProfile.avatar || '/images/default_avatar.png'" class="post-avatar" />
            <div class="post-meta">
              <h4>{{ userProfile.User?.username || item.username }}</h4>
              <span>{{ formatTime(item.createdAt) }}</span>
            </div>
            <div class="post-actions">
              <el-button text size="small" @click="editPost(item.id)">编辑</el-button>
              <el-button text size="small" type="danger" @click="deletePost(item.id)">删除</el-button>
            </div>
          </div>

          <!-- 同步：标题+内容拆分 -->
          <div v-if="parsePostContent(item).title" class="post-title">
            {{ parsePostContent(item).title }}
          </div>
          <div class="post-content">{{ parsePostContent(item).content }}</div>

          <!-- 🔥 统一：话题展示区 -->
          <div v-if="parsePostContent(item).topics.length" class="post-topics">
            <span class="topic-tag" v-for="(topic, idx) in parsePostContent(item).topics" :key="idx">
              #{{ topic }}
            </span>
          </div>

          <!-- 同步：多图网格布局 + 点击预览 -->
          <div v-if="parsePostImages(item).length > 0" class="post-images-grid">
            <img 
              v-for="(img, idx) in parsePostImages(item)" 
              :key="idx" 
              :src="img" 
              class="post-img-grid"
              @click.stop="openImagePreview(parsePostImages(item), idx)"
            />
          </div>

          <div class="post-footer">
            <span>❤️ {{ item.likes }} 赞</span>
            <span>💬 {{ item.comments }} 条评论</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 同步：图片预览组件 -->
    <el-image-viewer
      v-if="previewVisible"
      :url-list="previewImgList"
      :initial-index="previewIndex"
      @close="previewVisible = false"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, computed, inject } from 'vue'
import { ElMessage, ElMessageBox, ElImageViewer } from 'element-plus'
import { useRouter } from 'vue-router'
import axios from 'axios'

const router = useRouter()
const user = inject('user')
const request = axios.create({ baseURL: '/api' })

// 数据定义
const myList = ref([])
const followCount = ref(0)
const followerCount = ref(0)
const userProfile = ref({})

// 同步：图片预览变量
const previewVisible = ref(false)
const previewImgList = ref([])
const previewIndex = ref(0)

// 计算总数
const totalLikes = computed(() => myList.value.reduce((s,i)=>s+(i.likes||0),0))
const totalComments = computed(() => myList.value.reduce((s,i)=>s+(i.comments||0),0))
const formatTime = (time) => !time ? '' : new Date(time).toLocaleString('zh-CN')

// 🔥 统一升级：解析标题+内容+话题
const parsePostContent = (item) => {
  if (!item.content) return { title: '', content: '', topics: [] }
  const regex = /^\[(.*?)\]([\s\S]*?)(?:\[([^\]]*)\])?$/
  const match = item.content.match(regex)
  
  if (match) {
    const title = match[1]?.trim() || ''
    const content = match[2]?.trim() || ''
    const topicStr = match[3] || ''
    const topics = topicStr ? topicStr.split(',').map(t => t.trim()).filter(Boolean) : []
    return { title, content, topics }
  }

  const oldMatch = item.content.match(/^\[(.*?)\]([\s\S]*)$/)
  if (oldMatch) {
    return {
      title: oldMatch[1]?.trim() || '',
      content: oldMatch[2]?.trim() || '',
      topics: []
    }
  }
  
  return { title: '', content: item.content, topics: [] }
}

// 同步：解析多图URL
const parsePostImages = (item) => {
  if (!item.imgUrl) return []
  return item.imgUrl.split(',').map(url => url.trim()).filter(Boolean)
}

// 同步：打开图片预览
const openImagePreview = (imgArr, index) => {
  previewImgList.value = imgArr
  previewIndex.value = index
  previewVisible.value = true
}

// 获取我的动态
const getMyPost = async () => {
  try {
    const { data } = await request.get('/community/post/my', { params: { userId: user.id } })
    myList.value = data.data || []
  } catch (e) { 
    ElMessage.error('获取动态失败')
    console.error(e)
  }
}

// 获取个人资料
const getUserProfile = async () => {
  try {
    const { data } = await request.get('/community/user/profile', {
      params: { userId: user.id }
    })
    if (data.code === 200) {
      userProfile.value = data.data
      followerCount.value = data.data.followerCount || 0
      followCount.value = data.data.followCount || 0
    }
  } catch (e) { 
    ElMessage.error('获取用户资料失败')
    userProfile.value = {
      id: user.id,
      User: { username: user.username },
      avatar: user.avatar,
      signature: '养宠达人 | 分享科学养宠经验 🐾',
      gender: 'secret',
      birthday: null,
      location: ''
    }
  }
}

// 编辑/删除/跳转
const editPost = (id) => router.push(`/community/post/edit/${id}`)
const goToProfileEdit = () => router.push('/community/profile/edit')
const deletePost = async (id) => {
  try {
    await ElMessageBox.confirm('确定删除这条动态？')
    await request.post('/community/post/delete', { id })
    ElMessage.success('删除成功')
    getMyPost()
  } catch (e) { 
    if(e !== 'cancel') ElMessage.error('删除失败')
  }
}

onMounted(() => {
  if (!user?.id) {
    ElMessage.warning('请登录后使用该功能')
    router.push('/login')
    return 
  }
  getMyPost()
  getUserProfile()
})
</script>

<style scoped>
.profile-page { max-width:900px; margin:30px auto; padding:0 20px; }
.user-header { 
  background:#fff; 
  padding:30px; 
  border-radius:12px; 
  display:flex; 
  gap:30px; 
  align-items:flex-start; 
  margin-bottom:20px; 
  box-shadow: 0 2px 12px rgba(0,0,0,0.05);
}
.avatar { 
  width:120px; 
  height:120px; 
  border-radius:50%; 
  object-fit:cover; 
  border: 4px solid #f0f9ff; 
}
.user-info { flex:1; }
.bio { color: #666; margin-bottom: 20px; }
.user-details {
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid #eee;
  display: flex;
  gap: 30px;
  color: #666;
  font-size: 14px;
}
.detail-item .label { font-weight: bold; margin-right: 5px; }
.stats { display:flex; gap:25px; margin-top:20px; }
.stat-item { text-align:center; }
.number { font-size:18px; font-weight:bold; color:#1890ff; }
.label { font-size:12px; color:#999; }
.post-section { margin-top:30px; }
.post-item { 
  background:#fff; 
  padding:20px; 
  border-radius:12px; 
  margin-bottom:15px; 
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}
.post-header { display:flex; align-items:center; gap:12px; margin-bottom:15px; }
.post-avatar { width:50px; height:50px; border-radius:50%; }
.post-meta { flex:1; }
.post-meta h4 { margin:0 0 5px 0; font-size:16px; }
.post-meta span { font-size:12px; color:#999; }
.post-actions { flex-shrink:0; }

/* 同步：动态标题样式 */
.post-title {
  font-size: 18px;
  font-weight: bold;
  color: #222;
  margin-bottom: 10px;
  line-height: 1.5;
}
.post-content { margin-bottom:15px; line-height:1.6; }

/* 🔥 统一：话题标签样式 */
.post-topics {
  margin: 12px 0;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.topic-tag {
  color: #1890ff;
  font-size: 14px;
  padding: 4px 8px;
  border-radius: 6px;
  background: #e6f7ff;
  cursor: pointer;
  transition: all 0.2s;
}
.topic-tag:hover {
  background: #d1e9ff;
}

.post-footer { display:flex; gap:20px; font-size:14px; color:#666; }

/* 同步：多图网格布局（无hover效果） */
.post-images-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 8px;
  margin: 10px 0;
}
.post-images-grid:has(.post-img-grid:only-child) {
  grid-template-columns: 1fr;
}
.post-img-grid {
  width: 100%;
  height: 120px;
  object-fit: cover;
  border-radius: 8px;
  cursor: pointer;
}
.post-img-grid:only-child {
  height: auto;
  max-height: 500px;
  object-fit: contain;
}
</style>