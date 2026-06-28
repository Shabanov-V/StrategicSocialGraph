import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
  test: {
    globals: true,
    environment: 'node',
    // unit/component tests live in src; e2e/ is Playwright's (different runner).
    include: ['src/**/*.{test,spec}.{js,jsx,ts,tsx}'],
  },
})
