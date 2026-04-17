<template>
  <div class="edit-page">
    <h2>编辑动态</h2>
    
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

    <!-- 话题功能 -->
    <div class="topic-wrapper">
      <el-input
        v-model="topicInput"
        placeholder="输入话题（回车添加/直接保存自动添加，最多3个）"
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

    <!-- 多图上传 -->
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

    <el-button type="primary" @click="submit" style="margin-top:20px">保存修改</el-button>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import axios from 'axios'

const router = useRouter()
const route = useRoute()
const request = axios.create({ baseURL: '/api' })

// 核心数据
const title = ref('')
const content = ref('')
const topicInput = ref('')
const topicList = ref([])

// 多图数据
const fileList = ref([])
const imgList = ref([])

// 🔧 工具函数：统一处理话题
const processTopics = (rawTopics) => {
  const topics = rawTopics
    .replace(/#/g, '')
    .split(/[,，\s+]/)
    .map(t => t.trim())
    .filter(Boolean)
  return [...new Set(topics)].slice(0, 3)
}

// 🔧 解析原有content：提取[标题]、正文、[话题]
const parseOriginalContent = (text) => {
  if (!text) return { title: '', content: '', topics: [] }
  
  // 严格匹配格式：^[标题]正文[话题1,话题2,话题3]$
  const regex = /^\[(.*?)\]([\s\S]*?)(?:\[([^\]]*)\])?$/
  const match = text.match(regex)
  
  let postTitle = ''
  let postContent = ''
  let postTopics = []

  if (match) {
    postTitle = match[1]?.trim() || ''
    postContent = match[2]?.trim() || ''
    const topicStr = match[3] || ''
    postTopics = topicStr ? processTopics(topicStr) : []
  } else {
    // 兼容旧数据
    const oldMatch = text.match(/^\[(.*?)\]([\s\S]*)$/)
    if (oldMatch) {
      postTitle = oldMatch[1]?.trim() || ''
      postContent = oldMatch[2]?.trim() || ''
    }
  }

  return {
    title: postTitle,
    content: postContent,
    topics: postTopics.slice(0, 3)
  }
}

// 回车添加话题
const handleAddTopic = () => {
  if (!topicInput.value.trim()) return
  const newTopics = processTopics(topicInput.value)
  if (newTopics.length === 0) return

  const mergedTopics = [...new Set([...topicList.value, ...newTopics])].slice(0, 3)
  if (mergedTopics.length > topicList.value.length) {
    topicList.value = mergedTopics
    ElMessage.success(`已添加${newTopics.length}个话题`)
  } else {
    ElMessage.warning('话题已存在/最多3个')
  }
  topicInput.value = ''
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

// 获取原动态
const getDetail = async () => {
  try {
    const { data } = await request.get('/community/post/detail', {
      params: { id: route.params.id }
    })
    const original = data.data
    const parsed = parseOriginalContent(original.content)
    title.value = parsed.title
    content.value = parsed.content
    topicList.value = parsed.topics

    // 🔍 调试：打印解析到的话题
    console.log('解析到的原有话题：', parsed.topics)

    if (original.imgUrl) {
      imgList.value = original.imgUrl.split(',').filter(Boolean)
      fileList.value = imgList.value.map(url => ({ url }))
    }
  } catch (error) {
    ElMessage.error('获取动态失败')
    console.error(error)
  }
}

// 🔧 提交修改：100%确保话题存入content
const submit = async () => {
  if (!title.value.trim()) return ElMessage.warning('请填写标题！')
  if (!content.value.trim()) return ElMessage.warning('请填写内容！')

  // ✅ 自动处理输入框未回车的话题
  if (topicInput.value.trim()) {
    const newTopics = processTopics(topicInput.value)
    if (newTopics.length > 0) {
      topicList.value = [...new Set([...topicList.value, ...newTopics])].slice(0, 3)
      topicInput.value = ''
    }
  }

  // ✅ 严格按照格式拼接
  const topicStr = topicList.value.length ? `[${topicList.value.join(',')}]` : ''
  const fullContent = `[${title.value.trim()}]${content.value.trim()}${topicStr}`

  // 🔍 调试：打印最终存入的content
  console.log('最终存入数据库的content：', fullContent)

  const imgUrl = imgList.value.join(',')

  try {
    await request.post('/community/post/update', {
      id: route.params.id,
      content: fullContent,
      imgUrl: imgUrl
    })
    ElMessage.success('修改成功！')
    router.push('/community/profile')
  } catch (error) {
    ElMessage.error('修改失败')
    console.error(error)
  }
}

onMounted(() => {
  getDetail()
})
</script>

<style scoped>
.edit-page {
  max-width: 800px;
  margin: 50px auto;
  padding: 0 20px;
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