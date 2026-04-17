<template>
  <div class="post-page">
    <h2>发布动态</h2>
    
    <!-- AI 社区发帖文案助手 -->
    <div class="ai-assistant">
      <h4>🤖 AI 文案助手</h4>
      <div class="ai-row">
        <el-input
          v-model="aiTopic"
          placeholder="输入发帖主题（如：猫咪日常、经验分享、求助等）"
          style="flex:1"
          :disabled="loading"
        />
        <el-select v-model="tone" placeholder="选择语气" style="width:120px" :disabled="loading">
          <el-option label="亲切友好" value="friendly" />
          <el-option label="专业正式" value="professional" />
          <el-option label="幽默有趣" value="humorous" />
        </el-select>
        <el-button 
          type="success" 
          @click="generateAiContent" 
          :loading="loading"
        >
          {{ loading ? '生成中...' : '一键生成文案' }}
        </el-button>
      </div>
      <p class="ai-tip" v-if="!loading">再次点击可重新生成</p>
    </div>

    <!-- 标题输入 -->
    <el-input 
      v-model="title" 
      placeholder="请输入动态标题" 
      style="margin-bottom:15px" 
    />
    
    <!-- 内容输入 -->
    <el-input 
      type="textarea" 
      v-model="content" 
      placeholder="分享你的养宠日常~" 
      :rows="6"
      style="margin-bottom:15px"
    />

    <!-- 话题输入框 -->
    <div class="topic-wrapper">
      <el-input
        v-model="topic"
        placeholder="输入话题（回车添加/直接发布自动添加，最多3个）"
        @keyup.enter.native="handleAddTopic"
        clearable
      />
      <div class="topic-list" v-if="topicList.length">
        <span 
          class="topic-item" 
          v-for="(item, index) in topicList" 
          :key="index"
          @click="removeTopic(index)"
        >
          {{ item }} ✕
        </span>
      </div>
    </div>

    <!-- 图片上传 -->
    <div style="margin-top:20px">
      <el-upload
        action="/api/community/upload"
        list-type="picture-card"
        :limit="9"
        multiple
        accept="image/*"
        :on-success="handleUploadSuccess"
        :on-remove="handleRemove"
        :file-list="fileList"
      >
        <span v-if="fileList.length < 9">+</span>
      </el-upload>
    </div>

    <el-button type="primary" @click="submit" style="margin-top:20px">发布动态</el-button>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import axios from 'axios'

// 核心数据
const router = useRouter()
const request = axios.create({ baseURL: '/api' })
const title = ref('')
const content = ref('')
const user = JSON.parse(localStorage.getItem('userInfo') || '{}')

// 图片配置
const fileList = ref([])
const imgList = ref([])

// 话题相关：最多3个
const topic = ref('')
const topicList = ref([])

// ============== AI文案助手核心逻辑 ==============
const aiTopic = ref('') // AI生成主题
const tone = ref('friendly') // 默认语气
const loading = ref(false) // 加载状态

// 🔧 解析AI返回内容，提取标题/内容/话题（兼容格式错误）
const parseAiResponse = (aiText) => {
  const result = { title: '', content: '', topics: [] }
  if (!aiText) return result

  // 1. 提取标题（匹配【标题】：xxx）
  const titleMatch = aiText.match(/【标题】[:：]\s*([\s\S]*?)(?=【内容】|$)/)
  result.title = titleMatch ? titleMatch[1].trim() : aiTopic.value.trim()

  // 2. 提取内容（匹配【内容】：xxx）
  const contentMatch = aiText.match(/【内容】[:：]\s*([\s\S]*?)(?=【话题】|$)/)
  result.content = contentMatch ? contentMatch[1].trim() : aiText.trim()

  // 3. 提取话题（匹配【话题】：#xxx #xxx，去重限3个）
  const topicMatch = aiText.match(/【话题】[:：]\s*([\s\S]*)/)
  if (topicMatch) {
    result.topics = [...new Set(
      topicMatch[1].trim()
        .replace(/#/g, '')
        .split(/\s+/)
        .map(t => t.trim())
        .filter(Boolean)
    )].slice(0, 3)
  }

  return result
}

// 🚀 AI生成文案（支持重新生成，自动回填所有字段）
const generateAiContent = async () => {
  if (!aiTopic.value.trim()) {
    ElMessage.warning('请输入发帖主题！')
    return
  }
  loading.value = true
  try {
    const { data } = await request.post('/ai/post_writing_assistant', {
      topic: aiTopic.value,
      content_type: 'community',
      tone: tone.value
    })
    if (data.code === 200) {
      // 解析AI返回的结构化内容
      const { title: aiTitle, content: aiContent, topics: aiTopics } = parseAiResponse(data.data)
      
      // 1. 回填标题、内容
      title.value = aiTitle
      content.value = aiContent
      
      // 2. 回填话题：自动添加到话题列表，去重限3个
      if (aiTopics.length > 0) {
        topicList.value = [...new Set([...topicList.value, ...aiTopics])].slice(0, 3)
        
      }
      
      
    } else {
      ElMessage.error(data.data || '文案生成失败')
    }
  } catch (error) {
    console.error('AI助手异常：', error)
    ElMessage.error('AI服务异常，请稍后再试')
  } finally {
    loading.value = false
  }
}
// ==================================================

// 🔧 工具函数：统一处理话题（去重、限3个、过滤空值）
const processTopics = (rawTopics) => {
  return [...new Set(
    rawTopics
      .replace(/#/g, '')
      .split(/[,，\s+]/)
      .map(t => t.trim())
      .filter(Boolean)
  )].slice(0, 3)
}

// 回车添加话题
const handleAddTopic = () => {
  if (!topic.value.trim()) return
  const newTopics = processTopics(topic.value)
  const mergedTopics = [...new Set([...topicList.value, ...newTopics])].slice(0, 3)
  
  if (mergedTopics.length > topicList.value.length) {
    topicList.value = mergedTopics
    ElMessage.success(`已添加${newTopics.length}个话题`)
  } else {
    ElMessage.warning('话题已存在/最多3个')
  }
  topic.value = ''
}

// 删除话题
const removeTopic = (index) => {
  topicList.value.splice(index, 1)
}

// 图片上传
function handleUploadSuccess(res, file) {
  if (res.code === 200) {
    file.url = res.data
    imgList.value.push(res.data)
    ElMessage.success('图片上传成功')
  }
}
function handleRemove(file) {
  const index = imgList.value.findIndex(i => i === file.url)
  if (index !== -1) imgList.value.splice(index, 1)
}

// 发布动态
async function submit() {
  if (!title.value.trim()) return ElMessage.warning('请填写标题！')
  if (!content.value.trim()) return ElMessage.warning('请填写内容！')
  if (!user.id) return ElMessage.warning('请先登录！')

  // 自动处理输入框未回车的话题
  if (topic.value.trim()) {
    topicList.value = [...new Set([...topicList.value, ...processTopics(topic.value)])].slice(0, 3)
    topic.value = ''
  }

  // 拼接最终内容：[标题]正文[话题1,话题2,话题3]
  const topicStr = topicList.value.length ? `[${topicList.value.join(',')}]` : ''
  const fullContent = `[${title.value.trim()}]${content.value.trim()}${topicStr}`
  const imgUrl = imgList.value.join(',')

  try {
    await request.post('/community/post/add', {
      userId: user.id,
      username: user.username,
      content: fullContent,
      imgUrl: imgUrl
    })
    
    
    router.push('/community')
    // 重置所有表单
    title.value = content.value = topic.value = aiTopic.value = ''
    topicList.value = fileList.value = imgList.value = []
  } catch (error) {
    console.error('发布失败', error)
    ElMessage.error('发布失败')
  }
}
</script>

<style scoped>
.post-page {
  max-width: 800px;
  margin: 50px auto;
  padding: 0 20px;
}

/* AI助手样式 */
.ai-assistant {
  background: #f9fbfd;
  border: 1px solid #e5e6eb;
  border-radius: 12px;
  padding: 15px;
  margin-bottom: 20px;
}
.ai-assistant h4 {
  margin: 0 0 12px 0;
  color: #333;
  font-size: 16px;
}
.ai-row {
  display: flex;
  gap: 10px;
  align-items: center;
}
.ai-tip {
  margin: 8px 0 0 0;
  font-size: 12px;
  color: #999;
}

.topic-wrapper { margin-bottom: 10px; }
.topic-list {
  margin-top: 10px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.topic-item {
  padding: 4px 10px;
  background: #e6f7ff;
  color: #1890ff;
  border-radius: 15px;
  font-size: 12px;
  cursor: pointer;
  border: 1px solid #91d5ff;
}
.topic-item:hover { background: #d1e9ff; }
</style>

<style>
.el-input__wrapper { border-radius: 8px !important; }
.el-button { border-radius: 8px !important; }
</style>