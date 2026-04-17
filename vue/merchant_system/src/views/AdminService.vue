<template>
  <div class="admin-service-page">
    <h3 class="page-title">客服中心</h3>
    <div class="service-container">
      <!-- 左侧客户列表 -->
      <div class="customer-list">
        <el-input
          v-model="searchCustomer"
          placeholder="搜索客户昵称/ID"
          clearable
          size="small"
          style="margin-bottom: 12px"
        />

        <div class="customer-list-wrapper" v-if="filterCustomerList.length > 0">
          <div
            class="customer-item"
            v-for="item in filterCustomerList"
            :key="item.userId"
            :class="{ active: activeUserId === item.userId }"
            @click="switchCustomer(item.userId)"
          >
            <div class="avatar">{{ item.username.slice(0, 1) }}</div>
            <div class="customer-info">
              <p class="name">{{ item.username }}</p>
              <p class="last-msg">{{ item.lastMsg }}</p>
            </div>
            <el-badge v-if="item.unread > 0" :value="item.unread" />
          </div>
        </div>

        <div class="empty-tip" v-else>
          <el-icon size="28"><Message /></el-icon>
          <p>暂无客户咨询记录</p>
        </div>
      </div>

      <!-- 右侧聊天窗口 -->
      <div class="chat-area" v-if="activeUserId">
        <div class="chat-header">
          <h4>当前对话：{{ activeCustomer.username || '客户' }}</h4>
        </div>

        <div class="chat-content" ref="chatRef">
          <div 
            v-for="msg in msgList" 
            :key="msg.id"
            :class="['msg-item', msg.type === 'user' ? 'customer-msg' : 'admin-msg']"
          >
            <!-- 客户消息（左） -->
            <template v-if="msg.type === 'user'">
              <div class="avatar">{{ msg.username?.slice(0, 1) || '客' }}</div>
              <div class="msg-content">
                <div v-if="isImageContent(msg.content)" class="msg-image">
                  <img :src="msg.content" @click="previewImage(msg.content)" />
                </div>
                <div v-else class="msg-text">{{ msg.content }}</div>
                <div class="msg-time">{{ msg.time }}</div>
              </div>
            </template>
            <!-- 客服消息（右） -->
            <template v-else>
              <div class="msg-content">
                <div v-if="isImageContent(msg.content)" class="msg-image">
                  <img :src="msg.content" @click="previewImage(msg.content)" />
                </div>
                <div v-else class="msg-text">{{ msg.content }}</div>
                <div class="msg-time">{{ msg.time }}</div>
              </div>
              <div class="avatar">我</div>
            </template>
          </div>
        </div>

        <div class="chat-input">
          <el-icon class="tool-icon" @click="showEmojiPanel = !showEmojiPanel">
            <svg viewBox="0 0 1024 1024" width="24" height="24">
              <path d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64zm0 820c-205.4 0-372-166.6-372-372s166.6-372 372-372 372 166.6 372 372-166.6 372-372 372z" fill="#999"></path>
              <path d="M288 448a48 48 0 1 0 96 0 48 48 0 1 0-96 0zm256 0a48 48 0 1 0 96 0 48 48 0 1 0-96 0zm112 128c-29.8 0-55.8 14-72 36-16.1-22-42.2-36-72-36-49.7 0-89.9 36.1-92.3 85.1-.2 4.1 3.1 7.4 7.2 7.4h322.2c4.1 0 7.4-3.3 7.2-7.4-2.4-49-42.6-85.1-92.3-85.1z" fill="#999"></path>
            </svg>
          </el-icon>

          <el-icon class="tool-icon" @click="$refs.fileInput.click()">
            <svg viewBox="0 0 1024 1024" width="24" height="24">
              <path d="M64 832V192c0-35.3 28.7-64 64-64h832c35.3 0 64 28.7 64 64v640c0 35.3-28.7 64-64 64H128c-35.3 0-64-28.7-64-64zm128-608c-35.3 0-64 28.7-64 64s28.7 64 64 64 64-28.7 64-64-28.7-64-64-64zm576 344l-144-184-136 174-104-136-152 192h680z" fill="#999"></path>
            </svg>
          </el-icon>
          <input type="file" ref="fileInput" style="display: none" accept="image/*" @change="handleImageUpload" />

          <el-input
            v-model="replyContent"
            type="textarea"
            :rows="3"
            placeholder="请输入回复内容，按回车发送"
            @keyup.enter="sendReply"
            style="flex:1;margin:0"
          />
          <el-button type="primary" @click="sendReply">发送</el-button>

          <div v-if="showEmojiPanel" class="emoji-panel">
            <span 
              v-for="emoji in emojiList" 
              :key="emoji"
              class="emoji-item"
              @click="insertEmoji(emoji)"
            >
              {{ emoji }}
            </span>
          </div>
        </div>
      </div>

      <div class="chat-empty" v-else>
        <el-icon size="48"><ChatLineRound /></el-icon>
        <p>请选择左侧客户开始对话</p>
      </div>
    </div>

    <div v-if="previewImageUrl" class="image-preview-overlay" @click="closePreview">
      <div class="preview-container" @click.stop>
        <span class="close-btn" @click="closePreview">×</span>
        <div 
          class="preview-wrapper"
          @wheel.prevent="handleWheel"
          @mousedown="handleMouseDown"
          @mousemove="handleMouseMove"
          @mouseup="handleMouseUp"
          @mouseleave="handleMouseUp"
        >
          <img 
            :src="previewImageUrl" 
            class="preview-image" 
            :style="{ transform: `scale(${scale}) translate(${translateX}px, ${translateY}px)` }"
            alt="预览图片"
            @dblclick="resetScale"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { ElMessage, ElInput, ElBadge, ElButton, ElIcon } from 'element-plus'
import { Message, ChatLineRound } from '@element-plus/icons-vue'
import axios from 'axios'

const request = axios.create({ baseURL: '/api', timeout: 20000 })
const customerList = ref([])
const searchCustomer = ref('')
const activeUserId = ref(null)
const activeCustomer = ref({ userId: null, username: '', lastMsg: '' })
const msgList = ref([])
const replyContent = ref('')
const chatRef = ref(null)

// 表情/图片预览
const showEmojiPanel = ref(false)
const emojiList = ref(['😊', '👍', '❤️', '🙏', '✨', '📦', '🚚', '💰', '📝', '⏰', '✅', '❌', '😊', '😂', '😍', '😔', '😌'])
const previewImageUrl = ref('')
const scale = ref(1)
const translateX = ref(0)
const translateY = ref(0)
const isDragging = ref(false)
const startX = ref(0)
const startY = ref(0)

// 图片判断
const isImageContent = (content) => {
  return typeof content === 'string' && (
    content.startsWith('http') || 
    content.startsWith('data:image') ||
    content.startsWith('/images/')
  )
}

// 时间格式化
const smartTime = (timestamp) => {
  const now = new Date()
  const msgTime = new Date(timestamp)
  if (isNaN(msgTime.getTime())) return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  const diff = now - msgTime
  const oneDay = 24 * 60 * 60 * 1000
  const pad = num => num.toString().padStart(2, '0')
  const hhmm = `${pad(msgTime.getHours())}:${pad(msgTime.getMinutes())}`
  const mmdd = `${pad(msgTime.getMonth() + 1)}-${pad(msgTime.getDate())}`

  if (now.toDateString() === msgTime.toDateString()) return hhmm
  if (diff < 2 * oneDay) return `昨天 ${hhmm}`
  if (diff < 3 * oneDay) return `前天 ${hhmm}`
  return `${mmdd} ${hhmm}`
}

// 筛选客户
const filterCustomerList = computed(() => {
  if (!Array.isArray(customerList.value)) return []
  const key = searchCustomer.value.trim().toLowerCase()
  return key 
    ? customerList.value.filter(item => 
        String(item.userId).includes(key) || 
        item.username.toLowerCase().includes(key)
      )
    : customerList.value
})

// 获取客户列表
const getCustomerList = async () => {
  try {
    const res = await request.get('/service/customer/list')
    if (res?.data?.code === 200) {
      customerList.value = res.data.data || []
    }
  } catch (err) {
    customerList.value = []
  }
}

// 刷新聊天记录
const refreshChat = async (userId) => {
  if (!userId) return
  try {
    const res = await request.get(`/service/history/${userId}?markRead=false`)
    if (res.data.code === 200) {
      msgList.value = (res.data.data || []).map(item => ({
        ...item,
        type: item.userId === 1 ? 'service' : 'user',
        time: smartTime(item.createdAt)
      }))
      nextTick(() => scrollToBottom())
    }
  } catch (err) {
    ElMessage.error('刷新聊天记录失败')
  }
}

// 切换客户 + 标记已读
const switchCustomer = async (userId) => {
  activeUserId.value = userId
  const target = customerList.value.find(i => String(i.userId) === String(userId)) || { username: '客户' }
  activeCustomer.value = target

  try {
    await request.get(`/service/history/${userId}?markRead=true&source=admin`)
    await refreshChat(userId)
    getCustomerList()
  } catch (err) {
    ElMessage.error('加载聊天记录失败')
  }
}

// 发送文字
const sendReply = async () => {
  const content = replyContent.value.trim()
  if (!content || !activeUserId.value) {
    return ElMessage.warning('请选择客户并输入回复内容')
  }

  try {
    await request.post('/service/reply', {
      userId: activeUserId.value,
      content: content
    })
    ElMessage.success('发送成功')
    replyContent.value = ''
    refreshChat(activeUserId.value)
  } catch (err) {
    ElMessage.error('发送失败')
  }
}

// 发送图片
const handleImageUpload = async (e) => {
  const file = e.target.files?.[0]
  if (!file || !file.type.startsWith('image/')) {
    return ElMessage.warning('仅支持上传图片文件')
  }
  if (!activeUserId.value) {
    return ElMessage.warning('请先选择客户')
  }

  try {
    const formData = new FormData()
    formData.append('userId', activeUserId.value)
    formData.append('image', file)

    await request.post('/service/reply/image', formData)
    ElMessage.success('图片发送成功')
    replyContent.value = ''
    refreshChat(activeUserId.value)
  } catch (err) {
    ElMessage.error('图片发送失败')
  } finally {
    e.target.value = ''
  }
}

// 自动滚动
const scrollToBottom = () => {
  nextTick(() => {
    if (chatRef.value) {
      chatRef.value.scrollTop = chatRef.value.scrollHeight
    }
  })
}

// 表情插入
const insertEmoji = (emoji) => {
  replyContent.value += emoji
  showEmojiPanel.value = false
}

// 图片预览
const previewImage = (url) => {
  if (url) {
    previewImageUrl.value = url
    resetScale()
  }
}
const closePreview = () => {
  previewImageUrl.value = ''
  resetScale()
}
const resetScale = () => {
  scale.value = 1
  translateX.value = 0
  translateY.value = 0
}
const zoomIn = () => {
  if (scale.value < 3) scale.value += 0.2
}
const zoomOut = () => {
  if (scale.value > 0.5) scale.value -= 0.2
}
const handleWheel = (e) => {
  e.deltaY < 0 ? zoomIn() : zoomOut()
}
const handleMouseDown = (e) => {
  if (scale.value > 1) {
    isDragging.value = true
    startX.value = e.clientX - translateX.value
    startY.value = e.clientY - translateY.value
  }
}
const handleMouseMove = (e) => {
  if (isDragging.value) {
    translateX.value = e.clientX - startX.value
    translateY.value = e.clientY - startY.value
  }
}
const handleMouseUp = () => {
  isDragging.value = false
}

// 初始化
onMounted(() => {
  getCustomerList()
  setInterval(getCustomerList, 3000)
})
</script>

<style scoped>
.admin-service-page {
  padding: 20px;
  height: 100%;
  box-sizing: border-box;
  background: #f9fafb;
}
.page-title {
  font-size: 18px;
  font-weight: 600;
  color: #6b5b45;
  margin-bottom: 20px;
  border-left: 3px solid #d97706;
  padding-left: 10px;
}
.service-container {
  display: flex;
  gap: 20px;
  height: calc(100% - 40px);
}

/* 左侧客户列表 */
.customer-list {
  width: 300px;
  display: flex;
  flex-direction: column;
}
.customer-list-wrapper {
  flex: 1;
  border: 1px solid #e5e0d8;
  border-radius: 8px;
  overflow-y: auto;
  background: #f8f5f0;
}
.customer-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 15px;
  border-bottom: 1px solid #e5e0d8;
  cursor: pointer;
  transition: background 0.2s;
}
.customer-item:last-child {
  border-bottom: none;
}
.customer-item.active {
  background: #fffaf0 !important;
  color: #d97706 !important;
  font-weight: 600;
}
.customer-item:hover {
  background: #fffaf0;
}
.avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #fffaf0;
  color: #d97706;
  text-align: center;
  line-height: 36px;
  font-size: 14px;
  font-weight: 600;
  flex-shrink: 0;
}
.customer-info {
  flex: 1;
}
.name {
  margin: 0;
  font-size: 14px;
  color: #6b5b45;
}
.last-msg {
  margin: 4px 0 0 0;
  font-size: 12px;
  color: #6b5b45;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.empty-tip {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #6b5b45;
  border: 1px solid #e5e0d8;
  border-radius: 8px;
  background: #f8f5f0;
}
.empty-tip p {
  margin-top: 10px;
  font-size: 13px;
}

/* 聊天区域 */
.chat-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  border: 1px solid #e5e0d8;
  border-radius: 8px;
  overflow: hidden;
  background: #f8f5f0;
}
.chat-header {
  height: 48px;
  background: #f8f5f0;
  color: #6b5b45;
  display: flex;
  align-items: center;
  padding: 0 15px;
  border-bottom: 1px solid #e5e0d8;
  font-weight: 600;
}
.chat-header h4 {
  margin: 0;
  font-size: 16px;
}
.chat-content {
  flex: 1;
  padding: 15px;
  background: #f9fafb;
  overflow-y: auto;
}

/* 消息气泡 */
.msg-item {
  display: flex;
  margin-bottom: 16px;
  gap: 10px;
  align-items: flex-start;
}
.customer-msg {
  justify-content: flex-start;
}
.admin-msg {
  justify-content: flex-end;
}
.msg-content {
  max-width: 75%;
}
.msg-text {
  padding: 10px 14px;
  border-radius: 6px;
  line-height: 1.4;
  font-size: 14px;
}
.msg-image {
  max-width: 300px;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
}
.msg-image img {
  width: 100%;
  height: auto;
  display: block;
  border-radius: 8px;
}
.customer-msg .msg-text {
  background: #ffffff;
  border: 1px solid #e5e0d8;
  color: #6b5b45;
}
.customer-msg .msg-image img {
  border: 1px solid #e5e0d8;
}
.admin-msg .msg-text {
  background: #d97706;
  color: #fff;
  border: 1px solid #d97706;
}
.admin-msg .msg-image img {
  border: 1px solid #d97706;
}
.msg-time {
  font-size: 12px;
  color: #6b5b45;
  margin-top: 4px;
  text-align: right;
}

/* 输入区域 */
.chat-input {
  position: relative;
  padding: 12px 15px;
  border-top: 1px solid #e5e0d8;
  background: #f8f5f0;
  display: flex;
  align-items: center;
  gap: 8px;
}
.tool-icon {
  cursor: pointer;
  color: #999;
  font-size: 20px;
  transition: color 0.2s;
}
.tool-icon:hover {
  color: #d97706;
}
:deep(.el-button--primary) {
  background-color: #d97706;
  border-color: #d97706;
}
:deep(.el-button--primary:hover) {
  background-color: #c06905;
  border-color: #c06905;
}

/* 表情面板 */
.emoji-panel {
  position: absolute;
  bottom: 60px;
  left: 15px;
  width: 300px;
  padding: 10px;
  background: #fff;
  border:1px solid #e5e0d8;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  z-index: 10;
}
.emoji-item {
  width: 32px;
  height: 32px;
  line-height: 32px;
  text-align: center;
  font-size: 18px;
  cursor: pointer;
  border-radius: 4px;
  transition: background 0.2s;
}
.emoji-item:hover {
  background: #f5f5f5;
}

/* 图片预览 */
.image-preview-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}
.preview-container {
  position: relative;
  width: 90vw;
  height: 90vh;
  display: flex;
  align-items: center;
  justify-content: center;
}
.close-btn {
  position: absolute;
  top: 20px;
  right: 20px;
  width: 40px;
  height: 40px;
  line-height: 40px;
  text-align: center;
  background: #fff;
  color: #000;
  border-radius: 50%;
  font-size: 24px;
  font-weight: bold;
  cursor: pointer;
  z-index: 10;
}
.preview-wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: grab;
}
.preview-wrapper:active {
  cursor: grabbing;
}
.preview-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  border-radius: 8px;
  transition: transform 0.1s ease;
}

/* 空状态 */
.chat-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #6b5b45;
  border: 1px solid #e5e0d8;
  border-radius: 8px;
  background: #f8f5f0;
}
.chat-empty p {
  margin-top: 12px;
  font-size: 14px;
}
</style>