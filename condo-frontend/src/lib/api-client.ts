import { client } from '@/api/client.gen'

// Use a relative base URL so requests go through Vite's proxy in dev
// and hit the same origin in production.
client.setConfig({ baseUrl: '' })

export { client }
