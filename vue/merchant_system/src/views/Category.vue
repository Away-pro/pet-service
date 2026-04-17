<template>
  <div class="category-pet-card">
    <div class="category-title">
      <h2>📦 商品分类管理</h2>
    </div>
    <el-button type="success" @click="openDialog" round>
      + 新增分类
    </el-button>
    <br /><br />
    <div class="table-card">
      <el-table 
        :data="categories" 
        border 
        stripe 
        header-align="center" 
        align="center"
        :header-cell-style="{background:'#f0f9f0',color:'#279657'}">
        <el-table-column label="序号" type="index" width="80" />
        <el-table-column label="分类ID" prop="id" width="100" />
        <el-table-column label="分类名称" prop="name" />
        <el-table-column label="操作">
          <template #default="scope">
            <el-button size="small" type="primary" @click="edit(scope.row)">编辑</el-button>
            <el-button size="small" type="danger" @click="del(scope.row.id)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
    <el-dialog v-model="visible" :title="form.id ? '编辑分类' : '新增分类'">
      <el-input v-model="form.name" placeholder="请输入分类名称" style="margin: 10px 0" />
      <el-button type="primary" @click="save">确认保存</el-button>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import request from "../utils/request";
import { ElMessage, ElMessageBox } from "element-plus";

const categories = ref([]);
const visible = ref(false);
const form = ref({ id: "", name: "" });

// 获取分类列表
const getList = async () => {
  try {
    const res = await request.get("/category/list");
    
    categories.value = res.data;
  } catch (error) {
    categories.value = [];
  }
};

// 打开弹窗
const openDialog = () => {
  form.value = { id: "", name: "" };
  visible.value = true;
};

// 编辑
const edit = (row) => {
  form.value = { ...row };
  visible.value = true;
};

// 保存
const save = async () => {
  if (!form.value.name) {
    ElMessage.warning("请输入分类名称");
    return;
  }
  try {
    if (form.value.id) {
      await request.put(`/category/update/${form.value.id}`, form.value);
      ElMessage.success("修改成功");
    } else {
      await request.post("/category/add", form.value);
      ElMessage.success("新增成功");
    }
    visible.value = false;
    getList();
  } catch (error) {
    ElMessage.error("操作失败");
  }
};

// 删除
const del = async (id) => {
  try {
    await ElMessageBox.confirm("确定删除？");
    await request.delete(`/category/delete/${id}`);
    ElMessage.success("删除成功");
    getList();
  } catch (error) {
    ElMessage.info("已取消");
  }
};

onMounted(() => {
  getList();
});
</script>

<style scoped>
.category-pet-card {
  padding: 24px;
  background: #f7fff9; 
  min-height: calc(100vh - 150px);
}
.category-title {
  margin-bottom: 20px;
}
.category-title h2 {
  font-size: 22px;
  color: #279657; 
  margin:0;
}
.table-card {
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(39,150,87,0.08);
}
.category-container {
  padding: 20px;
  background: #fff;
  border-radius: 4px;
  min-height: calc(100vh - 150px);
}
</style>