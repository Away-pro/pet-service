<template>
  <div class="order-page">
    <div class="header">
      <h3>📦 我的订单</h3>
    </div>

    <div v-if="orderList.length === 0" class="empty">
      <el-empty description="暂无订单，快去选购吧~" />
      <el-button type="primary" @click="$router.push('/goods')" style="margin-top: 20px">
        去购物
      </el-button>
    </div>

    <div class="order-list" v-else>
      <div class="order-card" v-for="item in orderList" :key="item.id">
        <!-- 订单头部 -->
        <div class="order-header">
          <span class="order-no">订单号：{{ item.orderNo }}</span>
          <el-tag :type="getStatusTag(item.status)" class="status-tag">
            {{ item.status }}
          </el-tag>
        </div>

        <!-- 商品区域：真实主图 + 名称 -->
        <div class="goods-container">
          <div class="goods-item" v-for="(goods, index) in getOrderGoods(item)" :key="index">
            <div class="goods-img">
              <img 
                :src="goods.coverImage || 'https://picsum.photos/seed/pet/80/80'" 
                :alt="goods.name" 
              />
            </div>
            <div class="goods-info">
              <div class="goods-name">{{ goods.name }}</div>
            </div>
          </div>
        </div>

        <!-- 订单底部 -->
        <div class="order-footer">
          <div class="left">
            <span>创建时间：{{ formatTime(item.createTime) }}</span>
            <span class="total-price">实付：¥{{ item.totalPrice }}</span>
          </div>
          <div class="operate-btns">
            <el-button 
              v-if="item.status === '待付款'" 
              type="success" size="small" @click="payOrder(item.id)"
            >
              立即支付
            </el-button>
            <el-button 
              v-if="item.status === '待付款'" 
              type="danger" size="small" @click="cancelOrder(item.id)"
            >
              取消订单
            </el-button>
            <el-button v-else type="default" size="small" disabled>
              已完成
            </el-button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElEmpty, ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'
import axios from 'axios'
const request = axios.create({ baseURL: '/api' })
const router = useRouter()

// 订单数据
const orderList = ref([])
const allGoodsList = ref([])
const userId = JSON.parse(localStorage.getItem('userInfo') || '{}').id

//接口请求
const getMyOrder = async () => {
  if (!userId) return
  try {
    const { data } = await request.get('/user-order/my', { params: { userId } })
    orderList.value = data.data || []
  } catch (e) { ElMessage.error('订单加载失败') }
}

// 2. 获取全部商品
const getAllGoods = async () => {
  try {
    const { data } = await request.get('/product/list')
    allGoodsList.value = data.data || []
  } catch (e) {}
}

// 订单商品匹配真实图片
const getOrderGoods = (orderItem) => {
  // 拆分订单中的商品名称
  const goodsNames = orderItem.goodsName ? orderItem.goodsName.split('，') : ['未知商品']
  // 遍历名称，从全量商品中匹配真实图片
  return goodsNames.map(name => {
    const target = allGoodsList.value.find(g => g.name === name)
    return {
      name: name,
      coverImage: target ? target.coverImage : ''
    }
  })
}

const getStatusTag = (status) => {
  const map = { 待付款: 'warning', 已付款: 'success', 已完成: 'success', 已取消: 'danger' }
  return map[status] || 'info'
}

const formatTime = (t) => new Date(t).toLocaleString('zh-CN')

const payOrder = async (orderId) => {
  await request.post('/user-order/pay', { orderId })
  ElMessage.success('支付成功！')
  getMyOrder()
}

const cancelOrder = async (orderId) => {
  await request.post('/user-order/cancel', { orderId })
  ElMessage.success('订单已取消')
  getMyOrder()
}

// 初始化
onMounted(() => {
  getAllGoods()   // 先拿商品
  getMyOrder()    // 再拿订单
})
</script>

<style scoped>
.order-page { max-width: 1000px; margin: 30px auto; padding: 0 20px; }
.header { margin-bottom: 25px; }
.header h3 { font-size: 24px; color: #333; margin: 0; }
.empty { padding: 80px 0; text-align: center; }

.order-card {
  background: #fff; border-radius: 16px; padding: 24px; margin-bottom: 16px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.06); transition: all 0.3s;
}
.order-card:hover { box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
.order-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 18px; }
.order-no { font-size: 15px; font-weight: 500; }
.status-tag { padding: 4px 12px; border-radius: 20px; }

.goods-container { border-top: 1px dashed #f0f0f0; padding: 16px 0; }
.goods-item { display: flex; align-items: center; gap: 16px; margin-bottom: 12px; }
.goods-img img { width: 70px; height: 70px; border-radius: 8px; object-fit: cover; }
.goods-name { font-size: 15px; font-weight: 500; }

.order-footer { display: flex; justify-content: space-between; align-items: center; padding-top: 18px; border-top: 1px solid #f5f5f5; }
.left { display: flex; flex-direction: column; gap: 6px; color: #666; font-size: 14px; }
.total-price { color: #ff4d4f; font-size: 18px; font-weight: bold; }
.operate-btns { display: flex; gap: 10px; }
</style>