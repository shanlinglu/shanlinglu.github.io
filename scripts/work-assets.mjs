import { cp, lstat, mkdir, readdir, realpath, stat } from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { lookup } from 'mrmime';

const prefix = '/assets/works/';

function isPublished(parts) {
  return parts.length >= 1 && parts.every(part => part && !part.startsWith('.') && !part.includes('\\')) &&
    !(parts.length === 2 && parts[1] === 'index.md');
}

export default function workAssets() {
  let worksDir;
  return {
    name: 'work-assets',
    hooks: {
      'astro:config:done': ({ config }) => {
        worksDir = fileURLToPath(new URL('works/', config.root));
      },
      'astro:server:setup': ({ server }) => {
        server.middlewares.use(async (req, res, next) => {
          const pathname = req.url?.split('?')[0];
          if (!pathname?.startsWith(prefix)) return next();
          const missing = () => { res.statusCode = 404; res.end(); };
          if (req.method !== 'GET' && req.method !== 'HEAD') return missing();
          let decoded;
          try {
            decoded = decodeURIComponent(pathname.slice(prefix.length));
          } catch {
            return missing();
          }
          if (decoded.endsWith('/')) decoded += 'index.html';
          const parts = decoded.split('/');
          if (parts.length < 2 || !isPublished(parts) || decoded.includes('\0')) return missing();
          const filename = path.join(worksDir, ...parts);
          try {
            // Match the build's policy for symbolic links, including parent directories.
            if (await realpath(filename) !== filename) return missing();
            const info = await stat(filename);
            if (!info.isFile()) return missing();
            res.setHeader('Content-Type', lookup(filename) || 'application/octet-stream');
            res.setHeader('Content-Length', info.size);
            if (req.method === 'HEAD') return res.end();
            const stream = createReadStream(filename);
            stream.on('error', next).pipe(res);
            res.on('close', () => stream.destroy());
          } catch (error) {
            if (error.code === 'ENOENT' || error.code === 'ENOTDIR') return missing();
            next(error);
          }
        });
      },
      'astro:build:done': async ({ dir }) => {
        const target = fileURLToPath(new URL('assets/works/', dir));
        await mkdir(target, { recursive: true });
        for (const entry of await readdir(worksDir, { withFileTypes: true })) {
          if (!entry.isDirectory() || !isPublished([entry.name])) continue;
          await cp(path.join(worksDir, entry.name), path.join(target, entry.name), {
            recursive: true,
            filter: async source => {
              const parts = path.relative(worksDir, source).split(path.sep);
              const info = await lstat(source);
              return isPublished(parts) && (info.isFile() || info.isDirectory());
            },
          });
        }
      },
    },
  };
}
