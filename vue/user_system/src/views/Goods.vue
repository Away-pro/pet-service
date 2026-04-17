<template>
  <div class="pet-mall-container">
    <div class="mall-header">
      <h2>🐾 宠物用品商城</h2>
      <p>智能推荐，为爱宠保驾护航</p>
    </div>
    <div class="ai-search-bar">
      <div class="ai-search-group">
        <el-input
          v-model="aiDemand"
          placeholder="🤖 告诉我你的需求，例如：猫咪50元内猫粮、狗狗耐磨玩具"
          clearable
          class="ai-search-input"
          @keyup.enter="aiRecommendGoods"
        />
        <el-button type="success" :loading="aiLoading" @click="aiRecommendGoods">
          AI推荐商品
        </el-button>
      </div>
    </div>

    <!-- 🔥 AI推荐结果 -->
    <div v-if="aiRecommendList.length > 0" class="ai-recommend-container">
      <div class="ai-title">
        <span>🤖 宠伴AI为您精选推荐</span>
        <el-button text type="primary" size="small" @click="clearAIRecommend">
          清空推荐
        </el-button>
      </div>
      <div class="goods-grid">
        <el-card 
          v-for="(item, index) in aiRecommendList" 
          :key="item.id || index" 
          shadow="hover" 
          class="goods-card"
          @click.stop="router.push({ path: `/goods/${item.id}`, query: { item: encodeURIComponent(JSON.stringify(item)) } })">
          <div class="goods-image">
            <img 
              :src="getFirstImage(item, index)" 
              :alt="item.name || '商品图片'"
            >
            <div class="pet-type-tag" style="background:#67c23a">AI推荐</div>
          </div>
          <div class="goods-name" :title="item.name || '未知商品'">{{ item.name || '未知商品' }}</div>
          <div class="goods-price">¥{{ item.price ? item.price.toFixed(2) : '0.00' }}</div>
        </el-card>
      </div>
    </div>

    <!-- 宠物类型筛选（保留，方便切换品类） -->
    <div class="pet-filter-bar">
      <div class="filter-list">
        <div class="filter-item" :class="{ active: selectedPetType === 'all' }" @click="selectPetType('all')">
          <span class="filter-text">全部商品</span>
        </div>
        <div class="filter-item" :class="{ active: selectedPetType === '通用' }" @click="selectPetType('通用')">
          <div class="filter-icon"><img :src="'/images/icon_all.jpg'" alt="通用"></div>
          <span class="filter-text">通用商品</span>
        </div>
        <div class="filter-item" :class="{ active: selectedPetType === '狗狗' }" @click="selectPetType('狗狗')">
          <div class="filter-icon"><img :src="'/images/icon_dog.jpg'" alt="狗狗"></div>
          <span class="filter-text">狗狗商品</span>
        </div>
        <div class="filter-item" :class="{ active: selectedPetType === '猫咪' }" @click="selectPetType('猫咪')">
          <div class="filter-icon"><img :src="'/images/icon_cat.jpg'" alt="猫咪"></div>
          <span class="filter-text">猫咪商品</span>
        </div>
        <div class="filter-item" :class="{ active: selectedPetType === '鸟' }" @click="selectPetType('鸟')">
          <div class="filter-icon"><img :src="'/images/icon_bird.jpg'" alt="鸟类"></div>
          <span class="filter-text">鸟类商品</span>
        </div>
        <div class="filter-item" :class="{ active: selectedPetType === '小宠' }" @click="selectPetType('小宠')">
          <div class="filter-icon"><img :src="'/images/icon_small.jpg'" alt="小宠"></div>
          <span class="filter-text">小宠商品</span>
        </div>
      </div>
    </div>

    <!-- 全部商品列表 -->
    <div v-if="loading" class="loading-tip">加载中...</div>
    <div class="goods-grid" v-else>
      <el-card 
        v-for="(item, index) in goodsList" 
        :key="item.id || index" 
        shadow="hover" 
        class="goods-card"
        @click.stop="router.push({ path: `/goods/${item.id}`, query: { item: encodeURIComponent(JSON.stringify(item)) } })">
        <div class="goods-image">
          <img 
            :src="getFirstImage(item, index)" 
            :alt="item.name || '商品图片'"
          >
          <div class="pet-type-tag" v-if="item.sort !== undefined">{{ formatPetType(item.sort) }}</div>
        </div>
        <div class="goods-name" :title="item.name || '未知商品'">{{ item.name || '未知商品' }}</div>
        <div class="goods-price">¥{{ item.price ? item.price.toFixed(2) : '0.00' }}</div>
      </el-card>
    </div>
    <div v-if="goodsList.length === 0 && !loading" class="empty-tip">暂无该类型商品，敬请期待~</div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'

const router = useRouter()
const request = axios.create({ baseURL: '/api', timeout: 10000 })

// 商品数据
const goodsList = ref([])
const loading = ref(false)
// 宠物类型筛选
const selectedPetType = ref('all')

// AI 推荐相关
const aiDemand = ref('')
const aiRecommendList = ref([])
const aiLoading = ref(false)

// 格式化宠物类型
const formatPetType = (sortVal) => {
  const map = { 1: '狗狗', 2: '猫咪', 3: '鸟', 4: '小宠', 0: '通用' }
  return map[sortVal] || "通用"
}

// 获取商品封面图
const getFirstImage = (item, index) => {
  if (!item.detailImages) {
    return `https://picsum.photos/seed/pet${item.id || index}/300/200`
  }
  const imageList = item.detailImages.split(',').filter(url => url.trim())
  return imageList[0] || `https://picsum.photos/seed/pet${item.id || index}/300/200`
}

// 获取商品列表（仅保留宠物类型筛选）
const getGoodsList = async () => {
  loading.value = true
  try {
    const params = {}
    if (selectedPetType.value !== 'all') params.apply_pet = selectedPetType.value
    const { data } = await request.get('/product/list', { params })
    goodsList.value = data.data || []
  } catch (err) {
    ElMessage.error('商品加载失败')
    goodsList.value = []
  } finally {
    loading.value = false
  }
}

// 切换宠物类型
const selectPetType = (type) => {
  selectedPetType.value = type
  getGoodsList()
}

// ==============================================
// 阿里云AI 智能推荐（唯一搜索方式）
// ==============================================
const aiRecommendGoods = async () => {
  if (!aiDemand.value.trim()) {
    ElMessage.warning('请输入您的需求')
    return
  }
  
  aiLoading.value = true
  aiRecommendList.value = []

  try {
    // 1. AI解析需求
    const { data: aiRes } = await request.post('/ai/shop_recommend', {
      user_demand: aiDemand.value
    })

    if (aiRes.code !== 200) {
      ElMessage.error(aiRes.msg || 'AI解析失败')
      return
    }

    const { petType, maxPrice, keywords } = aiRes.data
    
    // 2. 构造查询条件
    const queryParams = { apply_pet: petType }
    if (maxPrice && maxPrice !== 9999) queryParams.price_lte = maxPrice

    // 3. 查询匹配商品
    const { data: goodsRes } = await request.get('/product/list', { params: queryParams })
    
    let list = goodsRes.data || []
    
    // 4. 关键词精准匹配
    if (keywords && Array.isArray(keywords) && keywords.length) {
      list = list.filter(item => {
        return keywords.some(key => item.name && item.name.includes(key))
      })
    }

    aiRecommendList.value = list.slice(0, 8)

    if (aiRecommendList.value.length === 0) {
      ElMessage.warning('未找到匹配商品，更换关键词试试~')
    } else {
      ElMessage.success(`✅ AI为您找到 ${aiRecommendList.value.length} 款商品`)
    }

  } catch (error) {
    console.error('AI推荐错误：', error)
    ElMessage.error(`阿里云AI服务异常：${error.message || '请检查Python服务'}`)
  } finally {
    aiLoading.value = false
  }
}

// 清空AI推荐
const clearAIRecommend = () => {
  aiDemand.value = ''
  aiRecommendList.value = []
}

onMounted(() => {
  getGoodsList()
})
</script>

<style scoped>
.pet-mall-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}
.mall-header {
  text-align: center;
  margin-bottom: 20px;
}
.mall-header h2 {
  font-size: 28px;
  color: #333;
  margin: 0 0 8px 0;
}
.mall-header p {
  font-size: 14px;
  color: #999;
  margin: 0;
}

/* AI搜索栏 */
.ai-search-bar {
  margin-bottom: 20px;
  padding: 0 20px;
}
.ai-search-group {
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  max-width: 700px;
  margin: 0 auto;
}
.ai-search-input {
  flex: 1;
  min-width: 400px;
}

/* AI推荐区域 */
.ai-recommend-container {
  margin-bottom: 30px;
  padding: 0 20px;
}
.ai-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  font-size: 18px;
  font-weight: bold;
  color: #333;
  border-left: 4px solid #67c23a;
  padding-left: 10px;
}

.pet-filter-bar {
  margin-bottom: 40px;
  padding: 0 20px;
}
.filter-list {
  display: flex;
  gap: 16px;
  justify-content: center;
  flex-wrap: wrap;
}
.filter-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 20px;
  border-radius: 24px;
  background: #fff;
  border: 1px solid #f0f0f0;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 120px;
  justify-content: center;
}
.filter-item:hover {
  transform: translateY(-3px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
  border-color: #409eff;
}
.filter-item.active {
  background: linear-gradient(135deg, #409eff 0%, #66b1ff 100%);
  color: #fff;
  border-color: transparent;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
}
.filter-icon {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
}
.filter-icon img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.filter-text {
  font-size: 15px;
  font-weight: 500;
  color: #333;
  white-space: nowrap;
}
.filter-item.active .filter-text {
  color: #fff;
}
.goods-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px;
}
.goods-card {
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.3s ease;
  text-align: center;
  cursor: pointer;
  position: relative;
}
.goods-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 20px rgba(0,0,0,0.1);
}
.goods-image {
  width: 100%;
  height: 160px;
  overflow: hidden;
  border-radius: 8px 8px 0 0;
  position: relative;
}
.goods-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.pet-type-tag {
  position: absolute;
  top: 10px;
  right: 10px;
  background: rgba(126, 34, 206, 0.8);
  color: #fff;
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 4px;
}
.goods-name {
  font-size: 15px;
  color: #333;
  margin: 10px 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  padding: 0 10px;
}
.goods-price {
  font-size: 18px;
  font-weight: bold;
  color: #ff4d4f;
  margin-bottom: 15px;
}
.loading-tip {
  text-align: center;
  padding: 60px 0;
  color: #666;
  font-size: 16px;
}
.empty-tip {
  text-align: center;
  padding: 60px 0;
  color: #999;
  font-size: 16px;
}
@media (max-width: 1200px) { .goods-grid { grid-template-columns: repeat(3, 1fr); } }
@media (max-width: 768px) {
  .goods-grid { grid-template-columns: repeat(2, 1fr); }
  .pet-filter-bar { overflow-x: auto; padding-bottom: 10px; }
  .filter-list { justify-content: flex-start; flex-wrap: nowrap; }
  .ai-search-input { min-width: 100%; }
}
</style>