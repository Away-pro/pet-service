<template>
  <div class="detail-page">
    <div class="post-item">
      <div class="post-header">
        <img :src="detail.avatar || defaultAvatar" class="avatar" />
        <div class="info">
          <h4>{{ detail.username }}</h4>
          <span>{{ formatTime(detail.createdAt) }}</span>
        </div>
      </div>

      <!-- 同步：标题+内容拆分 -->
      <div v-if="parsePostContent(detail).title" class="post-title">
        {{ parsePostContent(detail).title }}
      </div>
      <div class="post-content">{{ parsePostContent(detail).content }}</div>

      <!-- 🔥 同步：话题展示区（文章与图片之间） -->
      <div v-if="parsePostContent(detail).topics.length" class="post-topics">
        <span class="topic-tag" v-for="(topic, idx) in parsePostContent(detail).topics" :key="idx">
          #{{ topic }}
        </span>
      </div>

      <!-- 同步：多图网格布局 + 点击预览 -->
      <div v-if="parsePostImages(detail).length > 0" class="post-images-grid">
        <img 
          v-for="(img, idx) in parsePostImages(detail)" 
          :key="idx" 
          :src="img" 
          class="post-img-grid"
          @click.stop="openImagePreview(parsePostImages(detail), idx)"
        />
      </div>

      <!-- 文章点赞 -->
      <div class="like-wrapper" @click.stop="toggleLike">
        <span class="like-icon">{{ detail.isLiked ? '❤️' : '♡' }}</span>
        <span class="like-count">{{ detail.likes || 0 }}</span>
      </div>
    </div>

    <div class="comment-box">
      <h3>评论</h3>
      
      <!-- 一级评论输入框 -->
      <div class="comment-input-group">
        <el-input v-model="comment" placeholder="发表评论" />
        <el-button type="primary" @click="sendComment">发送</el-button>
      </div>

      <!-- 评论列表：仅两级，一级 + 二级 -->
      <div class="comment-list">
        <div class="comment-item" v-for="item in commentList" :key="item.id" :data-comment-id="item.id">
          <!-- 一级评论主体 -->
          <div class="comment-main">
            <img 
              :src="item.avatar || defaultAvatar" 
              class="comment-avatar" 
              @click="goToUserProfile(item.userId)"
            />
            <div class="comment-body">
              <div class="comment-top">
                <span class="comment-author">{{ item.username }}</span>
                <el-tag v-if="item.userId === detail.userId" type="danger" size="small">作者</el-tag>
                <span class="comment-time">{{ formatTime(item.createdAt) }}</span>
              </div>
              <p class="comment-text">{{ item.content }}</p>
              <div class="comment-tool">
                <span @click="openReply(item)">回复</span>
                <span @click="toggleCommentLike(item)">
                  {{ item.isLiked ? '❤️' : '♡' }} {{ item.likes || 0 }}
                </span>
              </div>
            </div>
          </div>

          <!-- 一级评论回复框 -->
          <div v-if="replyId === item.id" class="reply-input">
            <el-input v-model="replyContent" :placeholder="`回复 ${item.username}：`" />
            <el-button type="primary" size="small" @click="sendReply(item.id)">回复</el-button>
            <el-button size="small" @click="cancelReply">取消</el-button>
          </div>

          <!-- 二级评论区 -->
          <div class="child-comment" v-if="item.children?.length">
            <div v-for="child in showReplyList(item)" :key="child.id" class="comment-item" :data-comment-id="child.id">
              <div class="comment-main">
                <img 
                  :src="child.avatar || defaultAvatar" 
                  class="comment-avatar child-avatar" 
                  @click="goToUserProfile(child.userId)"
                />
                <div class="comment-body">
                  <div class="comment-top">
                    <span class="comment-author">{{ child.username }}</span>
                    <el-tag v-if="child.userId === detail.userId" type="danger" size="small">作者</el-tag>
                    <span v-if="child.replyToUsername" class="reply-to">▶ {{ child.replyToUsername }}</span>
                    <span class="comment-time">{{ formatTime(child.createdAt) }}</span>
                  </div>
                  <p class="comment-text">{{ child.content }}</p>
                  <div class="comment-tool">
                    <span @click="openReply(child)">回复</span>
                    <span @click="toggleCommentLike(child)">
                      {{ child.isLiked ? '❤️' : '♡' }} {{ child.likes || 0 }}
                    </span>
                  </div>
                </div>
              </div>
              <div v-if="replyId === child.id" class="reply-input child-reply">
                <el-input v-model="replyContent" :placeholder="`回复 ${child.username}：`" />
                <el-button type="primary" size="small" @click="sendReply(child.id)">回复</el-button>
                <el-button size="small" @click="cancelReply">取消</el-button>
              </div>
            </div>

            <!-- 展开/收起二级评论 -->
            <span v-if="item.children.length > 1" class="expand-btn" @click="toggleExpand(item)">
              {{ item.expand ? '收起回复' : `展开${item.children.length-1}条回复` }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- 同步：图片全屏预览器 -->
    <el-image-viewer
      v-if="previewVisible"
      :url-list="previewImgList"
      :initial-index="previewIndex"
      @close="previewVisible = false"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElImageViewer } from 'element-plus'
import axios from 'axios'

const route = useRoute()
const router = useRouter()
const request = axios.create({ baseURL: '/api' })

// 基础数据
const detail = ref({})
const comment = ref('')
const replyContent = ref('')
const replyId = ref(null)
const user = JSON.parse(localStorage.getItem('userInfo') || '{}')
const defaultAvatar = '/images/default_avatar.png'
const commentList = ref([])

// 同步：图片预览变量
const previewVisible = ref(false)
const previewImgList = ref([])
const previewIndex = ref(0)

// 🔥 同步升级：解析 [标题]内容[话题1,话题2]
const parsePostContent = (item) => {
  if (!item?.content) return { title: '', content: '', topics: [] }
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

// 同步：解析多图URL
const parsePostImages = (item) => {
  if (!item?.imgUrl) return []
  return item.imgUrl.split(',').map(url => url.trim()).filter(Boolean)
}

// 同步：打开图片预览
const openImagePreview = (imgArr, index) => {
  previewImgList.value = imgArr
  previewIndex.value = index
  previewVisible.value = true
}

//评论自动定位核心函数 
const scrollToComment = async () => {
  const commentId = route.query.commentId
  if (!commentId) return

  await nextTick()
  const commentEl = document.querySelector(`[data-comment-id="${commentId}"]`)
  if (!commentEl) return

  const parentComment = commentEl.closest('.child-comment')?.previousElementSibling?.closest('.comment-item')
  if (parentComment) {
    const parentItem = commentList.value.find(item => item.id == parentComment.dataset.commentId)
    if (parentItem) parentItem.expand = true
    await nextTick()
  }

  commentEl.scrollIntoView({
    behavior: 'smooth',
    block: 'center'
  })

  commentEl.style.transition = 'background-color 0.5s ease'
  commentEl.style.backgroundColor = '#fff7e6'
  setTimeout(() => {
    commentEl.style.backgroundColor = 'transparent'
  }, 1500)
}

//点赞相关
const getLikeStorageKey = () => {
  const uid = user?.id || 'guest'
  return `user_post_like_records_${uid}`
}
const getLocalLikeRecords = () => {
  return JSON.parse(localStorage.getItem(getLikeStorageKey()) || '{}')
}
const saveLocalLikeRecord = (postId, isLiked) => {
  const records = getLocalLikeRecords()
  isLiked ? (records[postId] = true) : delete records[postId]
  localStorage.setItem(getLikeStorageKey(), JSON.stringify(records))
}

const getCommentLikeKey = () => {
  const uid = user?.id || 'guest'
  return `user_comment_like_records_${uid}`
}
const getLocalCommentLikes = () => {
  return JSON.parse(localStorage.getItem(getCommentLikeKey()) || '{}')
}
const saveCommentLikeRecord = (commentId, isLiked) => {
  const records = getLocalCommentLikes()
  isLiked ? (records[commentId] = true) : delete records[commentId]
  localStorage.setItem(getCommentLikeKey(), JSON.stringify(records))
}

// 时间格式化
const formatTime = (time) => {
  if (!time) return ''
  return new Date(time).toLocaleString('zh-CN')
}

//核心：扁平二级评论树 + 精准标注回复规则
const formatCommentTree = (list) => {
  const commentLikes = getLocalCommentLikes()
  const map = {}
  const roots = []
  
  list.forEach(item => {
    item.children = []
    item.expand = false
    item.isLiked = !!commentLikes[item.id]
    item.replyToUsername = ''
    map[item.id] = item
  })

  list.forEach(item => {
    if (item.parentId === 0 || !item.parentId) {
      roots.push(item)
    } else {
      let rootParent = map[item.parentId]
      while (rootParent?.parentId !== 0 && map[rootParent?.parentId]) {
        rootParent = map[rootParent.parentId]
      }

      if (rootParent) {
        rootParent.children.push(item)
        const parentComment = map[item.parentId]
        if (parentComment?.parentId !== 0) {
          item.replyToUsername = parentComment.username
        } else {
          item.replyToUsername = ''
        }
      }
    }
  })

  commentList.value = roots
  scrollToComment()
}

//回复相关
const openReply = (item) => {
  replyId.value = item.id
  replyContent.value = ''
}

const cancelReply = () => {
  replyId.value = null
  replyContent.value = ''
}

// 发送回复
const sendReply = async (parentId) => {
  if (!replyContent.value) return ElMessage.warning('请输入回复内容')
  if (!user.id) return ElMessage.warning('请先登录')
  
  try {
    await request.post('/community/comment/add', {
      postId: route.params.id,
      userId: user.id,
      username: user.username,
      content: replyContent.value,
      parentId
    })
    ElMessage.success('回复成功')
    cancelReply()
    getDetail()
  } catch (error) {
    ElMessage.error('回复失败')
    console.error(error)
  }
}

// 发送评论
const sendComment = async () => {
  if (!comment.value) return ElMessage.warning('请输入评论内容')
  if (!user.id) return ElMessage.warning('请先登录')
  
  try {
    await request.post('/community/comment/add', {
      postId: route.params.id,
      userId: user.id,
      username: user.username,
      content: comment.value,
      parentId: 0
    })
    ElMessage.success('评论成功！')
    comment.value = ''
    getDetail()
  } catch (error) {
    ElMessage.error('评论失败')
    console.error(error)
  }
}

const toggleCommentLike = async (item) => {
  if (!user.id) return ElMessage.warning('请先登录')
  const likeRecords = getLocalCommentLikes()
  const isLiked = !!likeRecords[item.id]
  
  if (isLiked && (item.likes || 0) <= 0) {
    return ElMessage.warning('已经取消点赞了')
  }

  const originalLiked = isLiked
  item.isLiked = !isLiked
  item.likes = item.likes || 0
  item.likes += item.isLiked ? 1 : -1

  saveCommentLikeRecord(item.id, item.isLiked)
  await request.post('/community/comment/like', { 
    commentId: item.id,
    userId: user.id,
    isLiked: item.isLiked
  }).catch(err => {
    item.isLiked = originalLiked
    item.likes += item.isLiked ? -1 : 1
    saveCommentLikeRecord(item.id, item.isLiked)
    ElMessage.error('操作失败')
  })
  ElMessage.success(item.isLiked ? '点赞成功' : '取消点赞')
}

const getDetail = async () => {
  try {
    const { data } = await request.get('/community/post/detail', { 
      params: { id: route.params.id } 
    })
    const postData = data.data || {}
    const likeRecords = getLocalLikeRecords()
    
    detail.value = {
      ...postData,
      isLiked: !!likeRecords[postData.id],
      likes: postData.likes || 0
    }
    formatCommentTree(postData.comments || [])
  } catch (error) {
    console.error("获取详情失败：", error)
    ElMessage.error("获取动态详情失败")
  }
}

const toggleExpand = (item) => item.expand = !item.expand
const showReplyList = (item) => item.expand ? item.children : item.children.slice(0, 1)

const goToUserProfile = (userId) => {
  if (!userId) return
  router.push(`/community/profile/${userId}`)
}

// 文章点赞
const toggleLike = async () => {
  if (!user.id) return ElMessage.warning('请先登录')
  const postId = detail.value.id
  const likeRecords = getLocalLikeRecords()
  const isLiked = !!likeRecords[postId]

  detail.value.isLiked = !isLiked
  detail.value.likes = detail.value.likes || 0
  detail.value.likes += detail.value.isLiked ? 1 : -1
  saveLocalLikeRecord(postId, detail.value.isLiked)

  await request.post('/community/post/like', {
    id: postId,
    userId: user.id,
    isLiked: detail.value.isLiked
  }).catch(() => {
    detail.value.isLiked = isLiked
    detail.value.likes += isLiked ? -1 : 1
    saveLocalLikeRecord(postId, isLiked)
    ElMessage.error('操作失败')
  })
}

onMounted(() => {
  getDetail()
})
</script>

<style scoped>
.detail-page { max-width: 900px; margin: 30px auto; padding: 0 20px; }
.post-item { background: white; padding: 20px; border-radius: 12px; margin-bottom: 20px; }
.post-header { display: flex; align-items: center; gap: 10px; margin-bottom: 15px; }
.avatar { width: 50px; height: 50px; border-radius: 50%; cursor: pointer; }

/* 同步：动态标题样式 */
.post-title {
  font-size: 18px;
  font-weight: bold;
  color: #222;
  margin-bottom: 10px;
  line-height: 1.5;
}
.post-content { line-height:1.6; margin-bottom:15px; }

/* 🔥 同步：话题标签样式 */
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

/* 文章点赞 */
.like-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 15px;
  font-size: 16px;
  cursor: pointer;
  user-select: none;
  color: #666;
}
.like-icon { font-size: 20px; }

/* 评论区 */
.comment-box { background: white; padding: 20px; border-radius: 12px; }
.comment-input-group {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
}
.comment-input-group :deep(.el-input) { flex: 1; }

/* 评论项 */
.comment-item { margin-bottom: 15px; padding-bottom: 15px; border-bottom: 1px solid #f5f5f5; }
.comment-main { display: flex; gap: 10px; align-items: flex-start; }
.comment-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  cursor: pointer;
  flex-shrink: 0;
}
.child-avatar { width: 32px; height: 32px; }
.comment-body { flex: 1; }
.comment-top { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; flex-wrap: wrap; }
.comment-author { font-weight: bold; font-size: 14px; }
.reply-to {
  font-size: 12px;
  color: #999;
  margin-left: 4px;
}
.comment-time { font-size: 12px; color: #999; }
.comment-text { margin: 0 0 6px 0; font-size: 14px; line-height: 1.5; }
.comment-tool { display: flex; gap: 15px; font-size: 12px; color: #666; cursor: pointer; }

/* 回复输入框 */
.reply-input {
  display: flex;
  gap: 10px;
  margin: 10px 0 10px 50px;
}
.child-reply {
  margin-left: 80px !important;
}

.child-comment {
  margin-left: 50px;
  margin-top: 10px;
}
.expand-btn {
  font-size: 12px;
  color: #1890ff;
  cursor: pointer;
  margin-left: 40px;
}
</style>