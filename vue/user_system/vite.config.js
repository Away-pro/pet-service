import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      // 头像图片
      '/images': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      // 轮播图
      '/lunbotu': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      // 商品图片
      '/productimages': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      // 3D模型文件
      '/model': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      // 商品视频
      '/productvideo': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      }
    }
  },
  build: {
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    }
  }
})