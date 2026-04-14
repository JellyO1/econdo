import { defineConfig } from '@hey-api/openapi-ts'

export default defineConfig({
  input: 'http://localhost:5091/openapi/v1.json',
  output: {
    path: 'src/api',
    postProcess: ['prettier'],
  },
  plugins: [
    '@hey-api/client-fetch',
    '@hey-api/typescript',
    '@hey-api/sdk',
    '@tanstack/react-query',
  ],
})
