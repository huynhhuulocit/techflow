import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { createAuthorApiPlugin } from './server/author-api/vitePlugin.ts'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [
      react(),
      createAuthorApiPlugin({
        apiKey: env.OPENAI_API_KEY,
        model: env.OPENAI_MODEL,
        authorToken: env.TECHFLOW_AUTHOR_TOKEN,
      }),
    ],
    server: {
      host: '127.0.0.1',
    },
  }
})
