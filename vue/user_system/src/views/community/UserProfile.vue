<template>
  <div class="user-profile-page">
    <!-- 用户信息卡片 -->
    <div class="user-card">
      <div class="avatar-box">
        <img :src="userInfo.avatar || defaultAvatar" alt="用户头像" class="avatar" />
      </div>
      <div class="user-info">
        <h3>{{ userInfo.username || '未知用户' }}</h3>
        <p class="signature">{{ userInfo.signature || '这家伙很懒，什么都没留下~' }}</p>
        <div class="user-details" v-if="userInfo.gender || userInfo.birthday || userInfo.location">
          <div class="detail-item" v-if="userInfo.gender && userInfo.gender !== 'secret'">
            <span class="label">性别：</span>
            <span class="value">{{ userInfo.gender === 'male' ? '男' : '女' }}</span>
          </div>
          <div class="detail-item" v-if="userInfo.birthday">
            <span class="label">生日：</span>
            <span class="value">{{ userInfo.birthday }}</span>
          </div>
          <div class="detail-item" v-if="userInfo.location">
            <span class="label">所在地：</span>
            <span class="value">{{ userInfo.location }}</span>
          </div>
        </div>

        <div class="data-stats">
          <span>动态：{{ postList.length }}</span>
          <span>关注：{{ followCount }}</span>
          <span>粉丝：{{ followerCount }}</span>
        </div>
      </div>
      <el-button 
        :type="isFollowed ? 'success' : 'primary'" 
        size="default"
        @click="handleFollow"
      >
        {{ isFollowed ? '已关注' : '关注' }}
      </el-button>
      <el-button 
        type="info" 
        size="default"
        @click="handleMessage"
      >
        私信
      </el-button>
    </div>

    <!-- TA的动态 -->
    <div class="post-container">
      <h3 class="title">📝 全部动态</h3>
      <div class="post-list">
        <div 
          class="post-item" 
          v-for="item in postList" 
          :key="item.id"
          @click="toDetail(item.id)"
        >
          <div class="post-header">
            <img :src="userInfo.avatar || defaultAvatar" class="post-avatar" />
            <div class="post-meta">
              <h4>{{ userInfo.username }}</h4>
              <span>{{ formatTime(item.createdAt) }}</span>
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
            <el-button text disabled>❤️ {{ item.likes }}</el-button>
            <el-button text disabled>💬 {{ item.comments }}</el-button>
            <span class="time">{{ formatTime(item.createdAt) }}</span>
          </div>
        </div>

        <!-- 空状态 -->
        <div class="empty" v-if="postList.length === 0">
          暂无发布任何动态~
        </div>
      </div>
    </div>

    <!-- 返回按钮 -->
    <div class="back-bar">
      <el-button type="primary" @click="$router.back()">← 返回社区</el-button>
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
import { ref, onMounted, inject } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElImageViewer } from 'element-plus'
import axios from 'axios'

const router = useRouter()
const route = useRoute()
const user = inject('user') // 当前登录用户
const targetUserId = route.params.id // 他人主页的用户ID

// 配置
const request = axios.create({ baseURL: '/api' })
const defaultAvatar = '/images/default_avatar.png'

// 数据
const userInfo = ref({})
const postList = ref([])
const isFollowed = ref(false)
const followerCount = ref(0)
const followCount = ref(0)

// 同步：图片预览变量
const previewVisible = ref(false)
const previewImgList = ref([])
const previewIndex = ref(0)

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

const handleMessage = () => {
  if (!user.id) {
    ElMessage.warning('请先登录后再发送私信');
    return;
  }

  const realUserName = userInfo.value.username || '未知用户';
  const realAvatar = userInfo.value.avatar || defaultAvatar;

  router.push({
    path: '/community/message',
    query: {
      targetId: targetUserId,
      targetName: realUserName,
      targetAvatar: realAvatar
    }
  });
};
// 1. 获取用户资料 + 关注状态
const getUserData = async () => {
  try {
    // 并行请求：用户资料 + 关注状态
    const [profileRes, followRes] = await Promise.all([
      request.get('/community/user/profile', { params: { userId: targetUserId } }),
      request.get('/community/friend/check-follow', { 
        params: { followerId: user.id, followingId: targetUserId } 
      })
    ]);

    // 处理用户资料
    if (profileRes.data.code === 200) {
      userInfo.value = profileRes.data.data || {};
      userInfo.value.username = userInfo.value.User?.username || `用户${targetUserId}`;
      //同步粉丝数和关注数
      followerCount.value = profileRes.data.data.followerCount || 0;
      followCount.value = profileRes.data.data.followCount || 0;
    }

    // 处理关注状态（核心同步）
    if (followRes.data.code === 200) {
      isFollowed.value = followRes.data.data.isFollowed;
    }

    // 获取用户动态
    const postRes = await request.get('/community/post/my', { params: { userId: targetUserId } });
    if (postRes.data.code === 200) {
      postList.value = postRes.data.data || [];
    }
  } catch (err) {
    ElMessage.error('加载数据失败');
    console.error(err);
  }
}

// 2. 关注/取消关注（同步数据库+本地状态）
const handleFollow = async () => {
  // 禁止关注自己
  if (targetUserId == user.id) {
    ElMessage.warning('不能关注自己哦！');
    return;
  }

  try {
    const reqData = { followerId: user.id, followingId: targetUserId };
    if (isFollowed.value) {
      // 取消关注
      await request.post('/community/friend/unfollow', reqData);
      ElMessage.success('已取消关注');
      // 刷新粉丝数
      followerCount.value--;
    } else {
      // 关注
      await request.post('/community/friend/follow', reqData);
      ElMessage.success('关注成功');
      // 刷新粉丝数
      followerCount.value++;
    }
    // 本地状态即时更新
    isFollowed.value = !isFollowed.value;
  } catch (err) {
    ElMessage.error(err.response?.data?.msg || '操作失败，请重试');
  }
}

// 其他原有方法
const toDetail = (id) => router.push(`/community/detail/${id}`);
const formatTime = (time) => time ? new Date(time).toLocaleString('zh-CN') : '';
const truncateContent = (content) => {
  if (!content) return '';
  const lines = content.split('\n');
  const res = lines.slice(0, 2).join('\n');
  return lines.length > 2 ? res + '...' : res;
}

onMounted(() => {
  if (user.id) getUserData();
})
</script>

<style scoped>
.user-profile-page { max-width:1200px; margin:30px auto; padding:0 20px; }
.user-card { 
  background:#fff; padding:25px 30px; border-radius:12px; 
  display:flex; align-items:center; gap:20px; 
  box-shadow:0 2px 10px rgba(0,0,0,0.06); margin-bottom:20px; 
}
.avatar { width:80px; height:80px; border-radius:50%; object-fit:cover; }
.user-info { flex:1; }
.signature { color:#666; margin:0 0 12px 0; font-size:14px; }

.user-details {
  margin-top:12px; padding-top:12px; border-top:1px solid #eee;
  display:flex; gap:25px; font-size:14px; color:#666;
}
.detail-item .label { font-weight:bold; margin-right:4px; }

.data-stats { display:flex; gap:20px; font-size:13px; color:#999; margin-top:15px; }
.post-container { background:#fff; padding:25px 30px; border-radius:12px; box-shadow:0 2px 10px rgba(0,0,0,0.06); }
.title { margin:0 0 20px 0; }
.post-item { padding:15px 0; border-bottom:1px solid #f0f0f0; cursor:pointer; }
.post-item:last-child { border-bottom:none; }
.post-header { display:flex; align-items:center; gap:10px; margin-bottom:10px; }
.post-avatar { width:40px; height:40px; border-radius:50%; object-fit:cover; }

/* 同步：动态标题样式 */
.post-title {
  font-size: 18px;
  font-weight: bold;
  color: #222;
  margin-bottom: 10px;
  line-height: 1.5;
}
.post-content { line-height:1.6; margin-bottom:10px; }

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

.post-footer { display:flex; align-items:center; gap:10px; color:#999; font-size:13px; }
.time { margin-left:auto; }
.empty { text-align:center; padding:50px 0; color:#999; }
.back-bar { text-align:center; margin-top:20px; }
</style>