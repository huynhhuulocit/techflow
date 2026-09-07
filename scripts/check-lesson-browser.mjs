import { spawn } from 'node:child_process'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const host = '127.0.0.1'
const port = 4173
const baseUrl = `http://${host}:${port}/`
const session = `techflow-lesson-smoke-${process.pid}`
const viteEntry = resolve(projectRoot, 'node_modules/vite/bin/vite.js')

function runProcess(command, args, options = {}) {
  return new Promise((resolveRun, rejectRun) => {
    const child = spawn(command, args, {
      cwd: projectRoot,
      env: process.env,
      shell: options.shell ?? false,
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    let stdout = ''
    let stderr = ''

    child.stdout.on('data', (chunk) => { stdout += chunk })
    child.stderr.on('data', (chunk) => { stderr += chunk })
    child.on('error', rejectRun)
    child.on('exit', (code) => {
      if (code === 0 || options.allowFailure) {
        resolveRun({ code, stdout, stderr })
        return
      }

      rejectRun(new Error([stderr, stdout].filter(Boolean).join('\n').trim() || `${command} exited with code ${code}`))
    })
  })
}

function playwrightCommand(args) {
  const npmExecPath = process.env.npm_execpath
  if (npmExecPath) {
    const npxCli = resolve(dirname(npmExecPath), 'npx-cli.js')
    return runProcess(process.execPath, [
      npxCli,
      '--yes',
      '--package',
      '@playwright/cli@0.1.19',
      'playwright-cli',
      `-s=${session}`,
      ...args,
    ])
  }

  const npxCommand = process.platform === 'win32' ? 'npx.cmd' : 'npx'
  return runProcess(npxCommand, [
    '--yes',
    '--package',
    '@playwright/cli@0.1.19',
    'playwright-cli',
    `-s=${session}`,
    ...args,
  ], { shell: process.platform === 'win32' })
}

async function waitForServer(server, timeoutMs = 20_000) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    if (server.exitCode !== null) {
      throw new Error(`Vite exited before the browser check started (code ${server.exitCode}).`)
    }

    try {
      const response = await fetch(baseUrl)
      if (response.ok) return
    } catch {
      // Vite is still starting.
    }

    await new Promise((resolveWait) => setTimeout(resolveWait, 200))
  }

  throw new Error(`Timed out waiting for ${baseUrl}`)
}

const serverOutput = []
const server = spawn(process.execPath, [
  viteEntry,
  '--host',
  host,
  '--port',
  String(port),
  '--strictPort',
], {
  cwd: projectRoot,
  env: process.env,
  stdio: ['ignore', 'pipe', 'pipe'],
})
server.stdout.on('data', (chunk) => serverOutput.push(chunk.toString()))
server.stderr.on('data', (chunk) => serverOutput.push(chunk.toString()))

try {
  await waitForServer(server)
  await playwrightCommand(['open', baseUrl])
  const result = await playwrightCommand([
    'run-code',
    '--filename=scripts/lesson-browser-smoke.js',
  ])
  process.stdout.write(result.stdout)
  process.stderr.write(result.stderr)
} catch (error) {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`)
  if (serverOutput.length) process.stderr.write(serverOutput.join(''))
  process.exitCode = 1
} finally {
  await playwrightCommand(['close']).catch(() => undefined)
  server.kill()
}
