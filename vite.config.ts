
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// 如果你的 GitHub 倉庫名稱是 "my-stock-app"，base 請設定為 "/my-stock-app/"
export default defineConfig({
  plugins: [react()],
  base: './', 
});
