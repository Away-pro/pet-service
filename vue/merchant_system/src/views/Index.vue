<template>
  <div class="dashboard">
    <h2 class="section-title">数据概览</h2>

    <div class="stat-card-group">
      <div class="stat-card">
        <span class="card-label">今日营收</span>
        <h3 class="card-value">¥1680</h3>
      </div>
      <div class="stat-card">
        <span class="card-label">寄养订单</span>
        <h3 class="card-value">12</h3>
      </div>
      <div class="stat-card">
        <span class="card-label">商品销量</span>
        <h3 class="card-value">36</h3>
      </div>
      <div class="stat-card">
        <span class="card-label">总订单数</span>
        <h3 class="card-value">48</h3>
      </div>
    </div>

    <div class="chart-container">
      <div class="chart-card">
        <h3 class="chart-title">近7日营收趋势</h3>
        <div ref="chart1" class="chart"></div>
      </div>
      <div class="chart-card">
        <h3 class="chart-title">订单类型占比</h3>
        <div ref="chart2" class="chart"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import * as echarts from 'echarts'
const chart1 = ref(null)
const chart2 = ref(null)

onMounted(() => {
  // 营收折线图
  const c1 = echarts.init(chart1.value)
  c1.setOption({
    title: { show: false },
    xAxis: { data: ['1日','2日','3日','4日','5日','6日','7日'] },
    yAxis: { type: 'value' },
    series: [{ data: [320, 430, 510, 620, 880, 1200, 1680], type: 'line' }]
  })

  // 订单类型饼图
  const c2 = echarts.init(chart2.value)
  c2.setOption({
    title: { show: false },
    series: [{
      type: 'pie',
      radius: '60%',
      data: [
        { name: '寄养订单', value: 12 },
        { name: '商品订单', value: 36 }
      ]
    }]
  })
})
</script>

<style scoped>
.dashboard {
  background: #f8f5f0; 
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}

/* 板块标题 */
.section-title {
  color: #d97706; 
  margin-bottom: 20px;
  font-size: 20px;
  font-weight: 600;
}

/* 统计卡片组 */
.stat-card-group {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 20px;
}

.stat-card {
  background: #fffaf0; 
  padding: 20px;
  border-radius: 8px;
  text-align: center;
  color: #6b5b45;
  border: 1px solid #e5e0d8;
}
.card-label {
  font-size: 14px;
  color: #6b5b45;
}
.card-value {
  font-size: 22px;
  font-weight: 600;
  color: #d97706; 
  margin-top: 8px;
}

/* 图表容器 */
.chart-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.chart-card {
  background: #fffaf0; 
  padding: 20px;
  border-radius: 8px;
  border: 1px solid #e5e0d8;
}
.chart-title {
  color: #6b5b45;
  font-size: 16px;
  margin-bottom: 15px;
  text-align: center;
}
.chart {
  height: 400px;
}
</style>