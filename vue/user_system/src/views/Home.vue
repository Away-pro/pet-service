<template>
  <div class="home">
    <!-- 轮播图 -->
    <el-carousel height="420px" indicator-position="outside" autoplay interval="5000">
      <el-carousel-item>
        <div class="banner pet-banner1">
          <div class="banner-content">
            <h1>专业宠物寄养，安心托付每一天</h1>
            <p>24小时专人看护，实时视频，让爱宠享受星级服务</p>
            <el-button type="primary" size="large" @click="router.push('/foster')">立即预约</el-button>
          </div>
        </div>
      </el-carousel-item>
      <el-carousel-item>
        <div class="banner pet-banner2">
          <div class="banner-content">
            <h1>精选宠物用品，为爱宠保驾护航</h1>
            <p>天然粮、玩具、护理品，一站式购齐</p>
            <el-button type="primary" size="large" @click="router.push('/goods')">去逛逛</el-button>
          </div>
        </div>
      </el-carousel-item>
      <el-carousel-item>
        <div class="banner pet-banner3">
          <div class="banner-content">
            <h1>宠物档案，记录成长每一刻</h1>
            <p>疫苗、健康、喂养，全生命周期管理</p>
            <el-button type="primary" size="large" @click="router.push('/pet-add')">创建档案</el-button>
          </div>
        </div>
      </el-carousel-item>
      <el-carousel-item>
        <div class="banner pet-banner4">
          <div class="banner-content">
            <h1>宠伴社区，分享有爱日常</h1>
            <p>晒宠、交流、交友，打造专属宠物圈子</p>
            <el-button type="primary" size="large" @click="router.push('/community')">进入社区</el-button>
          </div>
        </div>
      </el-carousel-item>
    </el-carousel>

    <!-- 公告跑马灯 -->
    <div class="premium-notice" v-if="noticeList.length">
      <div class="mask left"></div>
      <div class="mask right"></div>
      <div class="scroll-container" @mouseenter="pauseScroll" @mouseleave="startScroll">
        <div class="scroll-content" :class="{ paused: isPaused }">
          <div class="notice-item" v-for="(msg,idx) in noticeList" :key="idx">
            <img class="pet-avatar" v-if="msg.showAvatar" :src="msg.avatar" alt="宠物头像" />
            <span class="icon">{{ msg.icon }}</span>
            <div class="text-wrap">
              <div class="main-text">{{ msg.text }}</div>
              <div class="time-text">{{ msg.time }}</div>
            </div>
          </div>
          <div class="notice-item" v-for="(msg,idx) in noticeList" :key="'copy'+idx">
            <img class="pet-avatar" v-if="msg.showAvatar" :src="msg.avatar" alt="宠物头像" />
            <span class="icon">{{ msg.icon }}</span>
            <div class="text-wrap">
              <div class="main-text">{{ msg.text }}</div>
              <div class="time-text">{{ msg.time }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 分类标题 -->
    <div class="pick-title">
      <h2>🐾 你想为谁购物？</h2>
      <p>精准分类 · 为爱宠挑选专属好物</p>
    </div>

    <!-- 宠物分类导航 -->
    <div class="category-nav">
      <div 
        class="category-item" 
        v-for="cat in categories" 
        :key="cat.id"
        @click="toGoodsByPet(cat.type)"
      >
        <div class="cat-icon circular-icon">
          <img :src="cat.icon" :alt="cat.name">
        </div>
        <div class="cat-name">{{ cat.name }}</div>
      </div>
    </div>

    <!-- 狗狗用品 -->
    <div class="section">
      <div class="section-title">🐶 狗狗用品</div>
      <div class="hot-goods" v-if="dogGoods.length > 0">
        <el-card 
          v-for="(item, index) in dogGoods" 
          :key="item.id || index"
          shadow="hover"
          class="hot-card"
          @click.stop="router.push({ path: `/goods/${item.id}`, query: { item: encodeURIComponent(JSON.stringify(item)) } })"
        >
          <img 
            :src="getFirstImage(item, index)" 
            :alt="item.name" class="hot-image"
            loading="lazy"
          >
          <div class="hot-name">{{ item.name }}</div>
          <div class="hot-price">¥{{ item.price ? item.price.toFixed(2) : '0.00' }}</div>
        </el-card>
      </div>
      <div class="empty-tip" v-else>暂无狗狗相关商品</div>
    </div>

    <!-- 猫咪用品 -->
    <div class="section">
      <div class="section-title">🐱 猫咪用品</div>
      <div class="hot-goods" v-if="catGoods.length > 0">
        <el-card 
          v-for="(item, index) in catGoods" 
          :key="item.id || index"
          shadow="hover"
          class="hot-card"
          @click.stop="router.push({ path: `/goods/${item.id}`, query: { item: encodeURIComponent(JSON.stringify(item)) } })"
        >
          <img 
            :src="getFirstImage(item, index)" 
            :alt="item.name" class="hot-image"
            loading="lazy"
          >
          <div class="hot-name">{{ item.name }}</div>
          <div class="hot-price">¥{{ item.price ? item.price.toFixed(2) : '0.00' }}</div>
        </el-card>
      </div>
      <div class="empty-tip" v-else>暂无猫咪相关商品</div>
    </div>

    <!-- 小宠用品 -->
    <div class="section">
      <div class="section-title">🐹 小宠用品</div>
      <div class="hot-goods" v-if="smallPetGoods.length > 0">
        <el-card 
          v-for="(item, index) in smallPetGoods" 
          :key="item.id || index"
          shadow="hover"
          class="hot-card"
          @click.stop="router.push({ path: `/goods/${item.id}`, query: { item: encodeURIComponent(JSON.stringify(item)) } })"
        >
          <img 
            :src="getFirstImage(item, index)" 
            :alt="item.name" class="hot-image"
            loading="lazy"
          >
          <div class="hot-name">{{ item.name }}</div>
          <div class="hot-price">¥{{ item.price ? item.price.toFixed(2) : '0.00' }}</div>
        </el-card>
      </div>
      <div class="empty-tip" v-else>暂无小宠相关商品</div>
    </div>

    <!-- 鸟儿用品 -->
    <div class="section">
      <div class="section-title">🐦 鸟儿用品</div>
      <div class="hot-goods" v-if="birdGoods.length > 0">
        <el-card 
          v-for="(item, index) in birdGoods" 
          :key="item.id || index"
          shadow="hover"
          class="hot-card"
          @click.stop="router.push({ path: `/goods/${item.id}`, query: { item: encodeURIComponent(JSON.stringify(item)) } })"
        >
          <img 
            :src="getFirstImage(item, index)" 
            :alt="item.name" class="hot-image"
            loading="lazy"
          >
          <div class="hot-name">{{ item.name }}</div>
          <div class="hot-price">¥{{ item.price ? item.price.toFixed(2) : '0.00' }}</div>
        </el-card>
      </div>
      <div class="empty-tip" v-else>暂无鸟儿相关商品</div>
    </div>

    <!-- 服务中心 -->
    <div class="section">
      <div class="section-title">🐾 核心服务</div>
      <div class="module-list">
        <div class="module-item" @click="router.push('/foster')">
          <div class="icon">🏠</div>
          <div class="text">宠物寄养</div>
        </div>
        <div class="module-item" @click="router.push('/goods')">
          <div class="icon">🛒</div>
          <div class="text">用品商城</div>
        </div>
        <div class="module-item" @click="router.push('/pet-add')">
          <div class="icon">🐾</div>
          <div class="text">宠物档案</div>
        </div>
        <div class="module-item" @click="router.push('/user')">
          <div class="icon">👤</div>
          <div class="text">个人中心</div>
        </div>
      </div>
    </div>

    <!-- 宠伴社区 -->
    <div class="community-section">
      <div class="community-header">
        <h2>🐾 宠伴社区</h2>
        <p>分享养宠日常 · 交流养护经验 · 结识宠友伙伴</p>
      </div>
      <div class="community-layout">
        <div class="feed-box">
          <div class="feed-item" v-for="item in communityFeeds" :key="item.id">
            <img :src="item.cover" class="feed-img" loading="lazy" />
            <div class="feed-info">
              <h4>{{ item.title }}</h4>
              <span>{{ item.author }} · ❤️ {{ item.likes }}</span>
            </div>
          </div>
        </div>
        <div class="side-box">
          <div class="topic-box">
            <h3>🔥 热门话题</h3>
            <el-tag v-for="tag in hotTags" :key="tag" type="info" class="tag">{{ tag }}</el-tag>
          </div>
          <div class="activity-box">
            <h3>🎁 社区活动</h3>
            <div class="activity-item">萌宠摄影大赛 · 报名中</div>
            <div class="activity-item">养宠知识问答 · 赢好礼</div>
          </div>
        </div>
      </div>
      <div class="community-btn">
        <el-button type="primary" size="large" @click="router.push('/community')">进入社区</el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'
import { useRouter } from 'vue-router'

const router = useRouter()
const request = axios.create({ baseURL: '/api', timeout: 5000 })

// 分类导航
const categories = ref([
  { id:1, name:'狗狗', icon:'/images/icon_dog.jpg', type:'狗狗' },
  { id:2, name:'猫咪', icon:'/images/icon_cat.jpg', type:'猫咪' },
  { id:3, name:'小宠', icon:'/images/icon_small.jpg', type:'小宠' },
  { id:4, name:'鸟类', icon:'/images/icon_bird.jpg', type:'鸟' },
  { id:5, name:'通用', icon:'/images/icon_all.jpg', type:'通用' },
])

// 商品数据
const dogGoods = ref([])
const catGoods = ref([])
const smallPetGoods = ref([])
const birdGoods = ref([])

// 跑马灯
const noticeList = ref([])
const isPaused = ref(false)
const pauseScroll = () => isPaused.value = true
const startScroll = () => isPaused.value = false

// 社区真实数据
const communityFeeds = ref([])
const hotTags = ref([])

// 时间格式化
const formatTime = (t) => {
  if(!t) return new Date().toLocaleString('zh-CN',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})
  const d = new Date(t)
  return `${d.getMonth()+1}月${d.getDate()}日 ${d.getHours()}:${String(d.getMinutes()).padStart(2,'0')}`
}

// 解析宠物信息
const parsePetInfo = (petName) => {
  const reg = /^(.+?)\[(.*?)\]/
  const m = petName.match(reg)
  return m ? { name:m[1], avatar:m[2] } : { name:petName, avatar:'' }
}

// 复用全局统一：解析帖子【标题+正文+话题】
const parsePostContent = (content) => {
  if (!content) return { title: '', topics: [] }
  const regex = /^\[(.*?)\]([\s\S]*?)(?:\[([^\]]*)\])?$/
  const match = content.match(regex)

  if (match) {
    const title = match[1]?.trim() || ''
    const topicStr = match[3] || ''
    const topics = topicStr ? topicStr.split(',').map(t => t.trim()).filter(Boolean) : []
    return { title, topics }
  }
  const oldMatch = content.match(/^\[(.*?)\]/)
  return { title: oldMatch ? oldMatch[1].trim() : '', topics: [] }
}

// 获取帖子封面（第一张图）
const getPostCover = (imgUrl) => {
  if (!imgUrl) return 'https://picsum.photos/seed/community/300/200'
  const arr = imgUrl.split(',').filter(url => url.trim())
  return arr[0] || 'https://picsum.photos/seed/community/300/200'
}

// 合并数组
const mixArr = (a,b)=>{let r=[];let m=Math.max(a.length,b.length);for(let i=0;i<m;i++){if(a[i])r.push(a[i]);if(b[i])r.push(b[i])}return r}

// 获取寄养/宠物数据
const getFoster = async ()=>{
  try{
    const {data}=await request.get('/foster/list')
    return (data.data||[]).slice(0,5)
  }catch{return[]}
}
const getPet = async ()=>{
  try{
    const {data}=await request.get('/pet/list')
    return (data.data||[]).slice(0,5)
  }catch{return[]}
}

// 组装跑马灯消息
const buildNotice = async ()=>{
  const foster = await getFoster()
  const pet = await getPet()

  const fosterMsg = foster.map(item=>({
    showAvatar: false,
    avatar:'',
    icon:'🏠',
    text:`${item.userName||'用户'} 寄养「${item.petName||'萌宠'}」`,
    time:formatTime(item.createTime)
  }))

  const petMsg = pet.map(item=>{
    const {name,avatar}=parsePetInfo(item.petName)
    return {
      showAvatar: true,
      avatar:avatar || '/images/default_pet.png',
      icon:'🐾',
      text:`${item.userName||'用户'} 新增宠物「${name}」`,
      time:formatTime(item.createTime)
    }
  })

  noticeList.value = mixArr(fosterMsg,petMsg).slice(0,10)
}

// 获取分类商品
const getGoods = async (type)=>{
  try{
    const {data}=await request.get('/product/list',{params:{apply_pet:type}})
    return (data.data||[]).slice(0,4)
  }catch{return[]}
}
const toGoodsByPet = (t)=>t?router.push(`/goods?apply_pet=${t}`):router.push('/goods')

// 获取商品首图
const getFirstImage = (item, index) => {
  if (!item.detailImages) {
    return `https://picsum.photos/seed/pet${item.id || index}/300/200`
  }
  const imageList = item.detailImages.split(',').filter(url => url.trim())
  return imageList[0] || `https://picsum.photos/seed/pet${item.id || index}/300/200`
}

// ========== 核心：加载社区热度真实数据 ==========
const getCommunityHotData = async () => {
  try {
    const { data } = await request.get('/community/post/list')
    const allPost = data.data || []

    // 1. 组装完整帖子数据 + 提取话题
    const postWithTopic = allPost.map(post => {
      const { title, topics } = parsePostContent(post.content)
      return {
        id: post.id,
        title: title || '无标题日常',
        author: post.username || '匿名宠友',
        likes: post.likes || 0,
        cover: getPostCover(post.imgUrl),
        topics: topics
      }
    })

    // 2. 按点赞降序，取前2篇最热文章
    const sortByLike = [...postWithTopic].sort((a,b) => b.likes - a.likes)
    communityFeeds.value = sortByLike.slice(0, 2)

    // 3. 统计所有话题热度、去重、取前4
    const topicCount = {}
    postWithTopic.forEach(item => {
      item.topics.forEach(t => {
        if(t) topicCount[t] = (topicCount[t] || 0) + 1
      })
    })
    // 话题排序 + 去重兜底
    const sortTopic = Object.entries(topicCount)
      .sort((a,b) => b[1] - a[1])
      .map(item => item[0])
    hotTags.value = sortTopic.slice(0, 4)

    // 兜底：没话题就给默认
    if(hotTags.value.length === 0){
      hotTags.value = ['猫咪喂养','狗狗健康','新手养宠','宠物日常']
    }

  } catch (err) {
    console.error('加载社区热度数据失败', err)
    // 失败兜底假数据
    communityFeeds.value = [
      {id:1,title:'猫咪掉毛护理攻略',author:'喵酱',likes:236,cover:'https://picsum.photos/seed/cat1/300/200'},
      {id:2,title:'狗狗训练小技巧',author:'狗哥',likes:189,cover:'https://picsum.photos/seed/dog1/300/200'},
    ]
    hotTags.value = ['猫咪喂养','狗狗健康','新手养宠','宠物美容']
  }
}

onMounted(async ()=>{
  dogGoods.value=await getGoods('狗狗')
  catGoods.value=await getGoods('猫咪')
  smallPetGoods.value=await getGoods('小宠')
  birdGoods.value=await getGoods('鸟')
  await buildNotice()
  await getCommunityHotData()
})
</script>

<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
  letter-spacing: 0.3px;
  scroll-behavior: smooth;
}

.home {
  width: 100%;
  background: #f9fbfe;
  min-height: calc(100vh - 80px);
  padding-bottom: 40px;
}
.el-carousel__item {
  border-radius: 20px;
  overflow: hidden;
}
.banner {
  width: 100%;
  height: 420px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  background-size: cover !important;
  background-position: center;
  background-repeat: no-repeat;
  position: relative;
  cursor: default;
}
.pet-banner1{background-image:linear-gradient(rgba(0,0,0,0.25),rgba(0,0,0,0.45)),url('/lunbotu/foster.png');}
.pet-banner2{background-image:linear-gradient(rgba(0,0,0,0.25),rgba(0,0,0,0.45)),url('/lunbotu/mall.jpg');}
.pet-banner3{background-image:linear-gradient(rgba(0,0,0,0.25),rgba(0,0,0,0.45)),url('/lunbotu/pet.jpg');}
.pet-banner4{background-image:linear-gradient(rgba(0,0,0,0.25),rgba(0,0,0,0.45)),url('/lunbotu/community.jpg');}

.banner-content {
  text-align: center;
  max-width: 720px;
  padding: 0 24px;
}
.banner-content h1 {
  font-size: 42px;
  margin-bottom: 18px;
  font-weight: 700;
  text-shadow: 0 2px 10px rgba(0,0,0,0.35);
}
.banner-content p {
  font-size: 19px;
  margin-bottom: 36px;
  opacity: 0.96;
  text-shadow: 0 1px 6px rgba(0,0,0,0.25);
}

/* 品牌按钮样式 */
:deep(.el-button--primary) {
  background-color: #5A98E8 !important;
  border-color: #5A98E8 !important;
  border-radius: 28px !important;
  padding: 12px 36px !important;
  font-weight: 500 !important;
  transition: all 0.25s ease !important;
  cursor: pointer !important;
}
:deep(.el-button--primary):hover {
  background-color: #4787d9 !important;
  border-color: #4787d9 !important;
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(90, 152, 232, 0.25);
}

/* 跑马灯 */
.premium-notice {
  max-width: 1200px;
  margin: 28px auto;
  height: 58px;
  background: linear-gradient(90deg, #f0f7ff 0%, #e8f2ff 100%);
  border-radius: 30px;
  box-shadow: 0 4px 20px rgba(90, 152, 232, 0.12);
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(90, 152, 232, 0.18);
}
.mask {
  position: absolute;
  top: 0;
  width: 180px;
  height: 100%;
  z-index: 2;
  pointer-events: none;
}
.mask.left {left: 0;background: linear-gradient(90deg,#e8f2ff 25%,transparent 100%);}
.mask.right {right: 0;background: linear-gradient(-90deg,#e8f2ff 25%,transparent 100%);}

.scroll-container {width: 100%;height: 100%;overflow: hidden;}
.scroll-content {display: flex;white-space: nowrap;animation: scrollMove 22s linear infinite;}
.scroll-content.paused {animation-play-state: paused;}

.notice-item {
  display: inline-flex;
  align-items: center;
  gap: 14px;
  height: 58px;
  padding: 0 55px;
}
.pet-avatar {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #fff;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}
.main-text {font-size: 14px;font-weight: 500;color: #1e40af;}
.time-text {font-size: 12px;color: #64748b;}

@keyframes scrollMove {
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}

/* 分类标题 */
.pick-title {
  text-align: center;
  margin: 50px 0 24px;
}
.pick-title h2 {
  font-size: 30px;
  color: #1f2937;
  margin-bottom: 10px;
  font-weight: 600;
}
.pick-title p {
  font-size: 16px;
  color: #64748b;
}

/* 宠物分类导航 - 交互优化 */
.category-nav {
  max-width: 1200px;
  margin: 0 auto 40px;
  display: flex;
  justify-content: center;
  gap: 28px;
  background: #fff;
  padding: 36px;
  border-radius: 24px;
  box-shadow: 0 6px 20px rgba(0,0,0,0.06);
}
.category-item {
  text-align: center;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  width: 165px;
  user-select: none;
}
.category-item:active {
  transform: translateY(-5px);
}
.category-item:hover {transform: translateY(-10px);}
.circular-icon {
  width: 165px;
  height: 165px;
  border-radius: 50%;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f9fbfe;
  margin: 0 auto 14px;
  border: 3px solid #fff;
  box-shadow: 0 4px 14px rgba(90, 152, 232, 0.1);
  transition: all 0.3s ease;
}
.category-item:hover .circular-icon {
  box-shadow: 0 10px 24px rgba(90, 152, 232, 0.18);
}
.circular-icon img {width: 100%;height: 100%;object-fit: cover;}
.cat-name {font-size: 17px;font-weight: 500;color: #334155;}

/* 商品模块 - 交互+价格优化 */
.section {
  max-width: 1200px;
  margin: 40px auto;
  padding: 0 20px;
}
.section-title {
  font-size: 26px;
  font-weight: 600;
  margin-bottom: 28px;
  text-align: center;
  color: #1f2937;
}
.hot-goods {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px;
}
.hot-card {
  border-radius: 18px;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  text-align: center;
  cursor: pointer;
  border: none;
  user-select: none;
  background: #ecebebc4 !important;
}
/* 点击按压反馈 */
.hot-card:active {
  transform: translateY(-4px);
}
.hot-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 14px 28px rgba(0,0,0,0.09);
}
.hot-image {
  width: 100%;
  height: 190px;
  object-fit: cover;
  transition: all 0.35s ease;
}
.hot-card:hover .hot-image {transform: scale(1.06);}
.hot-name {
  font-size: 15px;
  margin: 14px 0 10px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #334155;
  padding: 0 4px;
}
.hot-price {
  font-size: 19px;
  font-weight: bold;
  color: #FF4D4F;
  padding-bottom: 10px;
}
.empty-tip {
  text-align: center;
  padding: 60px 0;
  color: #94a3b8;
  font-size: 16px;
}

/* 服务中心 - 交互升级 */
.module-list {
  display: flex;
  justify-content: center;
  gap: 28px;
  flex-wrap: wrap;
}
.module-item {
  width: 185px;
  height: 185px;
  background: #fff;
  border-radius: 22px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 16px rgba(0,0,0,0.06);
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  user-select: none;
}
.module-item:active {
  transform: scale(0.98);
}
.module-item:hover {
  transform: translateY(-8px);
  background: #f0f7ff;
  box-shadow: 0 10px 24px rgba(90, 152, 232, 0.15);
}
.icon {font-size: 50px;margin-bottom: 18px;}
.text {font-size: 17px;font-weight: 500;color: #334155;}

/* 社区模块 - 交互优化 */
.community-section {
  max-width: 1200px;
  margin: 70px auto 0;
  padding: 0 20px;
}
.community-header {
  text-align: center;
  margin-bottom: 36px;
}
.community-header h2 {
  font-size: 30px;
  color: #1f2937;
  margin-bottom: 12px;
  font-weight: 600;
}
.community-header p {
  font-size: 17px;
  color: #64748b;
}
.community-layout {
  display: flex;
  gap: 28px;
  margin-bottom: 36px;
}
.feed-box {
  flex: 2;
  display: flex;
  flex-direction: column;
  gap: 18px;
}
.feed-item {
  display: flex;
  gap: 18px;
  background: #fff;
  padding: 18px;
  border-radius: 18px;
  align-items: center;
  box-shadow: 0 2px 14px rgba(0,0,0,0.04);
  transition: all 0.3s ease;
  cursor: pointer;
  user-select: none;
}
.feed-item:active {
  transform: translateX(2px);
}
.feed-item:hover {
  transform: translateX(6px);
  box-shadow: 0 6px 20px rgba(90, 152, 232, 0.12);
}
.feed-img {
  width: 135px;
  height: 95px;
  border-radius: 14px;
  object-fit: cover;
}
.feed-info h4 {
  font-size: 17px;
  margin-bottom: 8px;
  font-weight: 500;
  color: #1f2937;
}
.side-box {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 22px;
}
.topic-box, .activity-box {
  background: #fff;
  padding: 26px;
  border-radius: 18px;
  box-shadow: 0 2px 14px rgba(0,0,0,0.04);
}
.topic-box h3, .activity-box h3 {
  font-size: 19px;
  margin-bottom: 18px;
  font-weight: 600;
  color: #1f2937;
}
.tag {margin: 6px;border-radius: 10px;cursor: pointer;}
.activity-item {
  padding: 14px;
  background: #f9fbfe;
  border-radius: 10px;
  margin-bottom: 10px;
  color: #334155;
  transition: all 0.25s ease;
  cursor: pointer;
}
.activity-item:hover {
  background: #f0f7ff;
  color: #1e40af;
}
.community-btn {text-align: center;}

/* 响应式适配 */
@media (max-width: 1200px) {
  .hot-goods { grid-template-columns: repeat(3, 1fr); }
  .category-nav { gap: 20px; padding: 28px; }
  .circular-icon { width: 145px; height: 145px; }
  .category-item { width: 145px; }
}
@media (max-width: 768px) {
  .banner { height: 320px; }
  .banner-content h1 { font-size: 28px; }
  .hot-goods { grid-template-columns: repeat(2, 1fr); }
  .category-nav {
    overflow-x: auto;
    padding: 20px 16px;
    justify-content: flex-start;
  }
  .community-layout { flex-direction: column; gap: 22px; }
  .premium-notice { margin: 16px 12px; height: 52px; }
  .notice-item { padding: 0 24px; }
}
@media (max-width: 480px) {
  .banner { height: 260px; }
  .banner-content h1 { font-size: 24px; }
  .hot-goods { grid-template-columns: 1fr; }
  .section-title { font-size: 22px; }
}
</style>