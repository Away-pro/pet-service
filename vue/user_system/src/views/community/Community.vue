<template>
  <div class="community-page">
    <div class="header">
      <h2>🐾 宠伴社区</h2>
      <el-button type="primary" @click="$router.push('/community/post')">+ 发布动态</el-button>
    </div>

    <div class="container">
      <!-- 左侧：动态流 -->
      <div class="main">
        <div class="post-item" v-for="item in paginatedList" :key="item.id" @click="toDetail(item.id)">
          <div class="post-header">
            <img :src="item.avatar || defaultAvatar" class="avatar" alt="用户头像" />
            <div class="info">
              <h4>{{ item.username }}</h4>
              <span>{{ formatTime(item.createdAt) }}</span>
            </div>
          </div>

          <div v-if="parsePostContent(item).title" class="post-title">
            {{ parsePostContent(item).title }}
          </div>
          <div class="post-content">{{ parsePostContent(item).content }}</div>

          <!-- 🔥 新增：话题展示区（文章与图片之间） -->
          <div v-if="parsePostContent(item).topics.length" class="post-topics">
            <span class="topic-tag" v-for="(topic, idx) in parsePostContent(item).topics" :key="idx">
              #{{ topic }}
            </span>
          </div>

          <!-- 多图 + 点击预览 -->
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
            <el-button text @click.stop="toggleLike(item)">
              {{ item.isLiked ? '❤️' : '♡' }} {{ item.likes || 0 }}
            </el-button>
            <el-button text>💬 {{ item.comments || 0 }}</el-button>
          </div>
        </div>

        <el-pagination
          v-if="postList.length > pageSize"
          class="pagination"
          @current-change="handleCurrentChange"
          :current-page="currentPage"
          :page-size="pageSize"
          layout="prev, pager, next, total"
          :total="postList.length"
        />
      </div>

      <!-- 右侧：侧边栏 -->
      <div class="sidebar">
        <div class="card my-home-card">
          <div class="my-home-header" @click="goToMyProfile">
            <img :src="userInfo.avatar || defaultAvatar" class="my-home-avatar" />
            <div class="my-home-info">
              <h4>{{ userInfo.username || user.username }}</h4>
              <p class="my-home-signature">{{ userInfo.signature || '这家伙很懒，什么都没留下~' }}</p>
            </div>
          </div>
          <el-button type="primary" size="small" class="my-home-btn" @click="goToMyProfile">
            进入个人主页
          </el-button>
        </div>

        <div class="card message-card" @click="goToMessagePage">
          <h3>
            🔔 消息通知
            <span v-if="unreadCount" class="unread-badge">{{ unreadCount }}</span>
          </h3>
          <div class="message-list">
            <div class="message-item" v-for="msg in messageList.slice(0,2)" :key="msg.id">
              <div class="msg-avatar-box">
                <img :src="msg.avatar || defaultAvatar" class="msg-avatar" />
                <span v-if="msg.unread" class="unread-dot"></span>
              </div>
              <div class="msg-content">
                <p class="msg-title">{{ msg.title }}</p>
                <p class="msg-desc">{{ msg.desc }}</p>
                <span class="msg-time">{{ formatTime(msg.time) }}</span>
              </div>
            </div>
            <div class="empty-msg" v-if="messageList.length === 0">暂无消息~</div>
            <div class="view-all" v-if="messageList.length>0">查看全部消息 →</div>
          </div>
        </div>

        <div class="card">
          <h3>🔥 热门活动</h3>
          <div 
            class="activity-item" 
            v-for="act in activityList" 
            :key="act.id"
            @click="goToActivity(act.id)"
          >
            <div class="act-title">{{ act.title }}</div>
            <div class="act-info">
              <span>📅 {{ act.time }}</span>
              <span>👥 {{ act.participants }}人参与</span>
            </div>
          </div>
        </div>

        <div class="card">
          <h3>👥 宠友圈</h3>
          <div 
            class="friend-item" 
            v-for="friend in friendList" 
            :key="friend.id"
            @click="goToFriendProfile(friend.id)"
          >
            <img :src="friend.avatar || defaultAvatar" class="friend-avatar" />
            <span class="friend-name">{{ friend.username }}</span>
            <el-button 
              v-if="!friend.isFollowed" 
              type="primary" 
              size="small" 
              @click.stop="followFriend(friend.id)"
            >
              关注
            </el-button>
            <el-button 
              v-else 
              type="success" 
              size="small" 
              @click.stop="unfollowFriend(friend.id)"
            >
              已关注
            </el-button>
          </div>
        </div>
      </div>
    </div>

    <!-- 图片全屏预览器 -->
    <el-image-viewer
      v-if="previewVisible"
      :url-list="previewImgList"
      :initial-index="previewIndex"
      @close="previewVisible = false"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, inject, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElImageViewer } from 'element-plus'
import axios from 'axios'

const router = useRouter()
const user = inject('user')
const request = axios.create({ 
  baseURL: '/api',
  timeout: 10000
})

request.interceptors.request.use(
  config => {
    const token = localStorage.getItem('userToken')
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
  },
  error => Promise.reject(error)
)

// 图片预览全局变量
const previewVisible = ref(false)
const previewImgList = ref([])
const previewIndex = ref(0)

// 打开图片预览
const openImagePreview = (imgArr, index) => {
  previewImgList.value = imgArr
  previewIndex.value = index
  previewVisible.value = true
}

const postList = ref([])
const activityList = ref([])
const friendList = ref([])
const userInfo = ref({})
const defaultAvatar = '/images/default_avatar.png'

// 分页
const currentPage = ref(1)
const pageSize = ref(4)
const paginatedList = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return postList.value.slice(start, end)
})
const handleCurrentChange = (val) => {
  currentPage.value = val
  window.scrollTo(0, 0)
}

//消息 + 实时轮询
const messageList = ref([])
const unreadCount = ref(0)
const msgTypeMap = {
  like: '点赞提醒',
  follow: '关注提醒',
  comment: '评论我的',
  system: '系统消息',
  friend: '私信消息'
}

let msgTimer = null

const getPrivateMsgContacts = async () => {
  if (!user?.id) return []
  try {
    const { data } = await request.get('/community/friend/message-list', {
      params: { userId: user.id }
    })
    return data.code === 200 ? (data.data || []).filter(item => item.unreadCount > 0) : []
  } catch (e) {
    return []
  }
}

const getTotalUnreadCount = async () => {
  if (!user?.id) return
  try {
    const { data } = await request.get('/community/message/unread-count', {
      params: { userId: user.id }
    })
    if (data.code === 200) {
      unreadCount.value = Object.values(data.data).reduce((sum, val) => sum + val, 0)
    }
  } catch (e) {}
}

const getRealMsgList = async () => {
  if (!user?.id) return
  try {
    const [likeRes, followRes, commentRes, systemRes] = await Promise.all([
      request.get('/community/message/list', { params: { userId: user.id, type: 'like' } }),
      request.get('/community/message/list', { params: { userId: user.id, type: 'follow' } }),
      request.get('/community/message/list', { params: { userId: user.id, type: 'comment' } }),
      request.get('/community/message/list', { params: { userId: user.id, type: 'system' } })
    ])

    const privateContacts = await getPrivateMsgContacts()
    const systemMsgs = [
      (likeRes.data?.data || []),
      (followRes.data?.data || []),
      (commentRes.data?.data || []),
      (systemRes.data?.data || [])
    ].flat()

    const privateMsgs = privateContacts.map(contact => ({
      id: `private_${contact.id}`,
      avatar: contact.avatar || defaultAvatar,
      title: `${contact.username}发来私信`,
      desc: contact.lastMsg || '新私信',
      time: contact.lastTime,
      unread: contact.unreadCount > 0,
      friendId: contact.id,
      msgType: 'friend'
    }))

    const allMsg = [...systemMsgs, ...privateMsgs].sort((a, b) => {
      const tA = new Date(a.time || a.createdAt)
      const tB = new Date(b.time || b.createdAt)
      return tB - tA
    })

    messageList.value = allMsg.map(item => {
      if (item.msgType === 'friend') return item
      return {
        id: item.id,
        avatar: item.avatar || defaultAvatar,
        title: msgTypeMap[item.type] || '消息提醒',
        desc: item.content || '新通知',
        time: item.createdAt,
        unread: !item.isRead,
        msgType: item.type
      }
    })

    await getTotalUnreadCount()
  } catch (error) {}
}

const goToMessagePage = (item) => {
  if (item?.msgType === 'friend') {
    const name = item.title.replace('发来私信', '')
    router.push(`/community/message?targetId=${item.friendId}&targetName=${name}&targetAvatar=${item.avatar}`)
  } else {
    router.push('/community/message')
  }
}

const formatTime = (time) => time ? new Date(time).toLocaleString('zh-CN', { hour12: false }) : ''
const getLikeStorageKey = () => `user_post_like_records_${user?.id || 'guest'}`
const getLocalLikeRecords = () => JSON.parse(localStorage.getItem(getLikeStorageKey()) || '{}')
const saveLocalLikeRecord = (postId, isLiked) => {
  const r = getLocalLikeRecords()
  isLiked ? r[postId] = true : delete r[postId]
  localStorage.setItem(getLikeStorageKey(), JSON.stringify(r))
}

const getMyProfile = async () => {
  if (!user?.id) return
  try {
    const { data } = await request.get('/community/user/profile', { params: { userId: user.id } })
    if (data.code === 200) userInfo.value = { ...data.data, username: user.username }
  } catch (e) {}
}

const getActivityList = async () => {
  try {
    const { data } = await request.get('/community/activity/list')
    data.code === 200 && (activityList.value = data.data || [])
  } catch (e) { ElMessage.error('获取活动失败') }
}

const getFriendList = async () => {
  if (!user?.id) return
  try {
    const { data } = await request.get('/community/friend/list', { params: { currentUserId: user.id } })
    data.code === 200 && (friendList.value = data.data || [])
  } catch (e) { ElMessage.error('获取宠友失败') }
}

const getPostList = async () => {
  try {
    const { data } = await request.get('/community/post/list')
    const r = getLocalLikeRecords()
    postList.value = (data.data || []).map(item => ({
      ...item, isLiked: !!r[item.id], likes: item.likes || 0, comments: item.comments || 0
    }))
    currentPage.value = 1
  } catch (e) { ElMessage.error('获取动态失败') }
}

// 🔥 升级解析函数：自动提取 标题、正文、末尾话题
const parsePostContent = (item) => {
  if (!item.content) return { title: '', content: '', topics: [] }
  // 正则匹配：[标题]正文[话题1,话题2,话题3]
  const regex = /^\[(.*?)\]([\s\S]*?)(?:\[([^\]]*)\])?$/
  const match = item.content.match(regex)
  
  if (match) {
    const title = match[1]?.trim() || ''
    const content = match[2]?.trim() || ''
    // 解析话题数组
    const topicStr = match[3] || ''
    const topics = topicStr ? topicStr.split(',').map(t => t.trim()).filter(Boolean) : []
    return { title, content, topics }
  }

  // 兼容无话题的旧数据
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

// 解析多图
const parsePostImages = (item) => {
  if (!item.imgUrl) return []
  return item.imgUrl.split(',').map(url => url.trim()).filter(Boolean)
}

const toggleLike = async (post) => {
  try {
    post.isLiked = !post.isLiked
    post.likes += post.isLiked ? 1 : -1
    saveLocalLikeRecord(post.id, post.isLiked)
    await request.post('/community/post/like', { id: post.id, userId: user.id, isLiked: post.isLiked })
    ElMessage.success(post.isLiked ? '点赞成功' : '取消点赞')
    getRealMsgList()
  } catch (e) {
    post.isLiked = !post.isLiked
    post.likes += post.isLiked ? -1 : 1
    saveLocalLikeRecord(post.id, post.isLiked)
    ElMessage.error('操作失败')
  }
}

const toDetail = (id) => router.push(`/community/detail/${id}`)
const goToMyProfile = () => router.push('/community/profile')
const goToActivity = (id) => router.push(`/community/activity/${id}`)
const goToFriendProfile = (id) => {
  if (id == user.id) return ElMessage.warning('这是你自己~')
  router.push(`/community/profile/${id}`)
}

const followFriend = async (id) => {
  if (id == user.id) return ElMessage.warning('不能关注自己！')
  try {
    await request.post('/community/friend/follow', { followerId: user.id, followingId: id })
    const i = friendList.value.findIndex(f => f.id === id)
    i !== -1 && (friendList.value[i].isFollowed = true)
    ElMessage.success('关注成功')
    getRealMsgList()
  } catch (e) { ElMessage.error('已关注') }
}

const unfollowFriend = async (id) => {
  try {
    await request.post('/community/friend/unfollow', { followerId: user.id, followingId: id })
    const i = friendList.value.findIndex(f => f.id === id)
    i !== -1 && (friendList.value[i].isFollowed = false)
    ElMessage.success('已取消关注')
  } catch (e) { ElMessage.error('操作失败') }
}

const truncateContent = (content) => {
  if (!content) return ''
  const lines = content.split('\n')
  return lines.length > 2 ? lines.slice(0,2).join('\n')+'\n...' : content
}

onMounted(async () => {
  if (!user?.id) return
  
  await getPostList()
  await getActivityList()
  await getFriendList()
  await getMyProfile()
  await getRealMsgList()

  msgTimer = setInterval(() => {
    getRealMsgList()
  }, 1500)
})

onUnmounted(() => {
  if (msgTimer) {
    clearInterval(msgTimer)
    msgTimer = null
  }
})
</script>

<style scoped>
.community-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
.container {
  display: flex;
  gap: 20px;
}
.main {
  flex: 1;
}
.sidebar {
  width: 300px;
}
.post-item {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 15px;
  box-shadow: 0 2px 8px #00000010;
  cursor: pointer;
}
.post-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}
.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
}
.post-title {
  font-size: 18px;
  font-weight: bold;
  margin: 10px 0;
  color: #333;
}
.post-content {
  line-height: 1.6;
  color: #555;
  white-space: pre-wrap;
}

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

.post-images-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin: 10px 0;
}
.post-img-grid {
  width: 100%;
  height: 120px;
  object-fit: cover;
  border-radius: 8px;
}
.post-footer {
  display: flex;
  gap: 20px;
  margin-top: 10px;
}
.card {
  background: #fff;
  border-radius: 12px;
  padding: 15px;
  margin-bottom: 15px;
  box-shadow: 0 2px 8px #00000010;
}
.pagination {
  text-align: center;
  margin-top: 20px;
}

.community-page {
  max-width: 1200px;
  margin: 20px auto;
  padding: 0 15px;
}
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
  padding-bottom: 15px;
  border-bottom: 1px solid #f0f0f0;
}
.header h2 {
  margin: 0;
  font-size: 22px;
  color: #333;
}
.container {
  display: flex;
  gap: 25px;
}
.main {
  flex: 3;
}
.sidebar {
  flex: 1;
  min-width: 280px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.card {
  background: #fff;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 1px 8px rgba(0, 0, 0, 0.04);
  transition: all 0.3s ease;
  cursor: pointer;
}
.card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  transform: translateY(-2px);
}
.card h3 {
  margin: 0 0 15px 0;
  font-size: 18px;
  color: #333;
  padding-bottom: 10px;
  border-bottom: 1px #f0f0f0;
  display: flex;
  align-items: center;
  gap: 8px;
}
.unread-badge{
  background: #f56c6c;
  color: #fff;
  font-size: 12px;
  padding: 0 6px;
  height: 18px;
  border-radius: 9px;
  line-height: 18px;
}
.my-home-card {
  background: linear-gradient(135deg, #f0f9ff 0%, #e6f7ff 100%);
  border: 1px solid #bae7ff;
  padding: 18px;
}
.my-home-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 15px;
  cursor: pointer;
}
.my-home-avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #fff;
}
.my-home-info {
  flex: 1;
}
.my-home-info h4 {
  margin: 0 0 4px 0;
  font-size: 16px;
  color: #1890ff;
}
.my-home-signature {
  margin: 0;
  font-size: 13px;
  color: #666;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.my-home-btn {
  width: 100%;
  font-weight: 500;
}
.message-list {
  max-height: 220px;
  overflow-y: auto;
}
.message-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 0;
  border-bottom: 1px solid #f5f5f5;
}
.message-item:last-child {
  border-bottom: none;
}
.msg-avatar-box{
  position: relative;
}
.msg-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
}
.unread-dot{
  position: absolute;
  top: 0;
  right: 0;
  width: 8px;
  height: 8px;
  background: #f56c6c;
  border-radius: 50%;
}
.msg-content {
  flex: 1;
}
.msg-title {
  margin: 0 0 3px 0;
  font-size: 14px;
  font-weight: 500;
  color: #333;
}
.msg-desc {
  margin: 0 0 3px 0;
  font-size: 12px;
  color: #666;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.msg-time {
  font-size: 11px;
  color: #999;
}
.empty-msg {
  text-align: center;
  padding: 20px 0;
  color: #999;
  font-size: 13px;
}
.view-all{
  text-align: center;
  color: #1890ff;
  font-size: 12px;
  padding-top: 8px;
}
.post-item {
  background: #fff;
  padding: 22px;
  border-radius: 12px;
  margin-bottom: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 1px 8px rgba(0, 0, 0, 0.04);
}
.post-item:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  transform: translateY(-2px);
}
.post-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 15px;
}
.avatar {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px #f5f5f5;
}
.post-title {
  font-size: 18px;
  font-weight: bold;
  color: #222;
  margin-bottom: 10px;
  line-height: 1.5;
}
.post-content {
  line-height: 1.7;
  margin-bottom: 15px;
  font-size: 15px;
  color: #444;
}
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
.post-footer {
  display: flex;
  align-items: center;
  gap: 15px;
  color: #999;
}
.activity-item {
  padding: 14px 0;
  border-bottom: 1px #f0f0f0;
  cursor: pointer;
  transition: all 0.2s ease;
  border-radius: 6px;
}
.activity-item:last-child {
  border-bottom: none;
}
.activity-item:hover {
  background: #f8f9fa;
  padding-left: 8px;
}
.act-title {
  font-weight: 600;
  margin-bottom: 6px;
  color: #333;
}
.act-info {
  font-size: 12px;
  color: #999;
  display: flex;
  gap: 15px;
}
.friend-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px #f0f0f0;
  cursor: pointer;
  transition: all 0.2s ease;
  border-radius: 6px;
}
.friend-item:hover {
  background: #f8f9fa;
}
.friend-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
}
.friend-name {
  flex: 1;
  font-weight: 500;
  color: #333;
}
.pagination {
  text-align: center;
  margin: 20px 0;
}
@media (max-width: 992px) {
  .container {
    flex-direction: column;
  }
  .sidebar {
    min-width: auto;
  }
}
</style>