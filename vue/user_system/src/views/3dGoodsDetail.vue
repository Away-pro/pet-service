<template>
  <div class="three-d-detail-page">
    <div class="bg-glow-1"></div>
    <div class="bg-glow-2"></div>
    <div class="content-wrapper">
      <div class="info-panel">
        <div class="back-badge" @click="$router.back()">
          <el-icon><ArrowLeft /></el-icon>
          <span>返回</span>
        </div>
        <h1 class="title">{{ goodsInfo.name || '智能猫厕所' }}</h1>
        <div class="price-section">
          <span class="price-symbol">¥</span>
          <span class="price-value">{{ extractPrice(goodsInfo.price) }}</span>
          <span class="price-unit">起</span>
          <span class="hot-badge" v-if="goodsInfo.hot">🔥 新品热卖</span>
        </div>
        <div class="attributes-grid">
          <div class="attr-item">
            <span class="attr-icon">🏷️</span>
            <div class="attr-content">
              <span class="attr-label">品牌</span>
              <span class="attr-value">{{ goodsInfo.brand || 'Homerun' }}</span>
            </div>
          </div>
          <div class="attr-item">
            <span class="attr-icon">🐾</span>
            <div class="attr-content">
              <span class="attr-label">适用宠物</span>
              <span class="attr-value">{{ goodsInfo.pet || '通用' }}</span>
            </div>
          </div>
          <div class="attr-item">
            <span class="attr-icon">📍</span>
            <div class="attr-content">
              <span class="attr-label">产地</span>
              <span class="attr-value">{{ goodsInfo.origin || '中国大陆' }}</span>
            </div>
          </div>
          <div class="attr-item">
            <span class="attr-icon">🚚</span>
            <div class="attr-content">
              <span class="attr-label">配送</span>
              <span class="attr-value">全国包邮</span>
            </div>
          </div>
        </div>
        <div class="feature-tags">
          <span v-for="tag in features" :key="tag" class="tag">{{ tag }}</span>
        </div>
        <div class="trust-badges">
          <span>✓ 正品保障</span>
          <span>✓ 七天无理由</span>
          <span>✓ 赠护理液</span>
        </div>
        <div class="action-section">
          <button class="buy-btn" @click="goToBuy">
            <span>立即购买</span>
            <svg class="btn-arrow" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
          <div class="action-hint">
            <span class="hint-icon">🖱️</span>
            <span>鼠标拖拽旋转视角 · 滚动缩放</span>
          </div>
        </div>
      </div>
      <div class="model-stage">
        <div class="model-container" ref="containerRef">
          <canvas ref="canvasRef"></canvas>
          <div class="color-picker-inside">
            <div class="color-options-horizontal">
              <div v-for="color in colors" :key="color.value" class="color-option-horizontal"
                   :class="{ active: currentColor === color.value }"
                   @click="changeColor(color.value)">
                <div class="color-swatch" 
                     :class="{ 'texture-swatch': color.value === 'original' }"
                     :style="color.value !== 'original' ? { backgroundColor: color.value } : {}">
                  <span v-if="color.value === 'original'" class="texture-icon">🎨</span>
                </div>
                <span class="color-label">{{ color.label }}</span>
              </div>
            </div>
          </div>
          <div class="rotate-hint" :class="{ 'hint-hidden': hintHidden }">
            <div class="hint-content">
              <svg class="rotate-icon" viewBox="0 0 24 24" width="24" height="24">
                <path fill="currentColor" d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z"/>
              </svg>
              <span>360° 旋转查看</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { ElMessage } from 'element-plus'
import { ArrowLeft } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()

const goodsInfo = ref({})
const features = ref([])
const colors = ref([
  { label: "原始纹理", value: "original" },
  { label: "原木色", value: "#d4b886" },
  { label: "深胡桃", value: "#8b5a2b" },
  { label: "奶白色", value: "#f5f5f5" },
  { label: "靓紫色", value: "#c4a7c7" }
])
const currentColor = ref("original")
const hintHidden = ref(false)

let scene, camera, renderer, model, controls, animationId
const canvasRef = ref(null)
const containerRef = ref(null)

const originalMaterialsMap = new Map()

const extractPrice = (price) => {
  if (!price) return '329'
  const match = String(price).match(/\d+/)
  return match ? match[0] : '329'
}

const disposeMaterial = (material) => {
  if (!material) return
  if (Array.isArray(material)) {
    material.forEach(m => disposeMaterial(m))
    return
  }
  if (material.map) material.map.dispose()
  if (material.aoMap) material.aoMap.dispose()
  if (material.normalMap) material.normalMap.dispose()
  if (material.roughnessMap) material.roughnessMap.dispose()
  if (material.metalnessMap) material.metalnessMap.dispose()
  if (material.emissiveMap) material.emissiveMap.dispose()
  material.dispose()
}

const disposeModel = () => {
  if (!model) return
  model.traverse((child) => {
    if (child.isMesh) {
      if (child.geometry) child.geometry.dispose()
      if (child.material) disposeMaterial(child.material)
    }
  })
  if (model.parent) model.parent.remove(model)
  model = null
  originalMaterialsMap.clear()
}

const disposeAll = () => {
  cancelAnimationFrame(animationId)
  animationId = null
  disposeModel()
  if (controls) controls.dispose()
  if (renderer) renderer.dispose()
  if (scene) scene.clear()
  scene = camera = renderer = controls = null
}

setTimeout(() => { hintHidden.value = true }, 5000)

onMounted(async () => {
  try {
    const itemStr = decodeURIComponent(route.query.item)
    goodsInfo.value = JSON.parse(itemStr)
    features.value = goodsInfo.value?.description
      ? [goodsInfo.value.description]
      : ["自动铲屎", "一键清理", "防外溅设计", "智能补砂"]
    await nextTick()
    initThree()
    loadModel()
    window.addEventListener('resize', onWindowResize)
  } catch (e) {
    ElMessage.error('商品数据加载失败')
  }
})

onUnmounted(() => {
  window.removeEventListener('resize', onWindowResize)
  disposeAll()
})

function initThree() {
  const container = containerRef.value
  const canvas = canvasRef.value
  if (!container || !canvas) return

  scene = new THREE.Scene()
  scene.background = new THREE.Color(0x3a2a1a)
  scene.fog = new THREE.FogExp2(0x3a2a1a, 0.008)

  const width = container.clientWidth
  const height = container.clientHeight
  camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000)
  camera.position.set(2, 1.5, 3)

  renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
  renderer.setSize(width, height)
  renderer.setPixelRatio(window.devicePixelRatio)
  renderer.shadowMap.enabled = true

  // 光照增强，让模型更亮
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.65)
  scene.add(ambientLight)
  const mainLight = new THREE.DirectionalLight(0xffffff, 1.4)
  mainLight.position.set(5, 10, 7)
  mainLight.castShadow = true
  scene.add(mainLight)
  const backLight = new THREE.DirectionalLight(0xccccff, 0.6)
  backLight.position.set(-3, 2, -4)
  scene.add(backLight)
  const fillLight = new THREE.PointLight(0xaaccff, 0.5)
  fillLight.position.set(3, 1, 2)
  scene.add(fillLight)
  const bottomLight = new THREE.PointLight(0x88aaff, 0.4)
  bottomLight.position.set(0, -2, 0)
  scene.add(bottomLight)

  const groundPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(8, 8),
    new THREE.ShadowMaterial({ opacity: 0.3, color: 0x000000, transparent: true, side: THREE.DoubleSide })
  )
  groundPlane.rotation.x = -Math.PI / 2
  groundPlane.position.y = -1.2
  groundPlane.receiveShadow = true
  scene.add(groundPlane)

  controls = new OrbitControls(camera, renderer.domElement)
  controls.target.set(0, 0.5, 0)
  controls.enableZoom = true
  controls.enablePan = false
  controls.enableDamping = true
  controls.zoomSpeed = 1.2
  controls.rotateSpeed = 1.0
  controls.minDistance = 1.5
  controls.maxDistance = 8
  controls.autoRotate = true
  controls.autoRotateSpeed = 1.5

  let autoRotateTimeout
  controls.addEventListener('start', () => {
    controls.autoRotate = false
    clearTimeout(autoRotateTimeout)
  })
  controls.addEventListener('end', () => {
    autoRotateTimeout = setTimeout(() => { controls.autoRotate = true }, 3000)
  })
  controls.update()
  animate()
}

function loadModel() {
  const modelUrl = goodsInfo.value.model
  if (!modelUrl) {
    ElMessage.error('该商品暂无3D模型')
    return
  }
  disposeModel()
  const loader = new GLTFLoader()
  loader.load(modelUrl, (gltf) => {
    model = gltf.scene
    model.traverse(child => {
      if (child.isMesh) {
        child.castShadow = true
        if (child.material) {
          const originalMat = child.material.clone()
          originalMaterialsMap.set(child, originalMat)
          child.userData.originalMaterial = originalMat
          child.material = originalMat.clone()
        }
      }
    })
    const box = new THREE.Box3().setFromObject(model)
    const size = box.getSize(new THREE.Vector3())
    const center = box.getCenter(new THREE.Vector3())
    const maxSize = Math.max(size.x, size.y, size.z)
    const scale = 2.5 / maxSize
    model.scale.set(scale, scale, scale)
    model.position.set(-center.x * scale, -center.y * scale + 0.2, -center.z * scale)
    scene.add(model)
    ElMessage.success('3D模型加载成功')
    if (controls) controls.target.set(0, 0.5, 0)
  }, null, (err) => {
    ElMessage.error('模型加载失败')
  })
}

function animate() {
  animationId = requestAnimationFrame(animate)
  if (controls) controls.update()
  if (renderer && scene && camera) renderer.render(scene, camera)
}

function onWindowResize() {
  if (!camera || !renderer) return
  const container = containerRef.value
  if (!container) return
  const w = container.clientWidth
  const h = container.clientHeight
  camera.aspect = w / h
  camera.updateProjectionMatrix()
  renderer.setSize(w, h)
}

function changeColor(color) {
  if (!model) return
  currentColor.value = color

  model.traverse(child => {
    if (!child.isMesh) return
    const originalMat = originalMaterialsMap.get(child)
    if (!originalMat) return

    if (child.material) disposeMaterial(child.material)

    if (color === 'original') {
      child.material = originalMat.clone()
    } else {
      const newMat = originalMat.clone()
      if (newMat.color) newMat.color.set(color)
      child.material = newMat
    }
    child.material.needsUpdate = true
  })
}

const goToBuy = () => ElMessage.success('跳转至购买页面')
</script>

<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

/* 全局字体 */
.three-d-detail-page {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, sans-serif;
  min-height: 100vh;
  background: linear-gradient(145deg, #FFF9F0 0%, #FFEFE0 100%);
  position: relative;
  overflow-x: hidden;
  padding-bottom: 200px;
}

/* 背景光晕 */
.bg-glow-1, .bg-glow-2 {
  position: fixed;
  width: 60vw;
  height: 60vw;
  border-radius: 50%;
  filter: blur(100px);
  opacity: 0.3;
  z-index: 0;
  pointer-events: none;
}
.bg-glow-1 { background: #FFB347; top: -20vh; right: -10vw; }
.bg-glow-2 { background: #FFD966; bottom: -20vh; left: -10vw; }

.content-wrapper {
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  gap: 2.5rem;
  padding: 2rem 2rem 0 2rem;
  position: relative;
  z-index: 2;
}

/* 左侧信息面板 - 高级毛玻璃 */
.info-panel {
  flex: 1.2;
  min-width: 340px;
  background: rgba(255, 250, 240, 0.85);
  backdrop-filter: blur(20px);
  border-radius: 40px;
  padding: 2rem 2rem 2rem 2rem;
  box-shadow: 0 20px 35px -12px rgba(0, 0, 0, 0.1), 0 1px 1px rgba(255, 255, 255, 0.6) inset;
  border: 1px solid rgba(255, 255, 245, 0.9);
  transition: transform 0.3s ease;
}

.back-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: rgba(230, 126, 34, 0.12);
  backdrop-filter: blur(4px);
  padding: 6px 16px;
  border-radius: 40px;
  font-size: 0.85rem;
  font-weight: 500;
  color: #c95a0f;
  border: 1px solid rgba(230, 126, 34, 0.2);
  cursor: pointer;
  width: fit-content;
  margin-bottom: 1.8rem;
  transition: all 0.2s;
}
.back-badge:hover {
  background: rgba(230, 126, 34, 0.2);
  transform: translateX(-4px);
}

.title {
  font-size: 2.5rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  background: linear-gradient(135deg, #3a2a1a, #b45a2a);
  background-clip: text;
  -webkit-background-clip: text;
  color: transparent;
  margin-bottom: 1rem;
  line-height: 1.2;
}

.price-section {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 1.8rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}
.price-symbol {
  font-size: 1.4rem;
  font-weight: 600;
  color: #e67e22;
}
.price-value {
  font-size: 3.2rem;
  font-weight: 800;
  color: #e67e22;
  line-height: 1;
}
.price-unit {
  font-size: 1rem;
  color: #a77b4f;
  margin-left: 2px;
}
.hot-badge {
  background: linear-gradient(135deg, #ffe0b5, #ffc48a);
  color: #b45f1b;
  padding: 4px 12px;
  border-radius: 40px;
  font-size: 0.7rem;
  font-weight: 600;
  margin-left: 12px;
}

.attributes-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-bottom: 1.8rem;
}
.attr-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 20px;
  border: 1px solid rgba(0, 0, 0, 0.02);
}
.attr-icon { font-size: 1.2rem; }
.attr-content { display: flex; flex-direction: column; }
.attr-label {
  font-size: 0.7rem;
  color: #a77b4f;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.attr-value {
  font-size: 0.85rem;
  font-weight: 600;
  color: #2c2418;
}

.feature-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 1.5rem;
}
.tag {
  background: rgba(0, 0, 0, 0.04);
  padding: 5px 14px;
  border-radius: 40px;
  font-size: 0.75rem;
  font-weight: 500;
  color: #5a4532;
}

.trust-badges {
  display: flex;
  gap: 20px;
  margin-bottom: 1.8rem;
  font-size: 0.7rem;
  color: #a77b4f;
  background: rgba(255, 255, 240, 0.5);
  padding: 8px 12px;
  border-radius: 40px;
  justify-content: center;
}

.action-section {
  margin-top: auto;
}
.buy-btn {
  width: 100%;
  background: linear-gradient(135deg, #ff9f4a, #ff7a2f);
  border: none;
  padding: 1rem;
  border-radius: 60px;
  color: white;
  font-size: 1.1rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  cursor: pointer;
  transition: all 0.25s ease;
  box-shadow: 0 8px 20px rgba(255, 122, 47, 0.3);
}
.buy-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 28px rgba(255, 122, 47, 0.4);
}
.btn-arrow {
  transition: transform 0.2s;
}
.buy-btn:hover .btn-arrow {
  transform: translateX(4px);
}

.action-hint {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 1rem;
  font-size: 0.7rem;
  color: #b89a7a;
}

/* 右侧3D舞台 */
.model-stage {
  flex: 1.5;
  min-width: 450px;
}
.model-container {
  position: relative;
  width: 100%;
  height: 70vh;
  min-height: 500px;
  border-radius: 40px;
  overflow: hidden;
  background: radial-gradient(ellipse at center, #5a4532 0%, #2a1f15 100%);
  box-shadow: 0 30px 45px -20px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05);
}
canvas {
  width: 100%;
  height: 100%;
  display: block;
}

/* 颜色选择器 - 融入3D容器顶部 */
.color-picker-inside {
  position: absolute;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: transparent;
  backdrop-filter: none;
  border-radius: 60px;
  padding: 4px 12px;
  border: none;
  box-shadow: none;
  z-index: 20;
  white-space: nowrap;
}

.color-options-horizontal {
  display: flex;
  gap: 20px;
  align-items: center;
}

.color-option-horizontal {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  padding: 6px 10px;
  border-radius: 60px;
}

.color-option-horizontal:hover {
  background: rgba(255, 255, 255, 0.12);
  transform: translateY(-2px);
}

.color-option-horizontal.active {
  background: rgba(230, 126, 34, 0.35);
}

.color-swatch {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.95);
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.2), 0 2px 6px rgba(0, 0, 0, 0.2);
  transition: all 0.2s ease;
}

.color-option-horizontal.active .color-swatch {
  border-color: #ff9f4a;
  transform: scale(1.05);
  box-shadow: 0 0 0 2px rgba(255, 159, 74, 0.6);
}

.texture-swatch {
  background: conic-gradient(#d4b886, #8b5a2b, #f5f5f5, #c4a7c7);
  display: flex;
  align-items: center;
  justify-content: center;
}

.texture-icon {
  font-size: 20px;
  filter: drop-shadow(0 1px 1px rgba(0,0,0,0.3));
}

.color-label {
  font-size: 0.7rem;
  font-weight: 600;
  color: rgba(255, 245, 230, 0.9);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
  letter-spacing: 0.3px;
}

.rotate-hint {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(8px);
  padding: 6px 16px;
  border-radius: 60px;
  transition: opacity 0.4s;
  pointer-events: none;
  z-index: 10;
}
.rotate-hint.hint-hidden {
  opacity: 0;
  visibility: hidden;
}
.hint-content {
  display: flex;
  align-items: center;
  gap: 8px;
  color: rgba(255, 245, 230, 0.9);
  font-size: 0.7rem;
}
.rotate-icon {
  animation: rotateHint 1.5s ease-in-out infinite;
}
@keyframes rotateHint {
  0%, 100% { transform: rotate(0deg); }
  50% { transform: rotate(30deg); }
}

/* 响应式 */
@media (max-width: 1200px) {
  .content-wrapper { gap: 1.8rem; padding: 1.5rem 1.5rem 0; }
  .info-panel { min-width: 300px; padding: 1.5rem; }
  .title { font-size: 2rem; }
  .price-value { font-size: 2.8rem; }
  .color-options-horizontal { gap: 16px; }
  .color-swatch { width: 34px; height: 34px; }
}

@media (max-width: 900px) {
  .content-wrapper { flex-direction: column; }
  .info-panel { min-width: auto; margin-bottom: 1.5rem; }
  .model-stage { min-width: auto; }
  .model-container { height: 55vh; min-height: 400px; }
  .color-picker-inside { top: 12px; padding: 2px 8px; }
  .color-options-horizontal { gap: 12px; }
  .color-swatch { width: 30px; height: 30px; }
  .color-label { font-size: 0.55rem; }
}
</style>