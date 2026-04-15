import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes('node_modules/react-dom') || id.includes('node_modules/react/')) {
            return 'vendor-react'
          }
          if (id.includes('node_modules/@tiptap') || id.includes('node_modules/prosemirror')) {
            return 'vendor-tiptap'
          }
          if (id.includes('node_modules/lowlight') || id.includes('node_modules/highlight.js')) {
            return 'vendor-highlight'
          }
          if (id.includes('node_modules/unified') || id.includes('node_modules/remark') || id.includes('node_modules/mdast') || id.includes('node_modules/micromark')) {
            return 'vendor-remark'
          }
        },
      },
    },
  },
})
