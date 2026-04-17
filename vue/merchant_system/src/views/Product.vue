<template>
  <div class="product-pet-wrap">
    <div class="product-title-bar">
      <h2>🛍️ 宠物商品管理</h2>
    </div>

    <div class="search-box">
      <el-input v-model="searchName" placeholder="搜索商品名称" style="width: 200px; margin-right: 10px" clearable />
      <el-select v-model="searchCategoryId" placeholder="选择商品分类" style="width: 200px; margin-right: 10px" clearable >
        <el-option v-for="item in categoryList" :key="item.id" :label="item.name" :value="item.id || ''" />
      </el-select>
      <el-button @click="getProducts">搜索</el-button>
      <el-button type="primary" @click="openAddDialog" round class="add-btn">
        <el-icon><Plus /></el-icon> 新增商品
      </el-button>
    </div>

    <br />

    <div class="product-table-card">
      <el-table :data="pageList" style="width:100%" border stripe header-align="center" align="center" :header-cell-style="{background:'#f5f0ff',color:'#7E22CE'}" :row-style="{ height: '52px' }" :cell-style="{ padding: '8px 0' }" >
        <el-table-column label="序号" width="55">
          <template #default="scope">{{ (pageNum - 1) * pageSize + scope.$index + 1 }}</template>
        </el-table-column>
        <el-table-column prop="id" label="ID" width="45" />
        <el-table-column label="商品主图" width="82">
          <template #default="scope">
            <img 
              :src="getFirstImage(scope.row.detailImages) || 'https://picsum.photos/seed/pet/60/60'" 
              alt="主图"
              style="width:50px;height:50px;object-fit:cover;border-radius:6px"
            >
          </template>
        </el-table-column>
        <el-table-column prop="name" label="商品名" min-width="95" />
        <el-table-column label="价格" width="70">
          <template #default="scope">
            <div style="color:#ff4d4f">¥{{ scope.row.price }}</div>
            <span style="color:#999;font-size:12px;text-decoration:line-through" v-if="scope.row.originalPrice"> ¥{{ scope.row.originalPrice }} </span>
          </template>
        </el-table-column>
        <el-table-column prop="brand" label="品牌" width="65" />
        <el-table-column prop="origin" label="产地" width="55" />
        <el-table-column prop="stock" label="库存" width="55" />
        <el-table-column label="适用类型" width="82">
          <template #default="scope">
            <el-tag type="info">{{ formatPetType(scope.row.sort) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="70">
          <template #default="scope">
            <el-tag :type="scope.row.status === 'online' ? 'success' : 'danger'"> {{ scope.row.status === 'online' ? '上架' : '下架' }} </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="商品描述" min-width="150" show-overflow-tooltip />
        <el-table-column prop="Category.name" label="所属分类" width="110" />
        <el-table-column label="3D模型" width="85">
          <template #default="scope">
            <el-tag v-if="scope.row.model" type="success">有模型</el-tag>
            <el-tag v-else type="info">无模型</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="160">
          <template #default="scope">
            <el-button type="primary" size="small" @click="openEditDialog(scope.row)">编辑</el-button>
            <el-button type="danger" size="small" @click="deleteProduct(scope.row.id)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <div class="pagination-box">
      <el-pagination v-model:current-page="pageNum" v-model:page-size="pageSize" :total="total" layout="total, prev, pager, next, jumper" background />
    </div>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="750px">
      <el-form ref="formRef" :model="form" :rules="formRules" label-width="110px" style="margin-top:10px">
        <el-form-item label="商品名" prop="name">
          <el-input v-model="form.name" placeholder="请输入商品名" />
        </el-form-item>
        <el-form-item label="售价" prop="price">
          <el-input v-model.number="form.price" type="number" placeholder="售价" />
        </el-form-item>
        <el-form-item label="原价">
          <el-input v-model.number="form.originalPrice" type="number" placeholder="原价（可选）" />
        </el-form-item>
        <el-form-item label="库存" prop="stock">
          <el-input v-model.number="form.stock" type="number" placeholder="库存" />
        </el-form-item>
        <el-form-item label="商品分类" prop="categoryId">
          <el-select v-model="form.categoryId" placeholder="请选择分类"> 
            <el-option v-for="item in categoryList" :key="item.id" :label="item.name" :value="item.id" /> 
          </el-select>
        </el-form-item>
        <el-form-item label="适用类型" prop="sort">
          <el-select v-model.number="form.sort" placeholder="请选择适用宠物类型" clearable>
            <el-option label="通用" :value="0" />
            <el-option label="狗狗" :value="1" />
            <el-option label="猫咪" :value="2" />
            <el-option label="鸟" :value="3" />
            <el-option label="小宠" :value="4" />
          </el-select>
        </el-form-item>

        <!-- 多图上传 -->
        <el-form-item label="商品图片" prop="detailImages">
          <el-upload
            class="image-uploader"
            action="/api/upload/image"
            :multiple="true"
            list-type="picture-card"
            :file-list="imageFileList"
            :on-success="handleImageUploadSuccess"
            :on-remove="handleImageRemove"
            :limit="9"
            :on-exceed="handleExceed"
            accept="image/*"
          >
            <el-icon><Plus /></el-icon>
          </el-upload>
          <div class="upload-tip">最多上传9张，第一张默认主图</div>
        </el-form-item>

        <!-- 3D模型上传 -->
        <el-form-item label="3D模型">
          <el-upload
            class="model-uploader"
            action="/api/upload/model"
            :show-file-list="false"
            :on-success="handleModelUploadSuccess"
            accept=".glb,.gltf"
          >
            <el-button size="small" type="primary">点击上传3D模型</el-button>
          </el-upload>
          <div v-if="form.model" class="model-tip">
            已上传模型：<span style="color:#666">{{ form.model }}</span>
            <el-button type="danger" size="small" text @click="clearModel">删除模型</el-button>
          </div>
          <div v-else class="model-tip">支持.glb/.gltf格式，可选上传</div>
        </el-form-item>

        <el-form-item label="品牌"><el-input v-model="form.brand" placeholder="品牌" /></el-form-item>
        <el-form-item label="产地"><el-input v-model="form.origin" placeholder="产地" /></el-form-item>
        <el-form-item label="规格"><el-input v-model="form.spec" placeholder="规格" /></el-form-item>
        <el-form-item label="单位"><el-input v-model="form.unit" placeholder="件/个/袋" /></el-form-item>
        <el-form-item label="上架状态">
          <el-select v-model="form.status"> 
            <el-option label="上架" value="online" /> 
            <el-option label="下架" value="offline" /> 
          </el-select>
        </el-form-item>
        <el-form-item label="商品描述" prop="description">
          <el-input v-model="form.description" type="textarea" :rows="3" placeholder="请输入商品描述" />
        </el-form-item>
      </el-form>

      <div style="text-align:right; margin-top:20px">
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveProduct">提交</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue"
import request from "../utils/request"
import { ElMessage, ElMessageBox } from "element-plus"
import { Plus } from "@element-plus/icons-vue"

const products = ref([])
const categoryList = ref([])
const searchName = ref("")
const searchCategoryId = ref("")
const pageNum = ref(1)
const pageSize = ref(8)
const total = computed(() => filterList.value.length)

const dialogVisible = ref(false)
const dialogTitle = ref("新增商品")
const formRef = ref(null)
const imageFileList = ref([])

const petTypeMap = {
  0: "通用",
  1: "狗狗",
  2: "猫咪",
  3: "鸟",
  4: "小宠"
}

const form = ref({
  id: "", name: "", price: null, originalPrice: null, stock: null, description: "", categoryId: "",
  detailImages: "", model: "", status: "online", sort: 0,
  brand: "", origin: "", spec: "", unit: "件"
})

const formRules = {
  name: [{ required: true, message: "请输入商品名称", trigger: "blur" }],
  price: [
    { required: true, message: "请输入售价", trigger: "blur" },
    { 
      validator: (rule, value, callback) => {
        if (value === null || isNaN(Number(value)) || Number(value) <= 0) {
          callback(new Error("售价必须为大于0的有效数字"));
        } else {
          callback();
        }
      }, 
      trigger: "blur" 
    }
  ],
  stock: [
    { required: true, message: "请输入库存", trigger: "blur" },
    { 
      validator: (rule, value, callback) => {
        if (value === null || isNaN(Number(value)) || Number(value) < 0) {
          callback(new Error("库存必须为非负有效数字"));
        } else {
          callback();
        }
      }, 
      trigger: "blur" 
    }
  ],
  categoryId: [{ required: true, message: "请选择商品分类", trigger: "change" }],
  description: [{ required: true, message: "请输入商品描述", trigger: "blur" }],
  sort: [{ required: true, message: "请选择适用宠物类型", trigger: "change" }],
  detailImages: [
    { required: true, message: "请至少上传1张商品图片", trigger: "change" }
  ]
}

const filterList = computed(() => {
  let arr = [...products.value]
  if (searchName.value) arr = arr.filter(i => i.name.includes(searchName.value))
  if (searchCategoryId.value) arr = arr.filter(i => i.categoryId == searchCategoryId.value)
  return arr
})
const pageList = computed(() => {
  const start = (pageNum.value - 1) * pageSize.value
  return filterList.value.slice(start, start + pageSize.value)
})

// 获取第一张图作为主图
const getFirstImage = (detailImagesStr) => {
  if (!detailImagesStr) return null;
  const urls = detailImagesStr.split(',').filter(url => url.trim());
  return urls[0] || null;
}

const formatPetType = (sortVal) => {
  return petTypeMap[sortVal] || "通用"
}

// 多图上传
const handleImageUploadSuccess = (response, file, fileList) => {
  const urls = fileList.map(item => item.response?.url).filter(url => url?.trim());
  form.value.detailImages = urls.join(',');
  imageFileList.value = fileList;
  ElMessage.success("图片上传成功！");
}
const handleImageRemove = (file, fileList) => {
  const urls = fileList.map(item => item.response?.url).filter(url => url?.trim());
  form.value.detailImages = urls.join(',');
  imageFileList.value = fileList;
}
const handleExceed = () => {
  ElMessage.warning("最多只能上传9张图片！");
}

// 3D模型上传
const handleModelUploadSuccess = (response, file) => {
  form.value.model = response.url;
  ElMessage.success("3D模型上传成功！");
}
const clearModel = () => {
  form.value.model = "";
  ElMessage.success("模型已删除！");
}

const getCategoryList = async () => {
  try { const res = await request.get("/category/list"); categoryList.value = res.data || [] } catch (e) { ElMessage.error("分类加载失败") }
}
const getProducts = async () => {
  try { const res = await request.get("/product/list"); products.value = res.data || [] } catch (e) { ElMessage.error("商品加载失败") }
}

const openAddDialog = () => {
  dialogTitle.value = "新增商品"
  form.value = { 
    id: "", name: "", price: null, originalPrice: null, stock: null, description: "", categoryId: "", 
    detailImages: "", model: "", status: "online", sort: 0,
    brand: "", origin: "", spec: "", unit: "件" 
  }
  imageFileList.value = [];
  dialogVisible.value = true
}

const openEditDialog = (row) => {
  dialogTitle.value = "编辑商品"
  form.value = { ...row }
  if (row.detailImages) {
    const urls = row.detailImages.split(',').filter(url => url.trim());
    imageFileList.value = urls.map(url => ({
      name: url.split('/').pop(),
      url: url,
      response: { url: url }
    }));
  } else {
    imageFileList.value = [];
  }
  dialogVisible.value = true
}

const saveProduct = async () => {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  try {
    const data = { 
      ...form.value, 
      price: Number(form.value.price), 
      originalPrice: form.value.originalPrice ? Number(form.value.originalPrice) : null, 
      stock: Number(form.value.stock), 
      categoryId: Number(form.value.categoryId),
      sort: Number(form.value.sort)
    }
    if (!form.value.id) delete data.id;
    
    if (form.value.id) {
      await request.put(`/product/update/${form.value.id}`, data);
      ElMessage.success("编辑成功！");
    } else {
      await request.post("/product/add", data);
      ElMessage.success("新增成功！");
    }
    dialogVisible.value = false;
    getProducts();
  } catch (e) { 
    console.error(e);
    ElMessage.error("操作失败！"); 
  }
}

const deleteProduct = async (id) => {
  try { 
    await ElMessageBox.confirm("确认删除？"); 
    await request.delete(`/product/delete/${id}`); 
    ElMessage.success("删除成功！"); 
    getProducts();
  } catch (e) { 
    ElMessage.info("已取消");
  }
}

onMounted(() => { 
  getCategoryList(); 
  getProducts();
})
</script>

<style scoped>
.product-pet-wrap { padding: 24px; background: #f8f5ff; min-height: calc(100vh - 150px); }
.product-title-bar { margin-bottom: 20px; }
.product-title-bar h2 { font-size: 22px; color: #7E22CE; margin: 0; }
.search-box { margin-bottom: 15px; }
.add-btn { background: linear-gradient(135deg, #7E22CE 0%, #9333EA 100%); border:none; }
.product-table-card { background: #fff; border-radius: 12px; padding: 16px; box-shadow: 0 2px 10px rgba(126,34,206,0.08); }
:deep(.el-table) { border-radius: 8px; overflow: hidden; }
:deep(.el-table__row:hover) { background: #faf5ff !important; }
.pagination-box { text-align: center; margin-top: 25px; }

.image-uploader :deep(.el-upload--picture-card) {
  width: 88px;
  height: 88px;
  line-height: 88px;
}
.upload-tip {
  font-size: 12px;
  color: #999;
  margin-top: 8px;
}
.model-tip {
  font-size: 12px;
  color: #666;
  margin-top: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>