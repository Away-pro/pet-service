<template>
  <div class="order-pet-bg">
    <div class="pet-title-bar">
      <h2>🐾 订单管理（宠物用品/寄养）</h2>
    </div>
    <div class="search-box">
      <el-input
        v-model="searchNo"
        placeholder="搜索订单编号"
        style="width: 220px; margin-right: 10px"
        clearable
      />
      <el-select
        v-model="searchStatus"
        placeholder="筛选订单状态"
        style="width: 180px; margin-right: 10px"
        clearable
      >
        <el-option label="待付款" value="待付款" />
        <el-option label="待发货" value="待发货" />
        <el-option label="已发货" value="已发货" />
        <el-option label="已完成" value="已完成" />
        <el-option label="已取消" value="已取消" />
      </el-select>
      <el-button @click="getOrderList">搜索</el-button>
    </div>

    <br />
    <div class="pet-table-card">
      <el-table
        :data="pageList"
        style="width:100%"
        border
        stripe
        header-align="center"
        align="center"
      >
        <el-table-column label="序号" width="53">
          <template #default="scope">
            {{ (pageNum - 1) * pageSize + scope.$index + 1 }}
          </template>
        </el-table-column>
        <el-table-column prop="orderNo" label="订单编号" min-width="155" />
        <el-table-column prop="userName" label="用户名称" width="82" />
        <el-table-column prop="userPhone" label="联系电话" width="111" />
        <el-table-column label="商品主图" width="82">
          <template #default="scope">
            <img 
              :src="getGoodsImage(scope.row.goodsName)" 
              alt="商品主图"
              style="width:50px;height:50px;object-fit:cover;border-radius:6px"
            />
          </template>
        </el-table-column>

        <el-table-column prop="goodsName" label="商品名称" min-width="115" />
        <el-table-column prop="totalPrice" label="订单金额" width="82">
          <template #default="scope">¥{{ scope.row.totalPrice }}</template>
        </el-table-column>
        <el-table-column prop="address" label="配送地址" min-width="150" />
        <el-table-column prop="status" label="订单状态" width="82">
          <template #default="scope">
            <el-tag :type="getStatusTag(scope.row.status)">{{ scope.row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" min-width="155">
          <template #default="scope">
            {{ formatTime(scope.row.createTime) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="98">
          <template #default="scope">
            <el-button type="primary" size="small" @click="openEditDialog(scope.row)">修改状态</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
    <div class="pagination-box">
      <el-pagination
        v-model:current-page="pageNum"
        v-model:page-size="pageSize"
        :total="total"
        layout="total, prev, pager, next, jumper"
        prev-text="上一页"
        next-text="下一页"
        jumper-text="跳至"
        background
      />
    </div>
    <el-dialog v-model="dialogVisible" title="修改订单状态" width="450px">
      <el-form :model="form" label-width="100px">
        <el-form-item label="订单编号">
          <span>{{ form.orderNo }}</span>
        </el-form-item>
        <el-form-item label="订单状态">
          <el-select v-model="form.status" placeholder="请选择状态">
            <el-option label="待付款" value="待付款" />
            <el-option label="待发货" value="待发货" />
            <el-option label="已发货" value="已发货" />
            <el-option label="已完成" value="已完成" />
            <el-option label="已取消" value="已取消" />
          </el-select>
        </el-form-item>
      </el-form>

      <div style="text-align:right; margin-top:20px">
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveOrderStatus">保存</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue"
import request from "../utils/request"
import { ElMessage } from "element-plus"

// 订单数据
const orderList = ref([])
const allGoodsList = ref([])

// 搜索
const searchNo = ref("")
const searchStatus = ref("")

// 分页
const pageNum = ref(1)
const pageSize = ref(8)
const total = computed(() => filterList.value.length)

// 弹窗
const dialogVisible = ref(false)
const form = ref({
  id: "",
  orderNo: "",
  status: ""
})

const getAllGoods = async () => {
  try {
    const res = await request.get("/product/list")
    allGoodsList.value = res.data || []
  } catch (e) {}
}

const getGoodsImage = (goodsName) => {
  if (!goodsName) return "https://picsum.photos/seed/pet/50/50"
  const firstName = goodsName.split("，")[0]
  const target = allGoodsList.value.find(item => item.name === firstName)
  return target?.coverImage || "https://picsum.photos/seed/pet/50/50"
}

// 时间格式化函数：转为 YYYY-MM-DD HH:MM:SS
const formatTime = (timeStr) => {
  if (!timeStr) return ""
  const date = new Date(timeStr)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  const hours = String(date.getHours()).padStart(2, "0")
  const minutes = String(date.getMinutes()).padStart(2, "0")
  const seconds = String(date.getSeconds()).padStart(2, "0")
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

// 筛选列表
const filterList = computed(() => {
  let arr = [...orderList.value]
  if (searchNo.value) arr = arr.filter(i => i.orderNo.includes(searchNo.value))
  if (searchStatus.value) arr = arr.filter(i => i.status === searchStatus.value)
  return arr
})

// 分页数据
const pageList = computed(() => {
  const start = (pageNum.value - 1) * pageSize.value
  return filterList.value.slice(start, start + pageSize.value)
})

// 获取订单列表
const getOrderList = async () => {
  try {
    const res = await request.get("/order/list")
    orderList.value = res.data || []
  } catch (error) {
    orderList.value = []
    ElMessage.error("订单列表加载失败")
  }
}

// 订单状态标签颜色
const getStatusTag = (status) => {
  const map = {
    "待付款": "warning",
    "待发货": "info",
    "已发货": "primary",
    "已完成": "success",
    "已取消": "danger"
  }
  return map[status] || ""
}

// 打开编辑弹窗
const openEditDialog = (row) => {
  form.value = { ...row }
  dialogVisible.value = true
}

// 保存订单状态
const saveOrderStatus = async () => {
  try {
    await request.post("/order/update", form.value)
    ElMessage.success("订单状态修改成功！")
    dialogVisible.value = false
    getOrderList()
  } catch (error) {
    ElMessage.error("修改失败")
    console.error(error)
  }
}

// 初始化
onMounted(() => {
  getAllGoods()   
  getOrderList()  
})
</script>

<style scoped>
.order-pet-bg {
  padding: 20px;
  background: #fff9f5;
  min-height: calc(100vh - 150px);
}
.pet-title-bar {
  margin-bottom: 20px;
}
.pet-title-bar h2 {
  font-size: 22px;
  color: #e67e22;
  margin: 0;
}
.search-box {
  margin-bottom: 15px;
}
.pet-table-card {
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 10px rgba(230, 126, 34, 0.08);
}
:deep(.el-table__header) {
  background: #fff5ee !important;
  color: #c45c20 !important;
}
.pagination-box {
  margin-top: 20px;
  text-align: center;
}
.pagination-box :deep(.el-pagination) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
</style>