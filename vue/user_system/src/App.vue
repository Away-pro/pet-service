<template>
  <div class="app-container">
    <!-- 头部导航 -->
    <header class="header">
      <div class="logo" @click="$router.push('/home')">
        🐾 宠伴朝夕
      </div>

      <!-- 搜索框：删除搜索按钮，仅保留输入框 -->
      <div class="search-box">
        <el-input
          v-model="searchKey"
          placeholder="搜索服务/商品/社区..."
          clearable
          @keyup.enter="handleSearch"
          @focus="showFuncList = true"
          @blur="handleSearchBlur"
        />

        <!-- 功能搜索下拉 -->
        <div
          class="search-dropdown"
          v-if="showFuncList && funcList.length"
          @mousedown.prevent
        >
          <div
            v-for="item in funcList"
            :key="item.path"
            class="dropdown-item"
            @mousedown="goToPage(item.path)"
          >
            🚀 直达：{{ item.name }}
          </div>
        </div>
      </div>

      <nav class="nav">
        <router-link to="/home">首页</router-link>
        <router-link to="/goods">宠伴商城</router-link>
        <router-link to="/pet-add">宠物档案</router-link>
        <router-link to="/foster">寄养预约</router-link>
        <router-link to="/community">宠伴社区</router-link>

        <!-- 在线客服 -->
        <div class="nav-icon" title="联系客服">
          <el-badge :value="unreadCount" :hidden="unreadCount === 0">
            <el-icon size="20" @click="$router.push('/service')">
              <Service />
            </el-icon>
          </el-badge>
        </div>

        <!-- 购物车：修复 数量隐藏 + 实时更新 -->
        <div class="nav-icon" v-if="isLogin" title="购物车">
          <el-badge :value="cartTotal" :hidden="cartTotal === 0">
            <el-icon size="20" @click="$router.push('/cart')">
              <ShoppingCart />
            </el-icon>
          </el-badge>
        </div>

        <!-- 登录/用户菜单 -->
        <button class="login-btn" v-if="!isLogin" @click="$router.push('/login')">
          登录 / 注册
        </button>
        <div class="user-menu" v-else>
          <router-link to="/user">个人中心</router-link>
          <button class="logout-btn" @click="handleLogout">退出登录</button>
        </div>
      </nav>
    </header>

    <main class="main">
      <el-config-provider :locale="zhCn">
        <router-view />
      </el-config-provider>
    </main>

    <!-- 🔥 宠物健康悬浮按钮 -->
    <div class="health-float-btn" @click="toggleHealthPanel">
      宠物健康
    </div>

    <!-- 🔥 可拖拽 + 可收起 宠物健康顾问面板（不遮挡页面） -->
    <div 
      class="health-panel" 
      v-show="showHealthPanel"
      :style="{ left: `${panelPos.x}px`, top: `${panelPos.y}px` }"
      @mousedown="startDrag"
    >
      <!-- 拖拽标题栏 + 收起按钮 -->
      <div class="panel-header">
        <span>🐾 宠物健康顾问</span>
        <div class="header-btns">
          <el-icon @click.stop="foldPanel" class="fold-btn"><Minus /></el-icon>
          <el-icon @click.stop="closePanel" class="close-btn"><Close /></el-icon>
        </div>
      </div>

      <!-- 聊天内容区 -->
      <div class="panel-body" v-show="!isFolded">
        <div class="health-chat-box" ref="chatRef">
          <div v-for="(item, idx) in chatList" :key="idx" :class="['chat-item', item.role]">
            <div class="chat-avatar">{{ item.role === 'user' ? '我' : 'AI' }}</div>
            <div class="chat-content">
              <div class="msg-text" :class="{ 'typing': item.isTyping }">{{ item.content }}</div>
            </div>
          </div>
          <div v-if="aiLoading" class="chat-loading">AI正在思考中...</div>
        </div>

        <!-- 发送框 -->
        <div class="chat-send">
          <el-input v-model="sendText" placeholder="请输入宠物健康问题..." @keyup.enter="sendAIQuestion" />
          <el-button type="primary" @click="sendAIQuestion" :loading="aiLoading">发送</el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, provide, reactive, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElConfigProvider, ElIcon } from 'element-plus'
import { ShoppingCart, Search, Service, Minus, Close } from '@element-plus/icons-vue'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import axios from 'axios'

const router = useRouter()

// 原有响应式状态
const isLogin = ref(false)
const searchKey = ref('')
const showFuncList = ref(false)
const unreadCount = ref(0)
const cartTotal = ref(0)
let pollTimer = null
let blurTimer = null
let cartTimer = null

// 全局用户
const user = reactive({
  id: '', username: '', avatar: '/images/default_avatar.png',
  signature: '', gender: '', birthday: '', location: '', phone: '未绑定', accountType: '普通用户'
})

// 🔥 宠物健康面板：拖拽 + 收起 + 显示
const showHealthPanel = ref(false)
const isFolded = ref(false)
const panelPos = reactive({ x: window.innerWidth - 420, y: 120 })
const dragData = reactive({ isDragging: false, startX: 0, startY: 0 })

// 聊天相关
const sendText = ref('')
const chatList = ref([{ role: 'ai', content: '你好！我是宠物健康顾问，有任何问题都可以咨询我~' }])
const aiLoading = ref(false)
const chatRef = ref(null)

// 功能映射
const funcMap = [
  { name: '首页', path: '/home', keys: ['首页', '主页'] },
  { name: '宠伴商城', path: '/goods', keys: ['商城', '宠物用品', '商品', '猫粮', '狗粮'] },
  { name: '宠物档案', path: '/pet-add', keys: ['宠物档案', '我的宠物', '宠物信息'] },
  { name: '寄养预约', path: '/foster', keys: ['寄养', '寄养预约', '宠物寄养'] },
  { name: '宠伴社区', path: '/community', keys: ['社区', '宠伴社区', '帖子', '分享'] },
  { name: '个人中心', path: '/user', keys: ['个人中心', '我的', '用户中心'] },
  { name: '购物车', path: '/cart', keys: ['购物车', '车', '购物'] },
  { name: '在线客服', path: '/service', keys: ['客服', '联系客服', '帮助'] }
]

// 搜索列表
const funcList = computed(() => {
  const key = searchKey.value.trim().toLowerCase()
  if (!key) return []
  return funcMap.filter(item =>
    item.keys.some(k => k.toLowerCase().includes(key)) || item.name.toLowerCase().includes(key)
  )
})

// 购物车
const updateCartTotal = () => {
  if (!isLogin.value) { cartTotal.value = 0; return }
  try {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]')
    cartTotal.value = cart.reduce((sum, item) => sum + (item.quantity || 1), 0)
  } catch { cartTotal.value = 0 }
}

// 跳转
const goToPage = (path) => { router.push(path); searchKey.value = ''; showFuncList.value = false }
const handleSearchBlur = () => {
  clearTimeout(blurTimer)
  blurTimer = setTimeout(() => { showFuncList.value = false }, 200)
}

// 用户同步
const updateGlobalUser = () => {
  try {
    const token = localStorage.getItem('userToken')
    const localUser = JSON.parse(localStorage.getItem('userInfo') || '{}')
    if (!token || !localUser.id) { isLogin.value = false; cartTotal.value = 0; return }
    Object.assign(user, localUser)
    isLogin.value = true
    updateCartTotal()
  } catch (e) { localStorage.clear(); isLogin.value = false; cartTotal.value = 0 }
}

// 未读
const getServiceUnread = async () => {
  if (!isLogin.value || !user.id) { unreadCount.value = 0; return }
  try {
    const { data } = await axios.get(`/api/service/unread/${user.id}`)
    unreadCount.value = data.code === 200 ? data.count : 0
  } catch { unreadCount.value = 0 }
}

// 退出
const handleLogout = () => {
  localStorage.clear()
  updateGlobalUser()
  ElMessage.success('🐾 退出成功，期待再次与你相遇')
  router.push('/home')
}

// 搜索
const handleSearch = () => {
  const key = searchKey.value.trim()
  if (!key) { ElMessage.warning('请输入搜索内容'); return }
  const target = funcMap.find(item => item.keys.some(k => k.includes(key)) || item.name.includes(key))
  if (target) {
    ElMessage.success(`🚀 直达：${target.name}`)
    router.push(target.path)
    searchKey.value = ''
    return
  }
  ElMessage.info(`🔍 正在搜索：${key}`)
  router.push({ path: '/search', query: { keyword: key } })
}

// ==================== 🔥 面板拖拽 + 收起逻辑 ====================
const toggleHealthPanel = () => {
  showHealthPanel.value = !showHealthPanel.value
  isFolded.value = false
}
const foldPanel = () => { isFolded.value = !isFolded.value }
const closePanel = () => { showHealthPanel.value = false }

// 拖拽
const startDrag = (e) => {
  if (!e.target.closest('.panel-header')) return
  dragData.isDragging = true
  dragData.startX = e.clientX - panelPos.x
  dragData.startY = e.clientY - panelPos.y
  document.addEventListener('mousemove', onDrag)
  document.addEventListener('mouseup', stopDrag)
}
const onDrag = (e) => {
  if (!dragData.isDragging) return
  panelPos.x = e.clientX - dragData.startX
  panelPos.y = e.clientY - dragData.startY
}
const stopDrag = () => {
  dragData.isDragging = false
  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', stopDrag)
}

// ==================== 打字动画 + 滚动 ====================
const scrollToBottom = () => {
  nextTick(() => { if (chatRef.value) chatRef.value.scrollTop = chatRef.value.scrollHeight })
}
const typeWriter = async (msgId, fullText, speed = 40) => {
  let index = 0
  const msgIndex = chatList.value.findIndex(item => item.id === msgId)
  if (msgIndex === -1) return
  const timer = setInterval(async () => {
    if (index < fullText.length) {
      chatList.value[msgIndex].content += fullText.charAt(index)
      index++
      await nextTick()
      scrollToBottom()
    } else {
      clearInterval(timer)
      chatList.value[msgIndex].isTyping = false
      await nextTick()
      scrollToBottom()
    }
  }, speed)
}

// ==================== 发送健康问诊 ====================
const sendAIQuestion = async () => {
  const text = sendText.value.trim()
  if (!text) { ElMessage.warning('请输入宠物健康问题'); return }
  if (!isLogin.value) { ElMessage.warning('请先登录'); return }

  chatList.value.push({ role: 'user', content: text })
  sendText.value = ''
  aiLoading.value = true
  scrollToBottom()

  try {
    const { data } = await axios.post("/api/ai/pet_health_assessment", {
      pet_info: { name: "我的宠物", type: "通用宠物" },
      symptoms: text,
      medical_history: "无既往病史"
    })
    if (data.code === 200) {
      const aiMsgId = Date.now()
      chatList.value.push({ id: aiMsgId, role: 'ai', content: '', isTyping: true })
      await nextTick()
      typeWriter(aiMsgId, data.data)
    } else {
      chatList.value.push({ role: 'ai', content: "健康分析失败，请稍后重试" })
    }
  } catch (err) {
    console.error(err)
    chatList.value.push({ role: 'ai', content: "AI健康诊断服务暂时不可用" })
  } finally {
    aiLoading.value = false
    scrollToBottom()
  }
}

// 全局注入
provide('user', user)
provide('updateUser', updateGlobalUser)
provide('clearUnread', () => unreadCount.value = 0)

// 生命周期
onMounted(() => {
  updateGlobalUser()
  getServiceUnread()
  window.addEventListener('storage', updateGlobalUser)
  window.addEventListener('storage', updateCartTotal)
  cartTimer = setInterval(updateCartTotal, 1000)
  pollTimer = setInterval(getServiceUnread, 5000)
})
onUnmounted(() => {
  clearInterval(pollTimer)
  clearInterval(cartTimer)
  clearTimeout(blurTimer)
  window.removeEventListener('storage', updateGlobalUser)
  window.removeEventListener('storage', updateCartTotal)
  stopDrag()
})
</script>

<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
}
.app-container {
  min-height: 100vh;
  background-color: #f9fbfa;
}
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 24px;
  height: 64px;
  background: linear-gradient(90deg, #5A98E8, #73AEF5);
  color: #fff;
  box-shadow: 0 2px 15px rgba(90, 152, 232, 0.15);
  position: sticky;
  top: 0;
  z-index: 999;
  gap: 20px;
}
.logo {
  font-size: 22px;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
}
.logo:hover { transform: scale(1.03); }
.search-box {
  position: relative;
  flex: 1;
  max-width: 550px;
}
.search-dropdown {
  position: absolute;
  top: 44px;
  left: 0;
  right: 0;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  z-index: 9999;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  max-height: 220px;
  overflow-y: auto;
}
.dropdown-item {
  padding: 12px 16px;
  cursor: pointer;
  color: #333;
  border-radius: 8px;
  margin: 4px;
}
.dropdown-item:hover { background: #f0f7ff; color: #5A98E8; }
.nav {
  display: flex;
  align-items: center;
  gap: 24px;
  white-space: nowrap;
}
.nav a {
  color: white;
  text-decoration: none;
  font-size: 15px;
  font-weight: 500;
}
.nav a:hover { color: #e6f2ff; }
.nav-icon { cursor: pointer; }
.nav-icon:hover { transform: scale(1.1); }
.login-btn {
  border: none;
  background: #fff;
  color: #5A98E8;
  padding: 6px 16px;
  border-radius: 20px;
  cursor: pointer;
  font-size: 14px;
}
.login-btn:hover { box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
.user-menu { display: flex; align-items: center; gap: 12px; }
.logout-btn {
  background: #ff8686 !important;
  color: #fff !important;
  border-radius: 20px;
  padding: 6px 12px;
  border: none;
  cursor: pointer;
}
.main {
  max-width: 1200px;
  margin: 24px auto;
  padding: 0 16px;
  min-height: calc(100vh - 112px);
}

/* 🔥 悬浮按钮 */
.health-float-btn {
  position: fixed;
  right: 20px;
  top: 50%;
  transform: translateY(-50%);
  width: 60px;
  height: 120px;
  background: #5A98E8;
  color: #fff;
  writing-mode: vertical-rl;
  text-align: center;
  line-height: 60px;
  border-radius: 30px;
  cursor: pointer;
  z-index: 998;
  box-shadow: 0 4px 12px rgba(90,152,232,0.3);
  font-size: 14px;
}
.health-float-btn:hover { background: #4a89d8; }

/* 🔥 可拖拽健康面板核心样式 */
.health-panel {
  position: fixed;
  width: 400px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 8px 30px rgba(0,0,0,0.15);
  z-index: 9999;
  overflow: hidden;
  user-select: none;
}
.panel-header {
  padding: 12px 16px;
  background: #5A98E8;
  color: #fff;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: move;
  font-weight: 500;
}
.header-btns { display: flex; gap: 12px; }
.fold-btn, .close-btn { cursor: pointer; font-size: 16px; }
.panel-body { transition: all 0.3s; }

/* 聊天样式（长文本向下展开） */
.health-chat-box {
  height: 380px;
  overflow-y: auto;
  padding: 12px;
  background: #f9fbfe;
}
.chat-item {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
  align-items: flex-start;
}
.chat-item.user { flex-direction: row-reverse; }
.chat-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #5A98E8;
  color: #fff;
  text-align: center;
  line-height: 28px;
  font-size: 12px;
  flex-shrink: 0;
}
.chat-content {
  max-width: 75%;
  padding: 8px 12px;
  border-radius: 16px;
  background: #fff;
  border: 1px solid #e8f0fe;
  font-size: 14px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
}
.chat-item.user .chat-content {
  background: #5A98E8;
  color: #fff;
  border: none;
}
.chat-loading { text-align: center; color: #999; padding: 8px; font-size: 12px; }
.chat-send {
  display: flex;
  gap: 8px;
  padding: 12px;
  border-top: 1px solid #eee;
}

/* 打字光标动画 */
.msg-text.typing::after {
  content: "|";
  margin-left: 4px;
  color: #666;
  animation: blink 0.8s infinite;
}
@keyframes blink { 0%,100%{opacity:1}50%{opacity:0} }

/* 响应式 */
@media (max-width:768px) {
  .health-panel { width: calc(100vw - 40px); left: 20px !important; top: 80px !important; }
}
</style>

<style>
::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-thumb { background: #5A98E8; border-radius: 3px; }
::-webkit-scrollbar-track { background: #f1f1f1; }
.el-input__wrapper { border-radius: 22px !important; }
.el-button { border-radius: 22px !important; }
</style>