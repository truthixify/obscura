import fs from 'fs'
import path from 'path'

const src = path.resolve('node_modules/@aztec/bb.js/dest/browser/main.worker.js')
const dest = path.resolve('public/main.worker.js')

if (!fs.existsSync(src)) {
    throw new Error(`Worker file missing: ${src}`)
}

fs.copyFileSync(src, dest)
console.log('Copied worker file to', dest)
