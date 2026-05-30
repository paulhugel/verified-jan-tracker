import { cp, mkdir, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

const outputRoot = '.vercel/output'
const functionRoot = join(outputRoot, 'functions/__server.func')

await rm(outputRoot, { recursive: true, force: true })

await mkdir(join(outputRoot, 'static'), { recursive: true })
await cp('dist/client', join(outputRoot, 'static'), { recursive: true })

await mkdir(functionRoot, { recursive: true })
await cp('dist/server', join(functionRoot, 'dist/server'), { recursive: true })

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

await writeFile(
  join(functionRoot, 'index.mjs'),
  "export { default } from './dist/server/server.js'\n",
)
