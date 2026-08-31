/**
 * シード用の画像を生成する。実行は任意（生成物は server/public/images に commit 済み）。
 *   pnpm --filter server images
 * SVG を組み立てて macOS の qlmanage で PNG 化し、sips で JPEG に落とす。
 */
import { execFileSync } from 'node:child_process'
import { mkdirSync, readdirSync, renameSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { SEED_USERS } from '../src/db/seed-data'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const OUT = join(ROOT, 'public/images')
const TMP = join(ROOT, '.image-build')

/** 推しごとのテーマ色。seed.ts の OSHI と同じ順・同じ名前で対応させる。 */
export const THEMES = [
  { key: 'hoshifuri', name: '星降ハーモニクス', a: '#2b1055', b: '#7b5ce0', c: '#ffd166', ink: '#ffffff' },
  { key: 'melty', name: 'MELTY CIRCUS', a: '#3d0b3d', b: '#ff5fa2', c: '#ffe0f0', ink: '#ffffff' },
  { key: 'aoiro', name: '藍色スペクトル', a: '#04263f', b: '#2f9fd0', c: '#c8f5ff', ink: '#ffffff' },
  { key: 'karen', name: '花蓮ロジック', a: '#4a1020', b: '#e0607a', c: '#ffd9c0', ink: '#ffffff' },
  { key: 'nocturne', name: 'NOCTURNE9', a: '#101425', b: '#4a5b9e', c: '#9ad7ff', ink: '#ffffff' },
  { key: 'citruspop', name: 'シトラスポップ', a: '#5a3a05', b: '#ffa62b', c: '#fff2b8', ink: '#ffffff' },
  { key: 'lumina', name: 'Lumina Bell', a: '#22124a', b: '#9d7bff', c: '#e6dcff', ink: '#ffffff' },
  { key: 'kagerou', name: '陽炎アンサンブル', a: '#3b1a06', b: '#d96e3a', c: '#ffd7ae', ink: '#ffffff' },
  { key: 'mintlab', name: 'ミントラボ', a: '#04352c', b: '#2ec4a0', c: '#d3fff2', ink: '#ffffff' },
  { key: 'ruri', name: '瑠璃ノ雫', a: '#161a3f', b: '#5566d6', c: '#bfe3ff', ink: '#ffffff' },
] as const

export type Theme = (typeof THEMES)[number]

/** 決定的な擬似乱数。seed を固定して毎回同じ絵を出す。 */
function rng(seed: number) {
  let s = seed >>> 0
  return () => {
    s = (s + 0x6d2b79f5) >>> 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const S = 900
const FONT = 'Hiragino Sans, Hiragino Kaku Gothic ProN, sans-serif'

const defs = (t: Theme) => `
<defs>
  <linearGradient id="bg" x1="0" y1="0" x2="0.6" y2="1">
    <stop offset="0" stop-color="${t.a}"/><stop offset="1" stop-color="${t.b}"/>
  </linearGradient>
  <radialGradient id="glow"><stop offset="0" stop-color="${t.c}" stop-opacity="0.95"/><stop offset="1" stop-color="${t.c}" stop-opacity="0"/></radialGradient>
  <linearGradient id="holo" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#ffffff" stop-opacity="0.45"/>
    <stop offset="0.45" stop-color="${t.c}" stop-opacity="0.2"/>
    <stop offset="1" stop-color="#ffffff" stop-opacity="0.45"/>
  </linearGradient>
</defs>`

function sparkles(
  rand: () => number,
  n: number,
  color: string,
  avoid?: { x: number; y: number; r: number },
) {
  let out = ''
  for (let i = 0; i < n; i++) {
    let x = rand() * S
    let y = rand() * S
    let guard = 0
    while (avoid && Math.hypot(x - avoid.x, y - avoid.y) < avoid.r && guard++ < 24) {
      x = rand() * S
      y = rand() * S
    }
    const r = 2 + rand() * 5
    out += `<path d="M${x} ${y - r * 3}L${x + r} ${y}L${x} ${y + r * 3}L${x - r} ${y}Z" fill="${color}" opacity="${0.35 + rand() * 0.5}"/>`
  }
  return out
}

function title(t: Theme, sub: string) {
  return `
<text x="64" y="${S - 108}" font-family="${FONT}" font-size="62" font-weight="700" fill="${t.ink}">${t.name}</text>
<text x="66" y="${S - 56}" font-family="${FONT}" font-size="28" letter-spacing="4" fill="${t.ink}" opacity="0.82">${sub}</text>`
}

/** 人物は描かず、シルエットとグッズで推し活の場面を作る。 */
const TEMPLATES: Record<string, (t: Theme, rand: () => number) => string> = {
  stage: (t, rand) => {
    let beams = ''
    for (let i = 0; i < 6; i++) {
      const x = 120 + i * 130 + rand() * 40
      beams += `<polygon points="450,-60 ${x - 55},900 ${x + 55},900" fill="${t.c}" opacity="${0.06 + rand() * 0.09}"/>`
    }
    let crowd = ''
    for (let i = 0; i < 34; i++) {
      const x = 10 + (i % 17) * 54 + (i > 16 ? 26 : 0)
      const y = 782 + (i > 16 ? 34 : 0)
      crowd += `<circle cx="${x}" cy="${y}" r="21" fill="#000" opacity="0.55"/>`
      crowd += `<rect x="${x + 14}" y="${y - 74}" width="7" height="60" rx="3.5" fill="${t.c}" opacity="0.85"/>`
    }
    return `${beams}<circle cx="450" cy="180" r="300" fill="url(#glow)" opacity="0.5"/>${sparkles(rand, 26, t.c)}${crowd}${title(t, 'LIVE TOUR 2026')}`
  },

  acrylic: (t, rand) => `
    <rect x="0" y="0" width="${S}" height="${S}" fill="${t.c}" opacity="0.14"/>
    <circle cx="640" cy="250" r="260" fill="url(#glow)" opacity="0.55"/>
    ${sparkles(rand, 18, '#ffffff')}
    <g transform="translate(300,150)">
      <rect x="0" y="0" width="300" height="420" rx="34" fill="#ffffff" opacity="0.28"/>
      <rect x="0" y="0" width="300" height="420" rx="34" fill="none" stroke="#ffffff" stroke-width="6" opacity="0.75"/>
      <circle cx="150" cy="150" r="74" fill="${t.a}" opacity="0.88"/>
      <path d="M42 384 C42 288 92 224 150 224 C208 224 258 288 258 384 Z" fill="${t.a}" opacity="0.88"/>
      <rect x="70" y="432" width="160" height="26" rx="13" fill="#ffffff" opacity="0.55"/>
    </g>
    ${title(t, 'ACRYLIC STAND')}`,

  penlight: (t, rand) => {
    let sticks = ''
    for (let i = 0; i < 5; i++) {
      const x = 150 + i * 140
      const rot = -22 + i * 11 + rand() * 6
      sticks += `<g transform="translate(${x},420) rotate(${rot})">
        <rect x="-26" y="-230" width="52" height="250" rx="26" fill="${t.c}" opacity="0.95"/>
        <rect x="-20" y="20" width="40" height="150" rx="14" fill="#12131a" opacity="0.9"/>
        <circle cx="0" cy="-160" r="120" fill="url(#glow)" opacity="0.5"/>
      </g>`
    }
    return `${sticks}${sparkles(rand, 22, '#ffffff')}${title(t, 'PENLIGHT COLLECTION')}`
  },

  cafe: (t, rand) => `
    <rect x="0" y="0" width="${S}" height="${S}" fill="#fff6ef"/>
    <rect x="0" y="0" width="${S}" height="${S}" fill="${t.b}" opacity="0.16"/>
    <circle cx="450" cy="470" r="290" fill="#ffffff" opacity="0.9"/>
    <circle cx="450" cy="470" r="230" fill="${t.c}" opacity="0.5"/>
    <g transform="translate(330,330)">
      <path d="M0 210 L120 0 L240 210 Z" fill="${t.b}"/>
      <rect x="-6" y="206" width="252" height="34" rx="16" fill="#ffffff" opacity="0.95"/>
      <rect x="112" y="-120" width="8" height="124" fill="#8a6a52"/>
      <path d="M120 -120 L214 -92 L120 -64 Z" fill="${t.a}"/>
      <circle cx="60" cy="150" r="14" fill="#ffffff" opacity="0.9"/>
      <circle cx="176" cy="168" r="10" fill="#ffffff" opacity="0.9"/>
    </g>
    ${sparkles(rand, 16, t.a, { x: 450, y: 450, r: 330 })}
    <text x="64" y="${S - 108}" font-family="${FONT}" font-size="58" font-weight="700" fill="${t.a}">${t.name}</text>
    <text x="66" y="${S - 56}" font-family="${FONT}" font-size="28" letter-spacing="4" fill="${t.a}" opacity="0.75">CAFE COLLABORATION</text>`,

  photocard: (t, rand) => `
    <rect x="0" y="0" width="${S}" height="${S}" fill="${t.a}"/>
    <circle cx="450" cy="380" r="330" fill="url(#glow)" opacity="0.35"/>
    <g transform="translate(255,120)">
      <rect x="0" y="0" width="390" height="560" rx="20" fill="${t.b}"/>
      <rect x="0" y="0" width="390" height="560" rx="20" fill="url(#holo)"/>
      <rect x="18" y="18" width="354" height="524" rx="12" fill="none" stroke="#ffffff" stroke-width="4" opacity="0.8"/>
      <circle cx="195" cy="216" r="96" fill="${t.a}" opacity="0.78"/>
      <path d="M62 474 C62 350 122 296 195 296 C268 296 328 350 328 474 Z" fill="${t.a}" opacity="0.78"/>
      <rect x="60" y="486" width="270" height="40" rx="20" fill="#ffffff" opacity="0.85"/>
    </g>
    ${sparkles(rand, 24, '#ffffff')}
    ${title(t, 'TRADING PHOTOCARD')}`,

  plush: (t, rand) => `
    <rect x="0" y="0" width="${S}" height="${S}" fill="${t.c}" opacity="0.35"/>
    <circle cx="450" cy="420" r="300" fill="#ffffff" opacity="0.55"/>
    <g transform="translate(450,400)">
      <circle cx="-118" cy="-128" r="62" fill="${t.b}"/>
      <circle cx="118" cy="-128" r="62" fill="${t.b}"/>
      <circle cx="0" cy="0" r="160" fill="${t.b}"/>
      <circle cx="-56" cy="-24" r="16" fill="${t.a}"/>
      <circle cx="56" cy="-24" r="16" fill="${t.a}"/>
      <ellipse cx="0" cy="42" rx="34" ry="24" fill="${t.a}" opacity="0.85"/>
      <path d="M-70 150 Q0 132 70 150 L70 196 Q0 222 -70 196 Z" fill="${t.c}"/>
      <path d="M-96 138 L-30 160 L-96 186 Z" fill="${t.a}" opacity="0.85"/>
      <path d="M96 138 L30 160 L96 186 Z" fill="${t.a}" opacity="0.85"/>
    </g>
    ${sparkles(rand, 16, '#ffffff')}
    <text x="64" y="${S - 108}" font-family="${FONT}" font-size="58" font-weight="700" fill="${t.a}">${t.name}</text>
    <text x="66" y="${S - 56}" font-family="${FONT}" font-size="28" letter-spacing="4" fill="${t.a}" opacity="0.75">PLUSH COLLECTION</text>`,
}

export const TEMPLATE_KEYS = Object.keys(TEMPLATES)

function postSvg(theme: Theme, template: string, variant: number) {
  const rand = rng(hash(`${theme.key}:${template}:${variant}`))
  const body = TEMPLATES[template]
  if (!body) throw new Error(`unknown template: ${template}`)
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}" viewBox="0 0 ${S} ${S}">
${defs(theme)}<rect width="${S}" height="${S}" fill="url(#bg)"/>${body(theme, rand)}</svg>`
}

const AVATAR_SIZE = 300

function avatarSvg(handle: string, initial: string) {
  const rand = rng(hash(`avatar:${handle}`))
  const hue = Math.floor(rand() * 360)
  const a = `hsl(${hue} 68% 34%)`
  const b = `hsl(${(hue + 48) % 360} 78% 62%)`
  let dots = ''
  for (let i = 0; i < 7; i++) {
    dots += `<circle cx="${rand() * AVATAR_SIZE}" cy="${rand() * AVATAR_SIZE}" r="${12 + rand() * 34}" fill="#ffffff" opacity="0.13"/>`
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${AVATAR_SIZE}" height="${AVATAR_SIZE}" viewBox="0 0 ${AVATAR_SIZE} ${AVATAR_SIZE}">
<defs><linearGradient id="av" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs>
<rect width="${AVATAR_SIZE}" height="${AVATAR_SIZE}" fill="url(#av)"/>${dots}
<text x="50%" y="50%" text-anchor="middle" dominant-baseline="central" font-family="${FONT}" font-size="150" font-weight="700" fill="#ffffff" opacity="0.95">${initial}</text></svg>`
}

function hash(key: string): number {
  let h = 2166136261
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

/** SVG 群を書き出して qlmanage で一括ラスタライズし、sips で JPEG にする。 */
function render(files: { name: string; svg: string }[], size: number, quality: number, dest: string) {
  rmSync(TMP, { recursive: true, force: true })
  mkdirSync(TMP, { recursive: true })
  mkdirSync(dest, { recursive: true })
  for (const f of files) writeFileSync(join(TMP, `${f.name}.svg`), f.svg)

  execFileSync('qlmanage', ['-t', '-s', String(size), '-o', TMP, ...files.map((f) => join(TMP, `${f.name}.svg`))], { stdio: 'ignore' })

  for (const png of readdirSync(TMP).filter((n) => n.endsWith('.png'))) {
    renameSync(join(TMP, png), join(TMP, png.replace('.svg.png', '.png')))
  }
  execFileSync(
    'sips',
    ['-s', 'format', 'jpeg', '-s', 'formatOptions', String(quality),
     ...files.map((f) => join(TMP, `${f.name}.png`)), '--out', dest],
    { stdio: 'ignore' },
  )
  for (const jpg of readdirSync(dest).filter((n) => n.endsWith('.jpeg'))) {
    renameSync(join(dest, jpg), join(dest, jpg.replace(/\.jpeg$/, '.jpg')))
  }
  rmSync(TMP, { recursive: true, force: true })
}

function main() {
  rmSync(OUT, { recursive: true, force: true })

  const posts = THEMES.flatMap((t) =>
    TEMPLATE_KEYS.flatMap((tpl) =>
      [0, 1].map((v) => ({ name: `${t.key}-${tpl}-${v}`, svg: postSvg(t, tpl, v) })),
    ),
  )
  render(posts, 760, 58, join(OUT, 'posts'))
  console.info(`posts: ${posts.length}`)

  const avatars = SEED_USERS.map((u) => ({ name: u.handle, svg: avatarSvg(u.handle, u.initial) }))
  render(avatars, 240, 70, join(OUT, 'avatars'))
  console.info(`avatars: ${avatars.length}`)
}

main()
