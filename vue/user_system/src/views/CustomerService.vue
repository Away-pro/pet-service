<template>
  <div class="customer-service-page">
    <div class="service-header">
      <el-icon @click="$router.back()" class="back-icon"><ArrowLeft /></el-icon>
      <h3>在线客服</h3>
      <div style="margin-left:auto;display:flex;gap:8px;align-items:center">
        <span class="status">{{ isAiMode ? 'AI智能客服 🟢' : '人工客服 🟢' }}</span>
        <el-button v-if="isAiMode" size="small" type="warning" @click="switchHuman">转人工</el-button>
        <el-button v-else size="small" type="success" @click="switchAI">返回AI</el-button>
      </div>
    </div>

    <div class="message-container" ref="messageRef">
      <div class="system-msg">
        {{ new Date().toLocaleDateString() }} 开始对话，{{ isAiMode ? 'AI自动回复' : '人工客服为您服务' }}
      </div>

      <div 
        v-for="msg in messageList" 
        :key="msg.id"
        :class="['message-item', msg.type === 'service' ? 'service-msg' : 'user-msg']"
      >
        <template v-if="msg.type === 'service'">
          <div class="avatar-wrap">
            <img :src="msg.avatar || serviceAvatar" class="avatar" />
            <span class="avatar-tag">{{ isAiMode ? '智能客服' : '人工客服' }}</span>
          </div>
          <div class="msg-content">
            <div v-if="isImageContent(msg.content)" class="msg-image">
              <img :src="msg.content" @click="previewImage(msg.content)" />
            </div>
            <div v-else class="msg-text" :class="{ 'typing': msg.isTyping }">
              {{ msg.content }}
            </div>
            <div class="msg-time">{{ msg.time }}</div>
          </div>
        </template>
        <template v-else>
          <div class="msg-content">
            <div v-if="isImageContent(msg.content)" class="msg-image">
              <img :src="msg.content" @click="previewImage(msg.content)" />
            </div>
            <div v-else class="msg-text">{{ msg.content }}</div>
            <div class="msg-time">{{ msg.time }}</div>
          </div>
          <img :src="user.avatar || defaultAvatar" class="avatar" />
        </template>
      </div>

      <div v-if="aiLoading && isAiMode" class="ai-loading">
        <div class="avatar-wrap">
          <img :src="serviceAvatar" class="avatar" />
          <span class="avatar-tag">智能客服</span>
        </div>
        <div class="dot-box"><span class="dot"></span><span class="dot"></span><span class="dot"></span></div>
      </div>
    </div>

    <div class="send-box">
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
        v-model="inputContent"
        placeholder="请输入您的问题..."
        clearable
        @keyup.enter="sendMessage"
      />
      <el-button type="primary" @click="sendMessage" :loading="aiLoading">发送</el-button>

      <div v-if="showEmojiPanel" class="emoji-panel">
        <span v-for="emoji in emojiList" :key="emoji" class="emoji-item" @click="insertEmoji(emoji)">
          {{ emoji }}
        </span>
      </div>
    </div>

    <div v-if="previewImageUrl" class="image-preview-overlay" @click="closePreview">
      <div class="preview-container" @click.stop>
        <span class="close-btn" @click="closePreview">×</span>
        <div class="preview-wrapper" @wheel.prevent="handleWheel" @mousedown="handleMouseDown" @mousemove="handleMouseMove" @mouseup="handleMouseUp" @mouseleave="handleMouseUp">
          <img :src="previewImageUrl" class="preview-image" :style="{ transform: `scale(${scale}) translate(${translateX}px, ${translateY}px)` }" alt="预览图片" @dblclick="resetScale" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, inject, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { ArrowLeft } from '@element-plus/icons-vue'
import { useRouter } from 'vue-router' 
import axios from 'axios'

const router = useRouter()
const user = inject('user')

if (!user?.id) {
  ElMessage.warning('请登录后使用该功能')
}

const request = axios.create({
  baseURL: '/api',
  timeout: 10000
})
const SERVICE_USER_ID = 1;
const defaultAvatar = '/images/default_avatar.png'
const serviceAvatar = '/images/kefu.png'

const isAiMode = ref(true)
const aiLoading = ref(false)
const aiHistory = ref([])
const lastUserMessageTime = ref(0)
const AI_SESSION_EXPIRE = 10 * 60 * 1000 // 10分钟过期
const LOCAL_STORAGE_KEY = `ai_chat_${user?.id || 'guest'}`

// 本地存储工具函数
const saveAiChatToLocal = () => {
  if (!user?.id) return
  const chatData = {
    messageList: messageList.value,
    aiHistory: aiHistory.value,
    lastUserMessageTime: lastUserMessageTime.value
  }
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(chatData))
}
const loadAiChatFromLocal = () => {
  if (!user?.id) return null
  const localData = localStorage.getItem(LOCAL_STORAGE_KEY)
  if (!localData) return null
  try { return JSON.parse(localData) } catch (e) { return null }
}
const clearAiChatFromLocal = () => {
  if (!user?.id) return
  localStorage.removeItem(LOCAL_STORAGE_KEY)
}

// ============== 修复核心：切换人工函数（保留本地存储） ==============
const switchHuman = async () => {
  isAiMode.value = false
  // 把AI聊天记录用原接口发给人工
  if(aiHistory.value && aiHistory.value.length > 0){
    let logText = "【AI前置聊天记录】\n"
    aiHistory.value.forEach(item => {
      logText += item.role === 'user' ? `用户：${item.content}\n` : `AI客服：${item.content}\n`
    })
    try{
      await request.post('/service/send', {
        userId: user.id,
        username: user.username || '用户',
        content: logText
      })
      ElMessage.success('AI聊天记录已同步给人工客服')
    }catch(e){ ElMessage.info('已切换人工客服') }
  }else{ ElMessage.info('已切换人工客服') }
  // 切换人工：只清空内存，**不清除本地存储**，保留AI聊天记录
  messageList.value = []
  aiHistory.value = []
  lastUserMessageTime.value = 0
  initRead()
}

// ============== 修复核心：切换AI函数（从本地恢复聊天记录） ==============
const switchAI = async () => {
  isAiMode.value = true
  ElMessage.info('已返回AI智能客服')
  
  // 从本地加载AI聊天记录（关键修复）
  const localChat = loadAiChatFromLocal()
  if (localChat) {
    // 校验会话是否过期
    if (localChat.lastUserMessageTime && Date.now() - localChat.lastUserMessageTime > AI_SESSION_EXPIRE) {
      // 过期：清空本地，重置欢迎语
      clearAiChatFromLocal()
      messageList.value = [{
        id:1,type:'service',
        content:'您好！我是智能客服，可解答商品、饲养、订单相关问题~',
        time: smartTime(Date.now())
      }]
      aiHistory.value = []
      lastUserMessageTime.value = 0
    } else {
      // 未过期：恢复本地数据
      messageList.value = localChat.messageList
      aiHistory.value = localChat.aiHistory
      lastUserMessageTime.value = localChat.lastUserMessageTime || 0
    }
  } else {
    // 无本地记录：初始化欢迎语
    messageList.value = [{
      id:1,type:'service',
      content:'您好！我是智能客服，可解答商品、饲养、订单相关问题~',
      time: smartTime(Date.now())
    }]
    aiHistory.value = []
    lastUserMessageTime.value = 0
  }
  
  // 保存当前状态到本地
  saveAiChatToLocal()
  await nextTick()
  scrollToBottom()
}

const messageList = ref([])
const inputContent = ref('')
const messageRef = ref(null)

const previewImageUrl = ref('')
const scale = ref(1)
const translateX = ref(0)
const translateY = ref(0)
const isDragging = ref(false)
const startX = ref(0)
const startY = ref(0)

const previewImage = (url) => {
  if (!url || typeof url !== 'string') {
    ElMessage.warning('图片链接无效')
    return
  }
  previewImageUrl.value = url
  resetScale()
}
const closePreview = () => { previewImageUrl.value = ''; resetScale() }
const resetScale = () => { scale.value = 1; translateX.value = 0; translateY.value = 0 }
const zoomIn = () => { if (scale.value < 3) scale.value += 0.2 }
const zoomOut = () => { if (scale.value > 0.5) scale.value -= 0.2 }
const handleWheel = (e) => { e.deltaY < 0 ? zoomIn() : zoomOut() }
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
const handleMouseUp = () => { isDragging.value = false }

const isImageContent = (content) => {
  return typeof content === 'string' && (
    content.startsWith('http') || content.startsWith('data:image') || content.startsWith('/images/')
  )
}

const showEmojiPanel = ref(false)
const emojiList = ref(['😊', '😂', '😍', '😭', '😠', '😎', '🤔', '😜', '😘', '😔', '😌', '😱', '👍', '❤️', '💰', '🛒', '🐱', '🐶', '🐾', '🍖', '🥫', '🏠', '🚚', '✅', '❌', '💬', '⏰'])
const insertEmoji = (emoji) => { inputContent.value += emoji; showEmojiPanel.value = false }

const handleImageUpload = async (e) => {
  if(isAiMode.value){ ElMessage.warning('AI暂不支持图片，请切换人工发送'); e.target.value = ''; return }
  const file = e.target.files?.[0]
  if (!file) return
  if (!file.type.startsWith('image/')) { ElMessage.warning('只能上传图片文件'); return }
  try {
    ElMessage.info('图片发送中...')
    const formData = new FormData()
    formData.append('userId', user.id)
    formData.append('username', user.username || '用户')
    formData.append('image', file)
    await request.post('/service/send/image', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
    ElMessage.success('图片发送成功')
    refreshMsg()
    nextTick(() => scrollToBottom())
  } catch (err) { ElMessage.error(`图片发送失败：${err.message}`) } finally { e.target.value = '' }
}

const smartTime = (timestamp) => {
  const now = new Date()
  const msgTime = new Date(timestamp)
  if (isNaN(msgTime.getTime())) {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }
  const diff = now - msgTime
  const oneDay = 24 * 60 * 60 * 1000
  const pad = (num) => num.toString().padStart(2, '0')
  const hhmm = `${pad(msgTime.getHours())}:${pad(msgTime.getMinutes())}`
  const mmdd = `${pad(msgTime.getMonth() + 1)}-${pad(msgTime.getDate())}`
  if (now.toDateString() === msgTime.toDateString()) return hhmm
  if (diff < 2 * oneDay) return `昨天 ${hhmm}`
  if (diff < 3 * oneDay) return `前天 ${hhmm}`
  return `${mmdd} ${hhmm}`
}

const refreshMsg = async () => {
  if(isAiMode.value) return
  if (!user.id) return;
  try {
    const { data } = await request.get(`/service/history/${user.id}`, { params: { markRead: false } });
    if (data.code === 200) {
      messageList.value = data.data.map(item => ({
        ...item, type: item.userId === SERVICE_USER_ID ? 'service' : 'user', time: smartTime(item.createdAt)
      }));
      nextTick(() => scrollToBottom())
    }
  } catch (err) { console.error("获取历史失败：", err); }
};

const clearUnread = inject('clearUnread')
const initRead = async () => {
  if(isAiMode.value) return
  if (!user.id) return;
  try {
    await request.get(`/service/history/${user.id}`, { params: { markRead: true } });
    clearUnread(); await refreshMsg(); nextTick(() => scrollToBottom())
  } catch (err) { console.error("初始化失败", err) }
}

const scrollToBottom = () => {
  nextTick(() => { if (messageRef.value) messageRef.value.scrollTop = messageRef.value.scrollHeight })
}

// 打字动画
const typeWriter = async (msgId, fullText, speed = 40) => {
  let index = 0
  const msgIndex = messageList.value.findIndex(item => item.id === msgId)
  if (msgIndex === -1) return
  const timer = setInterval(async () => {
    if (index < fullText.length) {
      messageList.value[msgIndex].content += fullText.charAt(index)
      index++
      await nextTick(); scrollToBottom(); saveAiChatToLocal()
    } else {
      clearInterval(timer)
      messageList.value[msgIndex].isTyping = false
      await nextTick(); saveAiChatToLocal()
    }
  }, speed)
}

const sendMessage = async () => {
  const text = inputContent.value.trim()
  if (!text) { ElMessage.warning('请输入消息内容'); return }
  if (!user.id) { ElMessage.warning('请先登录'); return }

  // 人工模式逻辑
  if(!isAiMode.value){
    try {
      await request.post('/service/send', { userId: user.id, username: user.username || '用户', content: text })
      inputContent.value = ''; refreshMsg(); nextTick(() => scrollToBottom())
    } catch (error) { ElMessage.error('消息发送失败') }
    return
  }

  // AI 模式：超时判断（最后一条用户消息 >10分钟 → 清空）
  if (lastUserMessageTime.value > 0 && Date.now() - lastUserMessageTime.value > AI_SESSION_EXPIRE) {
    aiHistory.value = []
    messageList.value = []
    lastUserMessageTime.value = 0
    clearAiChatFromLocal()
    ElMessage.info('会话已超时，已为您重新开启对话')
    // 重置欢迎语
    messageList.value.push({ id:1, type:'service', content:'您好！我是智能客服，可解答商品、饲养、订单相关问题~', time: smartTime(Date.now()) })
    saveAiChatToLocal()
    await nextTick()
  }

  aiLoading.value = true
  inputContent.value = ''
  const nowTime = smartTime(Date.now())

  // 关键：用户发送消息 → 重置倒计时
  lastUserMessageTime.value = Date.now()

  // 插入用户消息
  const userMsg = { id: Date.now(), type: 'user', content: text, time: nowTime }
  messageList.value.push(userMsg)
  saveAiChatToLocal()
  await nextTick()
  scrollToBottom()

  try {
    const { data } = await request.post('/ai/smart_customer_service', {
      conversation: aiHistory.value, user_message: text
    })
    aiHistory.value.push({role:'user',content:text})
    aiHistory.value.push({role:'assistant',content:data.data})
    saveAiChatToLocal()

    // AI 打字动画
    const aiMsgId = Date.now() + 1
    messageList.value.push({ id: aiMsgId, type: 'service', content: '', time: nowTime, isTyping: true })
    saveAiChatToLocal()
    await nextTick()
    typeWriter(aiMsgId, data.data)
    scrollToBottom()
  } catch (e) {
    ElMessage.error('AI异常，已切人工')
    switchHuman()
  } finally { aiLoading.value = false }
}

// 挂载：恢复本地记录 + 计时
onMounted(async () => {
  if (user.id) {
    if(isAiMode.value){
      const localChat = loadAiChatFromLocal()
      if (localChat) {
        // 恢复本地数据
        messageList.value = localChat.messageList
        aiHistory.value = localChat.aiHistory
        lastUserMessageTime.value = localChat.lastUserMessageTime || 0

        // 恢复后校验超时
        if (lastUserMessageTime.value > 0 && Date.now() - lastUserMessageTime.value > AI_SESSION_EXPIRE) {
          // 过期：清空本地，重置欢迎语
          clearAiChatFromLocal()
          messageList.value = [{ id:1, type:'service', content:'您好！我是智能客服，可解答商品、饲养、订单相关问题~', time: smartTime(Date.now()) }]
          aiHistory.value = []
          lastUserMessageTime.value = 0
          ElMessage.info('会话已超时，已为您重新开启对话')
        }
      } else {
        // 无记录：初始化欢迎语
        messageList.value = [{ id:1, type:'service', content:'您好！我是智能客服，可解答商品、饲养、订单相关问题~', time: smartTime(Date.now()) }]
      }
      saveAiChatToLocal()
      await nextTick()
      scrollToBottom()
    }else{
      initRead()
    }
    // 人工轮询
    setInterval(()=>{ if(!isAiMode.value) refreshMsg() },3000)
  }
})
</script>

<style scoped>
.avatar-wrap{display:flex;flex-direction:column;align-items:center;gap:4px}
.avatar-tag{font-size:11px;color:#666;white-space:nowrap}

.msg-text.typing::after{
  content:"|"; margin-left:4px; color:#666; animation: blink 0.8s infinite; font-weight:500;
}
@keyframes blink{0%,100%{opacity:1}50%{opacity:0}}

.customer-service-page { 
  max-width: 700px; margin: 20px auto; border: none; border-radius: 20px; overflow: hidden; 
  height: 80vh; display: flex; flex-direction: column; box-shadow: 0 8px 30px rgba(90,152,232,0.1);background:#fff;
}
.service-header { 
  height: 60px; background: linear-gradient(135deg,#5A98E8,#6fa7f0);color:white;display:flex;
  align-items:center;padding:0 20px;gap:15px;font-weight:500;
}
.back-icon {cursor:pointer;font-size:22px;transition:transform 0.2s ease;}
.back-icon:hover{transform:translateX(-3px);}
.status {margin-left:auto;font-size:13px;display:flex;align-items:center;gap:4px;}
.message-container {flex:1;padding:20px;background:#f9fbfe;overflow-y:auto;}
.message-container::-webkit-scrollbar{width:6px;}
.message-container::-webkit-scrollbar-thumb{background:#d1e3ff;border-radius:3px;}
.message-container::-webkit-scrollbar-track{background:transparent;}
.system-msg {text-align:center;font-size:12px;color:#8a919f;margin-bottom:20px;padding:6px 12px;
background:rgba(255,255,255,0.8);border-radius:20px;display:inline-block;left:50%;position:relative;transform:translateX(-50%);}
.message-item {display:flex;margin-bottom:16px;gap:12px;align-items:flex-start;}
.service-msg {justify-content:flex-start;}
.user-msg {justify-content:flex-end;}
.avatar {width:42px;height:42px;border-radius:50%;flex-shrink:0;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.08);}
.msg-content {max-width:75%;}
.msg-text {padding:10px 14px;border-radius:16px;line-height:1.6;font-size:14px;}
.msg-image {max-width:260px;border-radius:16px;overflow:hidden;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,0.08);}
.msg-image img{width:100%;height:auto;display:block;border-radius:16px;}
.service-msg .msg-text {background:#fff;border:1px solid #e8f0fe;border-bottom-left-radius:4px;}
.user-msg .msg-text {background:#5A98E8;color:#fff;border-bottom-right-radius:4px;}
.msg-time {font-size:11px;color:#b0b7c3;margin-top:6px;text-align:right;}
.send-box {position:relative;display:flex;align-items:center;gap:10px;padding:12px 18px;border-top:1px solid #f0f5ff;background:#fff;}
.tool-icon {cursor:pointer;color:#8a919f;font-size:22px;}
.tool-icon:hover{color:#5A98E8;transform:scale(1.1);}
.send-box :deep(.el-input){flex:1;--el-input-border-radius:20px;}
.send-box :deep(.el-button){border-radius:20px;padding:0 18px;}
.emoji-panel {position:absolute;bottom:70px;left:18px;width:320px;padding:12px;background:#fff;border:1px solid #e8f0fe;
border-radius:12px;box-shadow:0 6px 20px rgba(90,152,232,0.15);display:flex;flex-wrap:wrap;gap:8px;z-index:10;}
.emoji-item {width:36px;height:36px;line-height:36px;text-align:center;font-size:20px;cursor:pointer;border-radius:6px;}
.emoji-item:hover{background:#f0f7ff;transform:scale(1.1);}
.image-preview-overlay {position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.92);
display:flex;align-items:center;justify-content:center;z-index:9999;}
.preview-container {position:relative;width:90vw;height:90vh;display:flex;align-items:center;justify-content:center;}
.close-btn {position:absolute;top:30px;right:30px;width:44px;height:44px;line-height:44px;text-align:center;
background:rgba(255,255,255,0.9);color:#000;border-radius:50%;font-size:26px;font-weight:bold;cursor:pointer;}
.close-btn:hover{background:#fff;transform:scale(1.1);}
.preview-wrapper {width:100%;height:100%;display:flex;align-items:center;justify-content:center;cursor:grab;}
.preview-wrapper:active{cursor:grabbing;}
.preview-image {max-width:100%;max-height:100%;object-fit:contain;border-radius:12px;}

.ai-loading{display:flex;gap:12px;padding:10px 20px;align-items:flex-start}
.dot-box{background:#fff;padding:12px 16px;border-radius:16px;border-bottom-left-radius:4px;display:flex;gap:6px}
.dot{width:8px;height:8px;background:#ccc;border-radius:50%;animation:jump 1.4s infinite}
.dot:nth-child(2){animation-delay:0.2s}
.dot:nth-child(3){animation-delay:0.4s}
@keyframes jump{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}

@media (max-width:768px){
.customer-service-page{margin:0;height:100vh;border-radius:0;}
.msg-content{max-width:80%;}
.emoji-panel{width:280px;}
}
</style>