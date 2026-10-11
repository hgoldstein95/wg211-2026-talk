import { createServer } from 'node:http'
import { execSync } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import { extname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

export const root = resolve(fileURLToPath(new URL('..', import.meta.url)))

const MIME = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.mp4': 'video/mp4',
  '.json': 'application/json',
}

/** Serve a directory over HTTP on an ephemeral port. */
export async function serveStatic(dir) {
  const server = createServer(async (req, res) => {
    const path = decodeURIComponent(req.url.split('?')[0])
    const file = join(dir, path === '/' ? 'index.html' : path)
    try {
      const body = await readFile(file)
      res.writeHead(200, { 'content-type': MIME[extname(file)] ?? 'application/octet-stream' })
      res.end(body)
    } catch {
      res.writeHead(404).end('not found')
    }
  })
  await new Promise((resolveListen) => server.listen(0, '127.0.0.1', resolveListen))
  return {
    origin: `http://127.0.0.1:${server.address().port}`,
    close: () => new Promise((resolveClose) => server.close(resolveClose)),
  }
}

/**
 * Resolve an origin to point a browser at: the running dev server if `--build`
 * was not passed and one is reachable, otherwise a fresh production build.
 */
export async function resolveOrigin({ build, origin = 'http://localhost:5173' }) {
  if (build) {
    execSync('npm run build', { cwd: root, stdio: 'inherit' })
    return serveStatic(join(root, 'dist'))
  }

  const reachable = await fetch(origin)
    .then((res) => res.ok)
    .catch(() => false)

  if (reachable) return { origin, close: async () => {} }

  console.error(`No dev server at ${origin} — building instead.`)
  execSync('npm run build', { cwd: root, stdio: 'inherit' })
  return serveStatic(join(root, 'dist'))
}
