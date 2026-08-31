import { serve } from '@hono/node-server'
import app from './app'

const port = Number(process.env.PORT ?? 3000)

// 実機の Expo Go から見えるように 0.0.0.0 で listen する。
serve({ fetch: app.fetch, port, hostname: '0.0.0.0' }, (info) => {
  console.info(`server listening on http://localhost:${info.port}`)
})
