<template>
  <div class="goods-detail-container">
    <div class="back-bar">
      <el-button type="default" round @click="$router.back()" class="back-btn">
        <el-icon><ArrowLeft /></el-icon> 返回商城
      </el-button>
    </div>
    <div class="detail-main" v-if="goodsInfo">
      <div class="detail-image-wrap">
        <div class="main-image">
          <el-carousel
            v-if="imageList.length > 1"
            v-model="activeIndex"
            height="400px"
            arrow="hover"
            indicator-position="none"
            class="goods-carousel"
          >
            <el-carousel-item v-for="(img, idx) in imageList" :key="idx">
              <img :src="img" alt="商品图片" class="carousel-img" />
            </el-carousel-item>
          </el-carousel>
          <img
            v-else
            :src="imageList[0]"
            alt="商品图片"
            class="single-img"
          />
        </div>

        <div class="thumb-list" v-if="imageList.length > 1">
          <div
            v-for="(img, idx) in imageList"
            :key="idx"
            class="thumb-item"
            :class="{ active: idx === activeIndex }"
            @click="activeIndex = idx"
          >
            <img :src="img" alt="缩略图">
          </div>
        </div>

        <el-button
          v-if="goodsInfo.model && goodsInfo.model.trim() !== ''"
          type="primary"
          round
          class="three-btn"
          @click="jumpTo3D"
        >
          <el-icon><View /></el-icon> 360° 全景展示
        </el-button>
      </div>
      <div class="detail-info">
        <div class="title-section">
          <h1 class="goods-title">{{ goodsInfo.name || '商品名称' }}</h1>
          <div class="rating">
            <span class="stars">★★★★★</span>
            <span class="review-count">5200+ 好评</span>
          </div>
        </div>
        <div class="price-wrap">
          <span class="price-symbol">¥</span>
          <span class="price-num">{{ (goodsInfo.price || 0).toFixed(2) }}</span>
          <span class="price-unit">元</span>
          <span class="stock-badge">库存 {{ goodsInfo.stock || 99 }} 件</span>
        </div>
        <div class="highlight-grid">
          <div class="highlight-card">
            <div class="highlight-icon">🏆</div>
            <div class="highlight-text">品质认证</div>
          </div>
          <div class="highlight-card">
            <div class="highlight-icon">🚚</div>
            <div class="highlight-text">极速配送</div>
          </div>
          <div class="highlight-card">
            <div class="highlight-icon">🔧</div>
            <div class="highlight-text">一年质保</div>
          </div>
          <div class="highlight-card">
            <div class="highlight-icon">💯</div>
            <div class="highlight-text">宠友推荐</div>
          </div>
        </div>

        <div class="goods-meta">
          <div class="meta-item">
            <span class="meta-label">分类</span>
            <span class="meta-value">{{ goodsInfo.Category?.name || '通用' }}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">适用宠物</span>
            <span class="meta-value">{{ formatPetType(goodsInfo.sort) }}</span>
          </div>
        </div>

        <div class="goods-desc">
          {{ goodsInfo.description || '优质宠物用品，安全耐用，为爱宠保驾护航' }}
        </div>

        <div class="num-group">
          <span class="num-label">购买数量</span>
          <div class="custom-number-input">
            <button class="num-btn" @click="buyNum > 1 && buyNum--" :disabled="buyNum <= 1">−</button>
            <span class="num-value">{{ buyNum }}</span>
            <button class="num-btn" @click="buyNum < (goodsInfo.stock || 99) && buyNum++" :disabled="buyNum >= (goodsInfo.stock || 99)">+</button>
          </div>
        </div>

        <div class="btn-group">
          <button class="cart-btn" @click="addToCart">
            <el-icon><ShoppingCart /></el-icon>
            <span>加入购物车</span>
          </button>
          <button class="buy-btn" @click="buyNow">
            <span>立即购买</span>
            <el-icon><Pointer /></el-icon>
          </button>
        </div>
      </div>
    </div>
    <div class="service-box">
      <h3 class="service-title">✨ 购物保障</h3>
      <div class="service-list">
        <div class="service-item">
          <el-icon><CircleCheck /></el-icon>
          <span>正品保障</span>
        </div>
        <div class="service-item">
          <el-icon><CircleCheck /></el-icon>
          <span>7天无理由</span>
        </div>
        <div class="service-item">
          <el-icon><CircleCheck /></el-icon>
          <span>宠物专用</span>
        </div>
        <div class="service-item">
          <el-icon><CircleCheck /></el-icon>
          <span>在线客服</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft, View, ShoppingCart, Pointer, CircleCheck } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const buyNum = ref(1)
const goodsInfo = ref({})
const activeIndex = ref(0)

const formatPetType = (sortVal) => {
  const map = { 1:'狗狗', 2:'猫咪', 3:'鸟', 4:'小宠', 0:'通用' }
  return map[sortVal] || "通用"
}

const imageList = computed(() => {
  const list = []
  if (goodsInfo.value.detailImages) {
    const imgs = goodsInfo.value.detailImages.split(',').filter(url => url.trim())
    list.push(...imgs)
  }
  if (list.length === 0 && goodsInfo.value.coverImage) {
    list.push(goodsInfo.value.coverImage)
  }
  if (list.length === 0) {
    list.push(`https://picsum.photos/seed/pet${goodsInfo.value.id}/400/300`)
  }
  return list
})

onMounted(() => {
  try {
    const itemStr = decodeURIComponent(route.query.item)
    goodsInfo.value = JSON.parse(itemStr)
  } catch (e) {
    ElMessage.error('数据异常')
  }
})

const addToCart = () => {
  const cart = JSON.parse(localStorage.getItem('cart') || '[]')
  const exist = cart.find(i => i.id === goodsInfo.value.id)
  if (exist) exist.quantity += buyNum.value
  else cart.push({ ...goodsInfo.value, quantity: buyNum.value })
  localStorage.setItem('cart', JSON.stringify(cart))
  ElMessage.success('加入购物车成功')
}

const buyNow = () => {
  router.push({
    path: '/order-confirm',
    query: {
      goods: encodeURIComponent(JSON.stringify(goodsInfo.value)),
      quantity: buyNum.value
    }
  })
}

const jumpTo3D = () => {
  router.push({
    path: '/3d-goods/',
    query: {
      item: encodeURIComponent(JSON.stringify(goodsInfo.value))
    }
  })
}
</script>

<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.goods-detail-container {
  max-width: 1280px;
  margin: 0 auto;
  padding: 40px 32px;
  background: linear-gradient(145deg, #f6f8fc 0%, #f1f4f9 100%);
  min-height: calc(100vh - 80px);
  font-family: 'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;
  position: relative;
}
.back-bar {
  margin-bottom: 32px;
}
.back-btn {
  border-radius: 60px;
  padding: 10px 24px;
  font-size: 14px;
  font-weight: 500;
  background: rgba(255,255,255,0.85);
  backdrop-filter: blur(4px);
  border: 1px solid rgba(255,255,255,0.5);
  color: #1e293b;
  transition: all 0.3s cubic-bezier(0.2, 0.9, 0.4, 1.1);
  box-shadow: 0 2px 8px rgba(0,0,0,0.02);
}
.back-btn:hover {
  background: white;
  border-color: #f97316;
  transform: translateX(-6px);
  box-shadow: 0 8px 20px rgba(0,0,0,0.06);
  color: #f97316;
}
.detail-main {
  display: flex;
  gap: 56px;
  background: rgba(255,255,255,0.92);
  backdrop-filter: blur(2px);
  padding: 40px;
  border-radius: 56px;
  box-shadow: 
    0 4px 6px -2px rgba(0,0,0,0.02),
    0 12px 24px -8px rgba(0,0,0,0.04),
    0 24px 48px -12px rgba(0,0,0,0.08);
  margin-bottom: 32px;
  transition: all 0.35s ease;
  border: 1px solid rgba(255,255,255,0.6);
}
.detail-main:hover {
  box-shadow: 
    0 8px 12px -4px rgba(0,0,0,0.03),
    0 24px 40px -12px rgba(0,0,0,0.12),
    0 32px 64px -16px rgba(0,0,0,0.1);
  transform: translateY(-2px);
}
.detail-image-wrap {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.main-image {
  position: relative;
  width: 100%;
  height: 400px;
  border-radius: 36px;
  overflow: hidden;
  background: linear-gradient(145deg, #fafcff, #f0f4fa);
  box-shadow: inset 0 0 0 1px rgba(255,255,255,0.8), 0 8px 20px rgba(0,0,0,0.06);
  display: flex;
  align-items: center;
  justify-content: center;
}
.goods-carousel {
  width: 100%;
  height: 100%;
}
.carousel-img,
.single-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  transition: transform 0.5s cubic-bezier(0.2, 0.9, 0.4, 1.1);
  padding: 20px;
}
.main-image:hover img {
  transform: scale(1.03);
}
.thumb-list {
  display: flex;
  gap: 14px;
  flex-wrap: wrap;
  justify-content: center;
}
.thumb-item {
  width: 80px;
  height: 80px;
  border-radius: 24px;
  overflow: hidden;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.2s;
  background: white;
  box-shadow: 0 4px 10px rgba(0,0,0,0.03);
}
.thumb-item img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  padding: 8px;
}
.thumb-item.active {
  border-color: #f97316;
  box-shadow: 0 8px 20px rgba(249, 115, 22, 0.15);
  transform: scale(1.03);
}
.thumb-item:hover {
  border-color: #ffb347;
  transform: scale(1.03);
}
.three-btn {
  width: 100%;
  border-radius: 100px;
  padding: 14px 0;
  font-size: 15px;
  font-weight: 600;
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  border: none;
  box-shadow: 0 8px 20px rgba(59, 130, 246, 0.25);
  transition: all 0.3s;
  margin-top: 8px;
  letter-spacing: 0.5px;
}
.three-btn:hover {
  transform: translateY(-3px);
  box-shadow: 0 16px 32px rgba(59, 130, 246, 0.3);
}
.detail-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 28px;
  padding: 8px 0;
}
.title-section {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
}
.goods-title {
  font-size: 34px;
  font-weight: 700;
  letter-spacing: -0.02em;
  background: linear-gradient(135deg, #0f172a, #334155);
  background-clip: text;
  -webkit-background-clip: text;
  color: transparent;
  line-height: 1.2;
  margin: 0;
}
.rating {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #fef9e6;
  padding: 6px 14px;
  border-radius: 40px;
}
.stars {
  color: #fbbf24;
  font-size: 14px;
  letter-spacing: 2px;
}
.review-count {
  font-size: 13px;
  font-weight: 500;
  color: #b45309;
}

.price-wrap {
  display: flex;
  align-items: baseline;
  gap: 8px;
  flex-wrap: wrap;
  background: #fff7ed;
  padding: 12px 20px;
  border-radius: 80px;
  width: fit-content;
}
.price-symbol {
  font-size: 22px;
  font-weight: 600;
  color: #f97316;
}
.price-num {
  font-size: 44px;
  font-weight: 800;
  color: #f97316;
  line-height: 1;
  font-feature-settings: "tnum";
}
.price-unit {
  font-size: 15px;
  color: #f97316;
  font-weight: 500;
}
.stock-badge {
  margin-left: 12px;
  font-size: 13px;
  background: #f1f5f9;
  padding: 5px 14px;
  border-radius: 40px;
  color: #475569;
  font-weight: 500;
}
.highlight-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin: 8px 0;
}
.highlight-card {
  background: linear-gradient(135deg, #fefce8, #fff7ed);
  border-radius: 28px;
  padding: 12px 8px;
  text-align: center;
  transition: all 0.2s;
  border: 1px solid rgba(249,115,22,0.1);
}
.highlight-card:hover {
  transform: translateY(-4px);
  background: #fff7ed;
  border-color: #fed7aa;
}
.highlight-icon {
  font-size: 24px;
  margin-bottom: 6px;
}
.highlight-text {
  font-size: 12px;
  font-weight: 600;
  color: #b45309;
}

.goods-meta {
  display: flex;
  gap: 28px;
  flex-wrap: wrap;
  border-top: 1px solid #f1f5f9;
  border-bottom: 1px solid #f1f5f9;
  padding: 18px 0;
}
.meta-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.meta-label {
  font-size: 12px;
  font-weight: 500;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.meta-value {
  font-size: 15px;
  font-weight: 600;
  color: #1e293b;
}

.goods-desc {
  font-size: 15px;
  line-height: 1.65;
  color: #334155;
  background: #f8fafc;
  padding: 20px 24px;
  border-radius: 32px;
  border: 1px solid #eef2ff;
  position: relative;
  overflow: hidden;
}
.goods-desc::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 4px;
  height: 100%;
  background: linear-gradient(to bottom, #f97316, #fed7aa);
  border-radius: 4px 0 0 4px;
}

.num-group {
  display: flex;
  align-items: center;
  gap: 24px;
}
.num-label {
  font-size: 15px;
  font-weight: 600;
  color: #1e293b;
}
.custom-number-input {
  display: flex;
  align-items: center;
  gap: 14px;
  background: #f8fafc;
  border-radius: 80px;
  padding: 6px 12px;
  border: 1px solid #e2e8f0;
}
.num-btn {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  border: none;
  background: white;
  font-size: 20px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  color: #475569;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}
.num-btn:hover:not(:disabled) {
  background: #f97316;
  color: white;
  transform: scale(0.94);
}
.num-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.num-value {
  min-width: 40px;
  text-align: center;
  font-size: 18px;
  font-weight: 700;
  color: #0f172a;
}

.btn-group {
  display: flex;
  gap: 20px;
  margin-top: 8px;
}
.cart-btn, .buy-btn {
  flex: 1;
  padding: 16px 0;
  font-size: 16px;
  font-weight: 600;
  border-radius: 100px;
  transition: all 0.3s cubic-bezier(0.2, 0.9, 0.4, 1.1);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  cursor: pointer;
  border: none;
  position: relative;
  overflow: hidden;
}
.cart-btn::after, .buy-btn::after {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
  transition: left 0.5s;
}
.cart-btn:hover::after, .buy-btn:hover::after {
  left: 100%;
}
.cart-btn {
  background: linear-gradient(105deg, #10b981, #34d399);
  color: white;
  box-shadow: 0 6px 16px rgba(16, 185, 129, 0.2);
}
.cart-btn:hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 28px rgba(16, 185, 129, 0.3);
}
.buy-btn {
  background: linear-gradient(105deg, #f97316, #fb923c);
  color: white;
  box-shadow: 0 6px 16px rgba(249, 115, 22, 0.2);
}
.buy-btn:hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 28px rgba(249, 115, 22, 0.35);
}
.service-box {
  background: rgba(255,255,255,0.85);
  backdrop-filter: blur(4px);
  padding: 32px 40px;
  border-radius: 48px;
  box-shadow: 0 8px 20px rgba(0,0,0,0.02), 0 2px 4px rgba(0,0,0,0.02);
  border: 1px solid rgba(255,255,245,0.8);
}
.service-title {
  font-size: 18px;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 24px 0;
  display: flex;
  align-items: center;
  gap: 8px;
}
.service-list {
  display: flex;
  gap: 32px;
  flex-wrap: wrap;
}
.service-item {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  font-weight: 500;
  color: #1e293b;
  background: linear-gradient(105deg, #ffffff, #fefce8);
  padding: 10px 28px;
  border-radius: 60px;
  border: 1px solid #fee2e2;
  transition: all 0.2s;
}
.service-item:hover {
  transform: translateY(-2px);
  border-color: #fed7aa;
  box-shadow: 0 4px 12px rgba(0,0,0,0.04);
}
.service-item .el-icon {
  color: #10b981;
  font-size: 18px;
}

/* 响应式 */
@media (max-width: 900px) {
  .goods-detail-container {
    padding: 20px 16px;
  }
  .detail-main {
    flex-direction: column;
    gap: 32px;
    padding: 24px;
  }
  .main-image {
    height: 320px;
  }
  .carousel-img, .single-img {
    height: 320px;
  }
  .thumb-item {
    width: 68px;
    height: 68px;
  }
  .goods-title {
    font-size: 28px;
  }
  .price-num {
    font-size: 38px;
  }
  .highlight-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .btn-group {
    flex-direction: column;
    gap: 12px;
  }
  .service-list {
    gap: 16px;
    justify-content: center;
  }
}
</style>