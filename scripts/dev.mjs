// 킵페이(5200)와 제로페이(5100)를 한 터미널에서 함께 띄움. 한쪽이 끝나면 결제 흐름이 돌지 않으므로 둘 다 끔
import { spawn } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

const procs = [
  { name: 'keepay', color: 32, args: ['--filter', '@point-payment/keepay', 'dev'] },
  { name: 'zeropay', color: 36, args: ['--filter', '@point-payment/zeropay', 'dev'] },
]

const children = procs.map((p) => {
  const child = spawn('pnpm', p.args, { cwd: root, shell: true, env: process.env })
  const tag = `\x1b[${p.color}m[${p.name}]\x1b[0m `
  // 출력이 줄 중간에서 끊겨 들어오므로 줄 단위로 모아 접두어를 붙인다
  const pipe = (stream, out) => {
    let buf = ''
    stream.on('data', (d) => {
      buf += d
      const lines = buf.split(/\r?\n/)
      buf = lines.pop() ?? ''
      for (const l of lines) out.write(tag + l + '\n')
    })
  }
  pipe(child.stdout, process.stdout)
  pipe(child.stderr, process.stderr)
  child.on('exit', (code) => {
    console.log(`${tag}종료 (code ${code})`)
    shutdown()
  })
  return child
})

let down = false
function shutdown() {
  if (down) return
  down = true
  for (const c of children) if (c.exitCode === null && c.pid) c.kill('SIGTERM')
  process.exit(0)
}
process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
