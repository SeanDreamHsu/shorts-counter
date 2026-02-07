import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
    build: {
        emptyOutDir: false, // Critical: Don't wipe the main build
        outDir: 'dist',
        lib: {
            entry: resolve(__dirname, 'src/content/index.ts'),
            name: 'ContentScript',
            formats: ['iife'],
            fileName: () => 'src/content.js',
        },
        rollupOptions: {
            output: {
                extend: true,
            },
        },
    },
    define: {
        'process.env.NODE_ENV': '"production"',
    }
})
