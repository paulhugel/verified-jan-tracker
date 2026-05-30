import { cp, mkdir, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { build } from 'esbuild'

const outputRoot = '.vercel/output'
const functionRoot = join(outputRoot, 'functions/__server.func')

await rm(outputRoot, { recursive: true, force: true })

await mkdir(join(outputRoot, 'static'), { recursive: true })
await cp('dist/client', join(outputRoot, 'static'), { recursive: true })

await mkdir(functionRoot, { recursive: true })

await build({
  entryPoints: ['dist/server/server.js'],
  bundle: true,
  format: 'esm',
  platform: 'node',
  target: 'node24',
  outfile: join(functionRoot, 'index.mjs'),
  banner: {
    js: "import { createRequire as __cjsCreateRequire } from 'node:module';const require = __cjsCreateRequire(import.meta.url);",
  },
})

await writeFile(
  join(outputRoot, 'config.json'),
  JSON.stringify(
    {
      version: 3,
      routes: [
        { handle: 'filesystem' },
        { src: '/(.*)', dest: '/__server' },
      ],
    },
    null,
    2,
  ),
)

await writeFile(
  join(functionRoot, '.vc-config.json'),
  JSON.stringify(
    {
      handler: 'index.mjs',
      launcherType: 'Nodejs',
      shouldAddHelpers: false,
      supportsResponseStreaming: true,
      runtime: 'nodejs24.x',
    },
    null,
    2,
  ),
)
