
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // 使用相對路徑 base，增加對不同子目錄部署的相容性
  base: './',
  plugins: [react()],
  resolve: {
    alias: {
      '@': '/',
      'path': 'path-browserify'
    }
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    emptyOutDir: true,
    sourcemap: false,
    // 確保不會將 importmap 相關邏輯帶入
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom']
        }
      }
    }
  },
  // 處理可能存在的 process.env 引用問題
  define: {
    'process.env': {}
  }
});
