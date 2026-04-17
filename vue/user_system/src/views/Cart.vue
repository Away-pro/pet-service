<template>
  <div class="cart-container">
    <div class="cart-header">
      <h2>🛒 购物车</h2>
    </div>

    <div v-if="cartList.length === 0" class="empty-cart">
      <el-empty description="购物车是空的" />
      <el-button type="primary" @click="$router.push('/goods')">去逛逛</el-button>
    </div>

    <div v-else class="cart-content">
      <el-table 
        :data="cartList" 
        style="width: 100%"
        ref="tableRef"
        @selection-change="handleSelectionChange"
      >
        <!-- 全选/单选列 -->
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column label="商品主图" width="80" align="center">
          <template #default="{ row }">
            <!-- 修复：调用方法获取第一张主图 -->
            <img 
              :src="getFirstImage(row)" 
              alt="商品图片"
              style="width: 50px; height: 50px; object-fit: cover; border-radius: 6px"
            />
          </template>
        </el-table-column>
        <el-table-column label="商品名称">
        <template #default="{ row }">
            <span 
            style="cursor: pointer; color: #409eff; text-decoration: underline;" 
            @click="$router.push({ 
                path: `/goods/${row.id}`, 
                query: { 
                item: encodeURIComponent(JSON.stringify(row)), 
                fromCart: true
                } 
            })"
            >
            {{ row.name }}
            </span>
        </template>
        </el-table-column>
        <el-table-column label="单价" prop="price">
          <template #default="{ row }">¥{{ row.price.toFixed(2) }}</template>
        </el-table-column>
        <el-table-column label="数量" prop="quantity" align="center" />
        <el-table-column label="小计" align="center">
          <template #default="{ row }">¥{{ (row.price * row.quantity).toFixed(2) }}</template>
        </el-table-column>
        <el-table-column label="操作" align="center">
          <template #default="{ row }">
            <el-button type="danger" size="small" @click="removeFromCart(row.id)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="cart-footer">
        <div class="batch-operate">
          <el-button 
            type="danger" 
            size="small" 
            :disabled="selectedItems.length === 0"
            @click="batchRemove"
          >
            删除选中商品
          </el-button>
        </div>
        <div class="total-info">
          <div class="total">
            已选合计：<span class="total-price">¥{{ totalPrice.toFixed(2) }}</span>
          </div>
          <el-button 
            type="primary" 
            size="large" 
            :disabled="selectedItems.length === 0"
            @click="checkout"
          >
            结算付款
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElEmpty } from 'element-plus'
import { useRouter } from 'vue-router'

const router = useRouter()
const cartList = ref([])
const selectedItems = ref([])
const tableRef = ref(null)

// 加载购物车
const loadCart = () => {
  cartList.value = JSON.parse(localStorage.getItem('cart') || '[]')
}

// 更新购物车
const updateCart = () => {
  localStorage.setItem('cart', JSON.stringify(cartList.value))
}

// 选中项变化
const handleSelectionChange = (val) => {
  selectedItems.value = val
}

// ============== 核心修复：获取商品第一张主图 ==============
const getFirstImage = (row) => {
  // 1. 优先处理多图字段（逗号分隔），取第一张
  if (row.detailImages) {
    const imgList = row.detailImages.split(',').map(item => item.trim()).filter(Boolean)
    if (imgList.length > 0) {
      return imgList[0]
    }
  }
  // 2. 无多图则使用封面图
  // 3. 无封面图使用默认兜底图
  return row.coverImage || 'https://picsum.photos/seed/cart/50/50'
}

// 删除单个商品
const removeFromCart = (id) => {
  cartList.value = cartList.value.filter(item => item.id !== id)
  updateCart()
  ElMessage.success('商品已删除')
}

// 批量删除
const batchRemove = () => {
  const ids = selectedItems.value.map(item => item.id)
  cartList.value = cartList.value.filter(item => !ids.includes(item.id))
  updateCart()
  selectedItems.value = []
  ElMessage.success('选中商品已删除')
}

// 计算选中商品总价
const totalPrice = computed(() => {
  return selectedItems.value.reduce((sum, item) => sum + item.price * item.quantity, 0)
})

// 结算
const checkout = () => {
  if (selectedItems.value.length === 0) {
    ElMessage.warning('请选择要结算的商品')
    return
  }
  const goodsData = encodeURIComponent(JSON.stringify(selectedItems.value))
  router.push({
    path: '/order-confirm',
    query: {
      goods: goodsData
    }
  })
}

onMounted(() => {
  loadCart()
})
</script>

<style scoped>
.cart-container {
  max-width: 1200px;
  margin: 30px auto;
  padding: 0 20px;
}
.cart-header {
  margin-bottom: 20px;
}
.cart-header h2 {
  font-size: 24px;
  color: #333;
}
.empty-cart {
  text-align: center;
  padding: 60px 0;
}
.cart-content {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.05);
}
.cart-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #eee;
}
.batch-operate {
  margin-right: 20px;
}
.total-info {
  display: flex;
  align-items: center;
  gap: 20px;
}
.total {
  font-size: 18px;
}
.total-price {
  font-size: 24px;
  font-weight: bold;
  color: #ff4d4f;
}
:deep(.el-table) {
  --el-table-header-text-color: #666;
}
</style>