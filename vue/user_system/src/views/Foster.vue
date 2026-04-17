<template>
  <el-config-provider :locale="zhCn">
    <div class="foster-page">
      <div class="header">
        <h2 class="page-title">🐾 宠物寄养服务</h2>
        <el-button type="primary" @click="openFosterDialog">+ 新增寄养预约</el-button>
      </div>
      <div class="table-card">
        <el-table :data="fosterRecordList" border stripe class="custom-table">
          <el-table-column prop="petName" label="宠物名称" align="center" />
          <el-table-column prop="fosterType" label="寄养套餐" align="center" />
          <el-table-column label="寄养时间" align="center">
            <template #default="{row}">
              {{ formatTime(row.checkIn) }} <br> ~ {{ formatTime(row.checkOut) }}
            </template>
          </el-table-column>
          <el-table-column prop="fosterDays" label="寄养天数" align="center" />
          <el-table-column prop="totalPrice" label="总费用(元)" align="center" />
          <el-table-column label="预约状态" align="center">
            <template #default="{row}">
              <el-tag :type="getStatusColor(row.status)" round>
                {{ row.status }}
              </el-tag>
            </template>
          </el-table-column>
        </el-table>

        <div v-if="fosterRecordList.length === 0" class="empty-text">
          暂无寄养记录
        </div>
      </div>
      <el-dialog 
        v-model="dialogVisible" 
        title="寄养预约" 
        width="600px"
        append-to-body
      >
        <el-form :model="form" :rules="rules" ref="formRef" label-width="110px" class="custom-form">
          <el-form-item label="选择宠物" prop="petId">
            <el-select v-model="form.petId" placeholder="请选择已添加的宠物" style="width: 100%">
              <el-option 
                v-for="p in petList" 
                :key="p.id" 
                :label="`${p.petName}(${p.petType})`" 
                :value="p.id" 
              />
            </el-select>
          </el-form-item>
          <el-form-item label="入住时间" prop="checkIn">
            <el-date-picker 
              v-model="form.checkIn" 
              type="datetime" 
              placeholder="选择入住时间"
              style="width: 100%"
            />
          </el-form-item>
          <el-form-item label="离店时间" prop="checkOut">
            <el-date-picker 
              v-model="form.checkOut" 
              type="datetime" 
              placeholder="选择离店时间"
              style="width: 100%"
            />
            <div class="tip-text">
              超过6小时按一天计算（第一天除外）｜
              总寄养天数：{{ fosterDays }} 天
            </div>
          </el-form-item>

          <el-form-item label="寄养套餐" prop="packageId">
            <el-select v-model="form.packageId" placeholder="请选择寄养套餐" style="width: 100%">
              <el-option 
                v-for="item in packageList" 
                :key="item.id" 
                :label="item.name" 
                :value="item.id" 
              />
            </el-select>
          </el-form-item>

          <el-form-item label="单日价格" prop="unitPrice">
            <el-input v-model.number="form.unitPrice" disabled placeholder="自动填充" style="width: 100%" />
          </el-form-item>

          <el-form-item label="总费用" class="price-item">
            <span class="total-price">¥{{ form.totalPrice }}</span>
          </el-form-item>
        </el-form>

        <template #footer>
          <div class="dialog-footer">
            <el-button @click="closeDialog">取消</el-button>
            <el-button type="primary" @click="submit" :loading="submitLoading">提交预约</el-button>
          </div>
        </template>
      </el-dialog>
    </div>
  </el-config-provider>
</template>

<script setup>
import { ref, reactive, watch, onMounted, nextTick } from "vue";
import axios from "axios";
import { ElMessage, ElConfigProvider } from "element-plus";
import zhCn from "element-plus/es/locale/lang/zh-cn";

const request = axios.create({ baseURL: "/api" });

// 寄养记录列表
const fosterRecordList = ref([]);
// 弹窗控制
const dialogVisible = ref(false);
const submitLoading = ref(false);

// 表单数据
const form = reactive({
  petId: "",
  checkIn: "",
  checkOut: "",
  packageId: "",
  unitPrice: "",
  totalPrice: "0.00",
});

const fosterDays = ref(0);
const petList = ref([]);
const packageList = ref([]);
const formRef = ref(null);

// 打开预约弹窗
const openFosterDialog = () => {
  // 重置表单
  Object.assign(form, {
    petId: "", checkIn: "", checkOut: "", packageId: "", unitPrice: "", totalPrice: "0.00"
  });
  dialogVisible.value = true;
  nextTick(() => formRef.value?.clearValidate());
};

// 关闭弹窗
const closeDialog = () => {
  dialogVisible.value = false;
};

// 时间格式化函数
const formatTime = (timeStr) => {
  if (!timeStr) return ""
  const date = new Date(timeStr)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  const hours = String(date.getHours()).padStart(2, "0")
  const minutes = String(date.getMinutes()).padStart(2, "0")
  return `${year}-${month}-${day} ${hours}:${minutes}`
}

// 寄养天数计算
const calcTableFosterDays = (checkIn, checkOut) => {
  if (!checkIn || !checkOut) return 0;
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  const diffMs = end - start;
  if (diffMs <= 0) return 0;
  const diffHours = diffMs / (1000 * 60 * 60);
  return diffHours <= 8 ? 1 : Math.ceil(diffHours / 24);
};

const loadPets = async () => {
  const userInfo = localStorage.getItem("userInfo");
  if (!userInfo) return ElMessage.warning("请先登录");
  try {
    const user = JSON.parse(userInfo);
    const res = await request.get("/pet/list", { params: { userId: user.id } });
    petList.value = (res.data.data || []).map(item => {
      const cleanPetName = item.petName.replace(/\[.*?\]/g, "").trim();
      return { ...item, petName: cleanPetName };
    });
  } catch (error) {
    ElMessage.error("宠物加载失败");
  }
};

// 加载寄养套餐
const loadPackages = async () => {
  try {
    const res = await request.get("/product/list", { params: { categoryId: 9 } });
    packageList.value = res.data.data || [];
  } catch (error) {
    ElMessage.error("套餐加载失败");
  }
};

// 套餐选择自动填充单价
watch(() => form.packageId, (id) => {
  const pkg = packageList.value.find(item => item.id === id);
  form.unitPrice = pkg ? Number(pkg.price) : "";
});

// 计算天数+总费用
function calcFosterDays(checkIn, checkOut) {
  if (!checkIn || !checkOut) return 0;
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  if (end <= start) return 0;
  let totalDays = 1;
  const oneDay = 24 * 60 * 60 * 1000;
  const firstDayEnd = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 1, 0, 0, 0);
  const remainTime = end - firstDayEnd;
  if (remainTime > 0) totalDays += Math.ceil(remainTime / oneDay);
  return totalDays;
}

watch(
  () => [form.checkIn, form.checkOut, form.unitPrice],
  () => {
    const days = calcFosterDays(form.checkIn, form.checkOut);
    fosterDays.value = days;
    form.totalPrice = days * form.unitPrice > 0 ? (days * form.unitPrice).toFixed(2) : "0.00";
  },
  { immediate: true }
);

// 状态颜色
const getStatusColor = (status) => {
  const map = { "待审核": "warning", "已入住": "primary", "已完成": "success", "已拒绝": "danger" };
  return map[status] || "";
};

// 加载寄养记录
const loadMyFosters = async () => {
  try {
    const user = JSON.parse(localStorage.getItem("userInfo"));
    const res = await request.get("/foster/my", { params: { userId: user.id } });
    let list = res.data.data || [];
    list = list.map(item => ({ ...item, fosterDays: calcTableFosterDays(item.checkIn, item.checkOut) }));
    fosterRecordList.value = list;
  } catch (error) {
    ElMessage.error("寄养记录加载失败");
  }
};

// 提交预约
const submit = async () => {
  try {
    await formRef.value.validate();
    submitLoading.value = true;
    const user = JSON.parse(localStorage.getItem("userInfo"));
    const userPhone = user.userPhone || user.phone;
    if (!userPhone) { ElMessage.error("请完善手机号！"); return; }

    await request.post("/foster/add", { 
      ...form, userId: user.id, userPhone, fosterDays: fosterDays.value,
      fosterType: packageList.value.find(p => p.id === form.packageId)?.name || "寄养套餐"
    });
    
    ElMessage.success("预约成功！");
    closeDialog();
    loadMyFosters();
  } catch (error) {
    ElMessage.error("预约失败");
  } finally {
    submitLoading.value = false;
  }
};

// 校验规则
const rules = {
  petId: [{ required: true, message: "请选择宠物", trigger: "change" }],
  checkIn: [{ required: true, message: "请选择入住时间", trigger: "change" }],
  checkOut: [{ required: true, message: "请选择离店时间", trigger: "change" }],
  packageId: [{ required: true, message: "请选择寄养套餐", trigger: "change" }]
};

onMounted(() => { loadPets(); loadPackages(); loadMyFosters(); });
</script>

<style scoped>
.foster-page {
  padding: 40px 20px;
  max-width: 900px;
  margin: 0 auto;
  font-family: "Microsoft Yahei", sans-serif;
  background: #f7f8fa;
  min-height: 100vh;
}
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  border-bottom: 2px solid #e4e7ed;
  padding-bottom: 15px;
}
.page-title {
  margin: 0;
  font-size: 28px;
  font-weight: 600;
  color: #303133;
}
.table-card {
  background: #ffffff;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}
.custom-table {
  width: 100%;
}
.empty-text {
  text-align: center;
  padding: 40px 0;
  color: #909399;
}
.tip-text {
  color: #909399;
  font-size: 12px;
  margin-top: 6px;
}
.price-item {
  font-size: 16px;
  font-weight: 600;
}
.total-price {
  color: #f56c6c;
  font-size: 18px;
  font-weight: 700;
}
.dialog-footer {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}
</style>