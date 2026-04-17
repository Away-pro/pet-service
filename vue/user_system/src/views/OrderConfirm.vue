<template>
  <div class="order-confirm-container">
    <div class="back-bar">
      <el-button type="default" round @click="$router.back()">
        <el-icon><ArrowLeft /></el-icon> 返回
      </el-button>
      <h2>确认订单</h2>
    </div>

    <!-- 收货地址：下拉选择 + 新增地址按钮 -->
    <div class="address-section">
      <h3>收货地址</h3>
      <div class="address-select-wrapper">
        <el-select
          v-model="selectedAddress"
          placeholder="请选择收货地址"
          style="flex: 1; min-width: 300px;"
          size="large"
          value-key="id"
        >
          <el-option
            v-for="item in addressList"
            :key="item.id"
            :value="item"
            :label="`${item.name} ${item.phone} | ${item.address} ${item.detail} ${item.isDefault == 1 ? '[默认]' : ''}`"
          />
        </el-select>
        <el-button type="primary" @click="goToAddAddress" style="margin-left: 10px">
          新增地址
        </el-button>
      </div>
      <div v-if="addressList.length === 0" class="empty-tip">
        <el-empty description="暂无收货地址" />
        <el-button type="primary" @click="goToAddAddress">去添加地址</el-button>
      </div>
    </div>

    <!-- 🔥 多商品信息展示 -->
    <div class="goods-section">
      <h3>商品信息</h3>
      <div class="goods-list">
        <div v-for="item in goodsList" :key="item.id" class="goods-item">
          <img :src="`https://picsum.photos/seed/pet${item.id}/80/80`" alt="商品图片">
          <div class="info">
            <p class="name">{{ item.name }}</p>
            <p class="price">¥{{ (item.price || 0).toFixed(2) }} × {{ item.quantity || 1 }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 订单摘要 -->
    <div class="summary-section">
      <div class="summary-item">
        <span>商品总价</span>
        <span>¥{{ totalPrice.toFixed(2) }}</span>
      </div>
      <div class="summary-item total">
        <span>实付金额</span>
        <span>¥{{ totalPrice.toFixed(2) }}</span>
      </div>
    </div>

    <!-- 提交订单 -->
    <div class="submit-section">
      <el-button 
        type="primary" 
        size="large" 
        :disabled="!selectedAddress"
        @click="submitOrder"
      >
        提交订单并支付 ¥{{ totalPrice.toFixed(2) }}
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElEmpty } from 'element-plus'
import { ArrowLeft } from '@element-plus/icons-vue'
import axios from 'axios'

const route = useRoute()
const router = useRouter()
const request = axios.create({ baseURL: '/api' })
const goodsList = ref([])
const addressList = ref([])
const selectedAddress = ref(null)
const userId = JSON.parse(localStorage.getItem('userInfo') || '{}').id || 0
const totalPrice = computed(() => {
  return goodsList.value.reduce((sum, item) => {
    return sum + (item.price || 0) * (item.quantity || 1)
  }, 0)
})

// 加载地址
const loadAddressList = async () => {
  if (!userId) {
    ElMessage.warning('未获取到用户信息，请重新登录')
    return
  }
  try {
    const { data } = await request.get('/address/list', { params: { userId } })
    addressList.value = data.data || []
    const defaultAddr = addressList.value.find(item => 
      item.isDefault === 1 || item.isDefault === '1' || item.isDefault === true
    )
    selectedAddress.value = defaultAddr || (addressList.value.length > 0 ? addressList.value[0] : null)
  } catch (error) {
    ElMessage.error('加载地址失败')
  }
}

// 跳转到新增地址页
const goToAddAddress = () => {
  router.push('/address').then(() => {
    loadAddressList()
  })
}

// 提交订单：整合多商品名称
const submitOrder = async () => {
  if (!selectedAddress.value) {
    ElMessage.warning('请选择收货地址')
    return
  }
  try {
    const orderNo = 'ORD' + Date.now()
    const goodsNames = goodsList.value.map(item => item.name).join('，')
    const orderData = {
      orderNo,
      userId,
      userName: selectedAddress.value.name,
      userPhone: selectedAddress.value.phone,
      goodsName: goodsNames,
      address: `${selectedAddress.value.address} ${selectedAddress.value.detail}`,
      addressId: selectedAddress.value.id,
      totalPrice: totalPrice.value,
      status: '待付款'
    }
    const { data } = await request.post('/user-order/add', orderData)
    if (data.code === 200) {
      ElMessage.success('订单提交成功，正在支付...')
      setTimeout(async () => {
        await request.post('/user-order/pay', { orderId: data.data.id })
        ElMessage.success('支付成功！')
        const cart = JSON.parse(localStorage.getItem('cart') || '[]')
        const orderGoodsIds = goodsList.value.map(item => item.id)
        const newCart = cart.filter(item => !orderGoodsIds.includes(item.id))
        localStorage.setItem('cart', JSON.stringify(newCart))
        
        router.push('/order')
      }, 1000)
    }
  } catch (error) {
    ElMessage.error('提交订单失败')
  }
}

onMounted(() => {
  try {
    const goodsStr = decodeURIComponent(route.query.goods)
    const parsedData = JSON.parse(goodsStr)
    
    if (Array.isArray(parsedData)) {
      // 来自购物车：直接是数组
      goodsList.value = parsedData
    } else if (typeof parsedData === 'object' && parsedData !== null) {
      // 来自商品详情页：是单个对象，包装成数组
      goodsList.value = [parsedData]
    } else {
      throw new Error('商品数据格式错误')
    }
  } catch (e) {
    ElMessage.error('商品数据异常')
    router.back()
  }
  loadAddressList()
})
</script>

<style scoped>
.order-confirm-container { max-width: 800px; margin: 0 auto; padding: 20px; }
.back-bar { display: flex; align-items: center; gap: 20px; margin-bottom: 20px; }
.address-section, .goods-section, .summary-section {
  background: #fff; padding: 20px; border-radius: 12px; margin-bottom: 20px;
}
.address-select-wrapper { display: flex; align-items: center; width: 100%; }
.empty-tip { text-align: center; padding: 20px 0; }

/* 多商品列表样式 */
.goods-list { display: flex; flex-direction: column; gap: 12px; }
.goods-item {
  display: flex; align-items: center; gap: 15px;
  padding: 15px; border: 1px solid #eee; border-radius: 8px;
}
.goods-item img { width: 80px; height: 80px; border-radius: 8px; object-fit: cover; }

.summary-item { display: flex; justify-content: space-between; font-size: 16px; margin: 8px 0; }
.summary-item.total {
  font-size: 20px; color: #ff4d4f; font-weight: bold;
  padding-top: 10px; border-top: 1px solid #eee;
}
.submit-section { text-align: center; margin-top: 20px; }
</style>