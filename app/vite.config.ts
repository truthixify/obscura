import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import mkcert from 'vite-plugin-mkcert'
import { nodePolyfills } from 'vite-plugin-node-polyfills'
import { viteStaticCopy } from 'vite-plugin-static-copy'

// https://vite.dev/config/
export default defineConfig({
    plugins: [
        react(),
        mkcert(),

        nodePolyfills({
            globals: {
                Buffer: true,
                global: true,
                process: true
            },
            protocolImports: true
        }),

        viteStaticCopy({
            targets: [
                {
                    src: 'public/main.worker.js',
                    dest: '.'
                }
            ]
        })
    ],

    optimizeDeps: {
        esbuildOptions: {
            define: {
                global: 'globalThis'
            }
        },
        exclude: ['@aztec/bb.js']
    },

    build: {
        rollupOptions: {}
    },

    server: {
        proxy: {}
    }
})
