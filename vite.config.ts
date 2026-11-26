import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// 浏览器测试配置目录中可能包含被锁定的文件，无需参与源码监听。
export default defineConfig({ base: './', plugins: [react()], server: { watch: { ignored: ['**/.edge*/**', '**/.firefox*/**', '**/.step03*/**'] } } })
