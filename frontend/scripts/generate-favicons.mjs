import sharp from 'sharp'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const pub = resolve(__dirname, '../public')

const svg = readFileSync(resolve(pub, 'logo.svg'))

await sharp(svg, { density: 300 }).resize(32, 32).png().toFile(resolve(pub, 'favicon.png'))
console.log('favicon.png (32x32) ✓')

await sharp(svg, { density: 300 }).resize(180, 180).png().toFile(resolve(pub, 'apple-touch-icon.png'))
console.log('apple-touch-icon.png (180x180) ✓')
