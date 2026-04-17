<template>
  <div class="message-page">
    <!-- 顶部导航栏 -->
    <div class="page-header">
      <el-button type="text" icon="el-icon-arrow-left" @click="$router.back()" class="back-btn">返回</el-button>
      <h2>消息中心</h2>
    </div>

    <!-- 搜索框 -->
    <div class="search-box">
      <el-input 
        v-model="searchKeyword" 
        placeholder="搜索用户" 
        suffix-icon="el-icon-search"
        clearable
        class="search-input"
      />
    </div>

    <!-- 消息分类Tab -->
    <div class="msg-tabs">
      <el-button 
        v-for="tab in messageTabs" 
        :key="tab.type"
        type="text"
        :class="{ active: activeTab === tab.type }"
        @click="switchTab(tab.type)"
      >
        {{ tab.name }}
        <span v-if="tab.unreadCount > 0" class="tab-badge">
          {{ tab.unreadCount > 99 ? '99+' : tab.unreadCount }}
        </span>
      </el-button>
    </div>

    <!-- 聊天布局 -->
    <div class="chat-container">
      <!-- 左侧好友列表 -->
      <div class="friend-sidebar">
        <!-- 搜索过滤后的好友列表 -->
        <div class="friend-item" 
             v-for="friend in filteredFriendList" 
             :key="friend.id"
             :class="{ active: currentFriendId === friend.id }"
             @click="selectFriend(friend)"
        >
          <div class="avatar-wrapper">
            <img :src="friend.avatar || defaultAvatar" class="friend-avatar" />
            <span v-if="friend.unreadCount > 0" class="msg-badge">
              {{ friend.unreadCount > 99 ? '99+' : friend.unreadCount }}
            </span>
          </div>
          <div class="friend-info">
            <div class="friend-name">{{ friend.username }}</div>
            <div class="last-msg" v-if="friend.lastMsg">{{ friend.lastMsg }}</div>
          </div>
          <div class="friend-time" v-if="friend.lastTime">
            {{ formatTime(friend.lastTime) }}
          </div>
        </div>

        <!-- 搜索无结果提示 -->
        <div class="empty-tip" v-if="searchKeyword && filteredFriendList.length === 0">
          未找到相关好友
        </div>

        <!-- 系统消息面板 -->
        <div class="msg-overlay-panel" v-show="showMsgPanel">
          <div class="panel-header">
            <span>{{ panelTitle }}</span>
            <el-button type="text" icon="el-icon-close" size="small" @click="closePanel" />
          </div>
          <div class="panel-list">
            <div class="panel-item" v-for="item in currentMsgList" :key="item.id" @click="handleMsgClick(item)">
              <div class="avatar-wrapper">
                <img :src="item.avatar || defaultAvatar" class="friend-avatar" />
                <span class="msg-dot" v-if="!item.isRead"></span>
              </div>
              <div class="friend-info">
                <div class="friend-name">{{ item.nickname }}</div>
                <div class="last-msg">{{ item.content }}</div>
              </div>
              <div class="friend-time">{{ formatTime(item.time) }}</div>
            </div>
            <div class="empty-tip" v-if="currentMsgList.length === 0">暂无消息</div>
          </div>
        </div>
      </div>

      <!-- 右侧聊天区域 -->
      <div class="chat-main">
        <div class="chat-empty" v-if="!currentFriend">
          <img :src="userProfile.avatar || defaultAvatar" alt="宠伴朝夕" class="empty-logo" />
          <p class="empty-tip">选择好友开始聊天吧~</p>
        </div>

        <div class="chat-content" v-else>
          <div class="chat-header">
            <img :src="currentFriend.avatar || defaultAvatar" class="chat-avatar" />
            <span class="chat-name">{{ currentFriend.username }}</span>
          </div>

          <div class="chat-messages" ref="messageRef">
            <div 
              class="msg-item" 
              v-for="msg in messageList" 
              :key="msg.id"
              :class="{ self: msg.sender === 'me' }"
            >
              <template v-if="msg.sender === 'other'">
                <img :src="currentFriend.avatar || defaultAvatar" class="msg-avatar" />
                <div class="msg-bubble">
                  <div v-if="isImageContent(msg.content)" class="msg-image">
                    <img :src="msg.content" @click="previewImage(msg.content)" class="msg-img" />
                  </div>
                  <div v-else class="msg-text">{{ msg.content }}</div>
                  <div class="msg-time">{{ formatTime(msg.createdAt || msg.time) }}</div>
                </div>
              </template>
              <template v-else>
                <div class="msg-bubble">
                  <div v-if="isImageContent(msg.content)" class="msg-image">
                    <img :src="msg.content" @click="previewImage(msg.content)" class="msg-img" />
                  </div>
                  <div v-else class="msg-text">{{ msg.content }}</div>
                  <div class="msg-time">{{ formatTime(msg.createdAt || msg.time) }}</div>
                </div>
                <img :src="userProfile.avatar || defaultAvatar" class="msg-avatar" />
              </template>
            </div>
          </div>

          <!-- 消息输入栏 -->
          <div class="chat-input">
            <div class="tool-buttons">
              <el-icon class="tool-icon" @click="showEmojiPanel = !showEmojiPanel">
                <svg viewBox="0 0 1024 1024" width="24" height="24">
                  <path d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64zm0 820c-205.4 0-372-166.6-372-372s166.6-372-372-372 372 166.6 372 372-166.6 372-372 372z" fill="#999"></path>
                  <path d="M288 448a48 48 0 1 0 96 0 48 48 0 1 0-96 0zm256 0a48 48 0 1 0 96 0 48 48 0 1 0-96 0zm112 128c-29.8 0-55.8 14-72 36-16.1-22-42.2-36-72-36-49.7 0-89.9 36.1-92.3 85.1-.2 4.1 3.1 7.4 7.2 7.4h322.2c4.1 0 7.4-3.3 7.2-7.4-2.4-49-42.6-85.1-92.3-85.1z" fill="#999"></path>
                </svg>
              </el-icon>
              <el-icon class="tool-icon" @click="$refs.fileInput.click()">
                <svg viewBox="0 0 1024 1024" width="24" height="24">
                  <path d="M64 832V192c0-35.3 28.7-64 64-64h832c35.3 0 64 28.7 64 64v640c0-35.3-28.7 64-64 64H128c-35.3 0-64-28.7-64-64zm128-608c-35.3 0-64 28.7-64 64s28.7 64 64 64 64-28.7 64-64-28.7-64-64-64zm576 344l-144-184-136 174-104-136-152 192h680z" fill="#999"></path>
                </svg>
              </el-icon>
              <input type="file" ref="fileInput" style="display: none" accept="image/*" @change="handleImageUpload" />
            </div>
            <el-input v-model="inputMsg" placeholder="输入消息..." type="textarea" :autosize="{ minRows: 1, maxRows: 4 }" @keyup.enter="sendMsg" class="msg-input" />
            <el-button type="primary" @click="sendMsg" class="send-btn">发送</el-button>
            <div v-if="showEmojiPanel" class="emoji-panel">
              <span v-for="emoji in emojiList" :key="emoji" class="emoji-item" @click="insertEmoji(emoji)">{{ emoji }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 图片预览 -->
    <div v-if="previewImageUrl" class="image-preview-overlay" @click="closePreview">
      <div class="preview-container" @click.stop>
        <span class="close-btn" @click="closePreview">×</span>
        <div class="preview-wrapper" @wheel.prevent="handleWheel" @mousedown="handleMouseDown" @mousemove="handleMouseMove" @mouseup="handleMouseUp" @mouseleave="handleMouseUp">
          <img :src="previewImageUrl" class="preview-image" :style="{ transform: `scale(${scale}) translate(${translateX}px, ${translateY}px)` }" @dblclick="resetScale" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, nextTick, inject, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import axios from 'axios'
import { useRoute, useRouter } from 'vue-router' 

// 注入用户信息
const user = inject('user')
const request = axios.create({ 
  baseURL: '/api',
  timeout: 10000
})
const route = useRoute()
const router = useRouter()

// 页面状态
const friendList = ref([])
const currentFriend = ref(null)
const currentFriendId = ref(null)
const inputMsg = ref('')
const showEmojiPanel = ref(false)
const messageRef = ref(null)
const searchKeyword = ref('')
const activeTab = ref('')
const fileInput = ref(null)

// 滚动控制标志
const isFirstLoadHistory = ref(true)

// 核心数据
const messageList = ref([])
const userProfile = ref({})
const defaultAvatar = '/images/default_avatar.png'

// 表情/图片预览
const emojiList = ref(['😊', '😂', '😍', '😭', '😠', '😎', '🤔', '👍', '❤️'])
const previewImageUrl = ref('')
const scale = ref(1)
const translateX = ref(0)
const translateY = ref(0)
const isDragging = ref(false)
const startX = ref(0)
const startY = ref(0)

// 消息分类Tab
const messageTabs = ref([
  { type: 'like', name: '点赞提醒', unreadCount: 0 },
  { type: 'follow', name: '关注提醒', unreadCount: 0 },
  { type: 'comment', name: '评论我的', unreadCount: 0 },
  { type: 'system', name: '系统消息', unreadCount: 0 }
])

// 系统消息面板
const showMsgPanel = ref(false)
const panelTitle = ref('')
const currentMsgList = ref([])

//实时搜索过滤
const filteredFriendList = computed(() => {
  if (!searchKeyword.value.trim()) {
    return friendList.value
  }
  const keyword = searchKeyword.value.trim().toLowerCase()
  return friendList.value.filter(friend => 
    friend.username?.toLowerCase().includes(keyword)
  )
})

//工具函数
const isImageContent = (content) => {
  return typeof content === 'string' && /^(https?:\/\/|\/).+\.(png|jpg|jpeg|gif|webp)$/i.test(content)
}

// 时间格式化
const formatTime = (timeStr) => {
  if (!timeStr) return ''
  const msgTime = new Date(timeStr)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)
  const msgDate = new Date(msgTime.getFullYear(), msgTime.getMonth(), msgTime.getDate())

  const hh = String(msgTime.getHours()).padStart(2, '0')
  const mm = String(msgTime.getMinutes()).padStart(2, '0')
  const time = `${hh}:${mm}`

  if (msgDate.getTime() === today.getTime()) {
    return time
  }
  if (msgDate.getTime() === yesterday.getTime()) {
    return `昨天 ${time}`
  }
  const year = msgTime.getFullYear()
  const month = msgTime.getMonth() + 1
  const day = msgTime.getDate()
  return `${year}.${month}.${day} ${time}`
}

// 聊天框滚动到底部
const scrollToBottom = () => nextTick(() => messageRef.value && (messageRef.value.scrollTop = messageRef.value.scrollHeight))

// 校验好友关系
const checkIsFriend = async (friendId) => {
  try {
    const { data } = await request.get('/community/friend/check-friend', {
      params: { followerId: user.id, followingId: friendId }
    })
    return data.data?.isFollowed || false
  } catch (err) {
    console.error('检查好友关系失败:', err)
    return false
  }
}

// 获取未读消息总数
const getRealUnreadCount = async () => {
  if (!user?.id) return
  try {
    const { data } = await request.get('/community/message/unread-count', {
      params: { userId: user.id }
    })
    if (data.code === 200) {
      messageTabs.value.forEach(tab => {
        tab.unreadCount = data.data[tab.type] || 0
      })
    }
  } catch (e) {
    console.error('获取未读计数失败:', e)
  }
}

// 单条消息标记已读
const markSingleRead = async (msgId) => {
  if (!user?.id || !msgId) return
  try {
    await request.post('/community/message/read', {
      userId: user.id,
      msgId: msgId
    })
    await getRealMsgList(activeTab.value)
    await getRealUnreadCount()
  } catch (e) {
    console.error('单条已读失败', e)
  }
}

// 刷新好友列表+排序
const refreshUnreadCount = async () => {
  if (!user?.id) return;
  try {
    const { data } = await request.get('/community/friend/message-list', { 
      params: { userId: user.id } 
    });
    if (data.code === 200) {
      const newFriendList = data.data;
      friendList.value = friendList.value.map(friend => {
        const newFriend = newFriendList.find(f => f.id === friend.id);
        return newFriend ? { ...friend, ...newFriend } : friend;
      });
      friendList.value = [...friendList.value].sort((a, b) => {
        const timeA = a.lastTime ? new Date(a.lastTime).getTime() : 0;
        const timeB = b.lastTime ? new Date(b.lastTime).getTime() : 0;
        return timeB - timeA;
      });
    }
  } catch (e) {
    console.error("刷新私信列表失败:", e);
  }
};

// 获取用户信息
const getUserProfile = async () => {
  try {
    const { data } = await request.get('/community/user/profile', { params: { userId: user.id } })
    if (data.code === 200) userProfile.value = data.data
  } catch (e) { console.error('获取头像失败') }
}

// 获取好友列表
const getRealFriendList = async () => {
  try {
    const { data } = await request.get('/community/friend/message-list', { params: { userId: user.id } })
    if (data.code === 200) {
      const sortedList = [...data.data].sort((a, b) => {
        const timeA = a.lastTime ? new Date(a.lastTime).getTime() : 0;
        const timeB = b.lastTime ? new Date(b.lastTime).getTime() : 0;
        return timeB - timeA;
      });
      friendList.value = sortedList;
    }
  } catch (e) {
    ElMessage.error('获取联系人失败')
    console.error(e)
  }
}

// 获取系统消息列表
const getRealMsgList = async (type) => {
  if (!user?.id) return
  try {
    const { data } = await request.get('/community/message/list', {
      params: { userId: user.id, type: type }
    })
    if (data.code === 200) {
      currentMsgList.value = data.data.map(item => ({
        id: item.id,
        userId: item.userId,
        postId: item.postId,
        commentId: item.commentId,
        nickname: item.username,
        avatar: item.avatar,
        content: item.content,
        time: item.createdAt,
        isRead: item.isRead,
        postCover: item.postCover
      }))
      getRealUnreadCount()
    }
  } catch (e) {
    console.error('获取系统消息失败:', e)
    ElMessage.error('获取消息失败')
  }
}

// 消息点击跳转
const handleMsgClick = async (item) => {
  if (!item) return
  await markSingleRead(item.id)

  if (item.postId) {
    router.push({
      path: `/community/detail/${item.postId}`,
      query: item.commentId ? { commentId: item.commentId } : {}
    }).catch(() => ElMessage.error('跳转失败'))
    return
  }

  if (item.userId) {
    router.push(`/community/profile/${item.userId}`).catch(() => ElMessage.error('跳转失败'))
    return
  }

  ElMessage.warning('该通知无法跳转')
}

//聊天功能 
watch(currentFriend, (newFriend) => {
  if (newFriend) {
    isFirstLoadHistory.value = true
    getMessageHistory()
  } else {
    messageList.value = []
  }
})

// 获取聊天记录
const getMessageHistory = async () => {
  if (!currentFriend.value || !user?.id) return;
  try {
    await request.post('/community/friend/message/read', {
      userId: user.id,
      friendId: currentFriend.value.id
    });

    const { data } = await request.get('/community/friend/message/list', {
      params: { userId: user.id, friendId: currentFriend.value.id }
    });
    if (data.code === 200) {
      messageList.value = (data.data || []).map(item => ({
        ...item,
        sender: item.userId === user.id ? 'me' : 'other'
      }));
      
      if (isFirstLoadHistory.value) {
        scrollToBottom()
        isFirstLoadHistory.value = false
      }
      
      const currentIndex = friendList.value.findIndex(f => f.id === currentFriend.value.id);
      if (currentIndex !== -1) {
        friendList.value[currentIndex].unreadCount = 0;
      }
    }
  } catch (err) {
    ElMessage.error('获取历史消息失败');
    console.error("历史错误:", err);
  }
};

// 发送消息
const sendMsg = async () => {
  const content = inputMsg.value.trim()
  if (!content || !currentFriend.value) return ElMessage.warning('请输入内容')

  const isFriend = await checkIsFriend(currentFriend.value.id)
  if (!isFriend) {
    const sentCount = messageList.value.filter(msg =>  
      msg.sender === 'me' && msg.toUserId === currentFriend.value.id
    ).length
    if (sentCount >= 5) {
      return ElMessage.warning('非好友最多只能发送5条消息')
    }
  }

  try {
    await request.post('/community/friend/message/send', {
      userId: user.id,
      friendId: currentFriend.value.id,
      content: content
    })
    inputMsg.value = ''
    getMessageHistory()
    await refreshUnreadCount()
    scrollToBottom()
    ElMessage.success('发送成功')
  } catch (e) {
    ElMessage.error(e.response?.data?.msg || '发送失败')
    console.error("发送错误:", e)
  }
}

// 发送图片
const handleImageUpload = async (e) => {
  const file = e.target.files?.[0]
  if (!file) return
  if (!currentFriend.value) return ElMessage.warning('请选择好友')

  const isFriend = await checkIsFriend(currentFriend.value.id)
  if (!isFriend) {
    return ElMessage.warning('非好友不能发送图片')
  }

  try {
    const formData = new FormData()
    formData.append('file', file)
    const { data } = await request.post('/community/upload', formData)
    
    const imageUrl = data.data  
    if (!imageUrl) {
      ElMessage.error('图片上传失败')
      return
    }

    await request.post('/community/friend/message/send', {
      userId: user.id,
      friendId: currentFriend.value.id,
      content: imageUrl
    })
    
    getMessageHistory()
    await refreshUnreadCount()
    scrollToBottom()
    ElMessage.success('图片发送成功')
  } catch (err) {
    ElMessage.error('图片发送失败')
    console.error('错误：', err)
  } finally {
    e.target.value = ''
  }
}

// 插入表情
const insertEmoji = (emoji) => { 
  inputMsg.value += emoji
  showEmojiPanel.value = false 
}

//Tab/面板操作
const switchTab = (type) => {
  if(activeTab.value === type && showMsgPanel.value){
    closePanel()
    return
  }
  activeTab.value = type
  const tab = messageTabs.value.find(item => item.type === type)
  panelTitle.value = tab.name
  getRealMsgList(type)
  showMsgPanel.value = true
}

const closePanel = () => {
  if (activeTab.value) {
    markAllRead()
  }
  showMsgPanel.value = false
  activeTab.value = ''
  panelTitle.value = ''
}

// 全部已读
const markAllRead = async () => {
  if (!user?.id || !activeTab.value) return
  try {
    await request.post('/community/message/read-all', {
      userId: user.id,
      type: activeTab.value
    })
    await getRealMsgList(activeTab.value)
    await getRealUnreadCount()
  } catch (e) {
    ElMessage.error('操作失败')
  }
}

// 清空消息
const clearAllMsg = () => {
  if (!user?.id || !activeTab.value) return
  ElMessageBox.confirm('确认清空当前类型所有消息？', '提示').then(async () => {
    try {
      await request.post('/community/message/clear', {
        userId: user.id,
        type: activeTab.value
      })
      ElMessage.success('清空成功')
      currentMsgList.value = []
      getRealUnreadCount()
    } catch (e) {
      ElMessage.error('清空失败')
    }
  })
}

// 选择好友
const selectFriend = (friend) => {
  if (!friend) return;
  if (currentFriend.value?.id === friend.id) {
    currentFriend.value = null;
    currentFriendId.value = null;
    messageList.value = [];
    closePanel();
    return
  }
  currentFriend.value = friend;
  currentFriendId.value = friend.id;
  isFirstLoadHistory.value = true
  getMessageHistory();
  closePanel();
};

//初始化
onMounted(() => {
  if (user?.id) {
    getUserProfile();
    getRealFriendList();
    getRealUnreadCount();

    if (route.query.targetId) {
      const targetId = Number(route.query.targetId);
      const targetName = route.query.targetName || '未知用户';
      const targetAvatar = route.query.targetAvatar || defaultAvatar;
      
      const unwatch = watch(friendList, () => {
        let targetFriend = friendList.value.find(f => f.id === targetId);
        if (!targetFriend) {
          targetFriend = { id: targetId, username: targetName, avatar: targetAvatar, unreadCount: 0 };
          friendList.value.unshift(targetFriend);
        }
        selectFriend(targetFriend);
        unwatch();
      }, { deep: true, once: true });
    }

    // 轮询刷新
    setInterval(() => {
      if (currentFriend.value) getMessageHistory();
      refreshUnreadCount();
      getRealUnreadCount();
    }, 1500);
  }
});
</script>

<style scoped>
.message-page { max-width: 1000px; margin: 20px auto; padding: 0 15px; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.back-btn { font-size: 16px; }
.page-header h2 { margin: 0; font-size: 20px; }
.search-box { margin-bottom: 20px; }
.search-input { width: 100%; }
.msg-tabs { display: flex; gap: 10px; margin-bottom: 20px; background: #fff; padding: 15px; border-radius: 12px; box-shadow: 0 1px 8px rgba(0,0,0,0.05); }
.msg-tabs .el-button { padding: 6px 12px; border-radius: 20px; }
.msg-tabs .el-button.active { background: #e6f7ff; color: #1890ff; font-weight: 500; }
.tab-badge { 
  background: #f56c6c; 
  color: #fff; 
  font-size: 10px; 
  padding: 0 6px; 
  border-radius: 8px; 
  height: 16px; 
  line-height: 16px; 
  min-width: 16px; 
  display: inline-flex; 
  align-items: center; 
  justify-content: center;
  margin-left: 4px;
}
.chat-container { display: flex; gap: 20px; height: calc(100vh - 220px); }

.friend-sidebar { 
  width: 280px; 
  background: #fff; 
  border-radius: 12px; 
  padding: 15px; 
  box-shadow: 0 1px 8px rgba(0,0,0,0.05); 
  overflow-y: auto; 
  position: relative;
}
.friend-item { display: flex; align-items: flex-start; gap: 12px; padding: 12px; border-radius: 8px; margin-bottom: 8px; cursor: pointer; transition: all 0.2s; }
.friend-item:hover { background: #f8f9fa; }
.friend-item.active { background: #e6f7ff; }
.avatar-wrapper { position: relative; }
.friend-avatar { width: 44px; height: 44px; border-radius: 50%; object-fit: cover; }
.msg-badge {
  position: absolute;
  top: -2px;
  right: -2px;
  background: #f56c6c;
  color: #fff;
  font-size: 9px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid #fff;
  box-sizing: border-box;
}
.msg-dot { 
  position: absolute; 
  top: 0; 
  right: 0; 
  width: 10px; 
  height: 10px; 
  background: #f56c6c; 
  border-radius: 50%; 
  border: 2px solid #fff; 
}
.friend-info { flex: 1; }
.friend-name { font-weight: 500; color: #333; margin-bottom: 2px; }
.last-msg { font-size: 12px; color: #666; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.friend-time { font-size: 11px; color: #999; }
.empty-tip { text-align: center; padding: 20px; color: #999; font-size: 14px; }

.chat-main { flex: 1; display: flex; flex-direction: column; gap: 15px; }
.chat-empty { flex: 1; background: #fff; border-radius: 12px; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 40px; box-shadow: 0 1px 8px rgba(0,0,0,0.05); }
.empty-logo { width: 80px; height: 80px; margin-bottom: 20px; opacity: 0.8; }
.chat-content { flex: 1; background: #fff; border-radius: 12px; padding: 0; box-shadow: 0 1px 8px rgba(0,0,0,0.05); display: flex; flex-direction: column; overflow: hidden; }
.chat-header { padding: 15px; border-bottom: 1px solid #f5f5f5; display: flex; align-items: center; gap: 12px; }
.chat-avatar { width: 40px; height: 40px; border-radius: 50%; }
.chat-name { font-weight: 500; font-size: 16px; }
.chat-messages { flex: 1; padding: 15px; overflow-y: auto; background: #fefcf9; }
.msg-item { display: flex; margin-bottom: 15px; align-items: flex-start; gap: 10px; }
.msg-item.self { justify-content: flex-end; }
.msg-avatar { width: 40px; height: 40px; border-radius: 50%; flex-shrink: 0; }
.msg-bubble { max-width: 70%; }
.msg-text { padding: 10px 14px; border-radius: 18px; line-height: 1.5; background: #f0f9ff; color: #333; }
.msg-item.self .msg-text { background: #1890ff; color: #fff; }
.msg-image { max-width: 200px; border-radius: 8px; overflow: hidden; cursor: pointer; }
.msg-img { width: 100%; height: auto; display: block; border-radius: 8px; }
.msg-time { font-size: 10px; color: #999; margin-top: 4px; text-align: right; }
.chat-input { display: flex; align-items: flex-end; gap: 10px; padding: 10px 15px; border-top: 1px solid #eee; position: relative; }
.tool-buttons { display: flex; gap: 8px; }
.tool-icon { font-size: 20px; cursor: pointer; color: #999; transition: color 0.2s; }
.tool-icon:hover { color: #409eff; }
.msg-input { flex: 1; }
.send-btn { flex-shrink: 0; }
.emoji-panel { position: absolute; bottom: 100%; left: 0; margin-bottom: 8px; width: 300px; padding: 10px; background: #fff; border: 1px solid #eee; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); display: flex; flex-wrap: wrap; gap: 8px; z-index: 10; }
.emoji-item { width: 32px; height: 32px; line-height: 32px; text-align: center; font-size: 18px; cursor: pointer; border-radius: 4px; transition: background 0.2s; }
.emoji-item:hover { background: #f5f5f5; }
.image-preview-overlay { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.9); display: flex; align-items: center; justify-content: center; z-index: 9999; }
.preview-container { position: relative; }
.close-btn { position: absolute; top: -20px; right: -20px; width: 30px; height: 30px; background: #fff; border-radius: 50%; text-align: center; line-height: 30px; cursor: pointer; }
.preview-wrapper { cursor: grab; }
.preview-wrapper:active { cursor: grabbing; }
.preview-image { max-width: 90vw; max-height: 90vh; object-fit: contain; border-radius: 8px; transition: transform 0.1s; }

.msg-overlay-panel {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 1px 8px rgba(0,0,0,0.05);
  z-index: 99;
  display: flex;
  flex-direction: column;
}
.panel-header {
  padding: 12px 15px;
  border-bottom: 1px solid #f5f5f5;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 500;
}
.panel-list {
  flex: 1;
  padding: 15px;
  overflow-y: auto;
}
.panel-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 8px;
  cursor: pointer;
  transition: all 0.2s;
}
.panel-item:hover {
  background: #f8f9fa;
}

@media (max-width: 768px) { 
  .chat-container { flex-direction: column; height: auto; } 
  .friend-sidebar { width: 100%; height: 300px; } 
}
</style>