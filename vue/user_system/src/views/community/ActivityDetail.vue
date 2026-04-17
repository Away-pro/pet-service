<template>
  <div class="activity-detail page">
    <div class="card">
      <!-- 加载状态 -->
      <el-skeleton v-if="loading" animated rows="5" />

      <!-- 活动内容 -->
      <div v-else-if="Object.keys(activity).length > 0">
        <div class="header">
          <h2 class="title">{{ activity.title }}</h2>
          <el-tag :type="activity.status === 1 ? 'success' : 'danger'" size="large">
            {{ activity.status === 1 ? "进行中" : "已结束" }}
          </el-tag>
        </div>

        <div class="info">
          <p><strong>活动ID：</strong>{{ activity.id }}</p>
          <p><strong>创建时间：</strong>{{ formatTime(activity.createdAt) }}</p>
          <div class="content-box">
            <strong>活动内容：</strong>
            <p class="content">{{ activity.content }}</p>
          </div>
        </div>

        <div class="action">
          <el-button type="primary" @click="$router.back()">
            <i class="el-icon-arrow-left"></i> 返回上一页
          </el-button>
        </div>
      </div>

      <!-- 无数据/错误 -->
      <div v-else class="empty-box">
        <p>活动不存在或已删除</p>
        <el-button type="primary" @click="$router.back()">返回</el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRoute } from "vue-router";
import axios from "axios";
import { ElMessage } from "element-plus";

const route = useRoute();
const activity = ref({});
const loading = ref(true);

// 获取活动详情
const getActivityDetail = async () => {
  try {
    loading.value = true;
    const res = await axios.get(`/api/community/activity/detail/${route.params.id}`);
    if (res.data.code === 200) {
      activity.value = res.data.data || {};
    } else {
      ElMessage.warning(res.data.msg || "获取活动失败");
    }
  } catch (err) {
    ElMessage.error("网络异常");
    console.error(err);
  } finally {
    loading.value = false;
  }
};

// 时间格式化
const formatTime = (time) => {
  if (!time) return "-";
  return new Date(time).toLocaleString("zh-CN");
};

onMounted(() => {
  getActivityDetail();
});
</script>

<style scoped>
.page {
  max-width: 900px;
  margin: 30px auto;
  padding: 0 20px;
}
.card {
  background: #fff;
  padding: 35px;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.08);
}
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
}
.title {
  margin: 0;
  font-size: 24px;
  color: #333;
}
.info p {
  font-size: 15px;
  color: #666;
  margin: 12px 0;
}
.content-box {
  margin: 20px 0;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
}
.content {
  line-height: 1.8;
  color: #444;
}
.action {
  margin-top: 30px;
}
.empty-box {
  text-align: center;
  padding: 40px 0;
  color: #999;
}
</style>