import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { errorHandler, notFoundHandler } from './lib/errors'
import type { AppEnv } from './lib/viewer'
import { health } from './routes/health'
import { posts } from './routes/posts'

const app = new Hono<AppEnv>()

if (process.env.NODE_ENV !== 'test') app.use('*', logger())
app.use('*', cors())
app.onError(errorHandler)
app.notFound(notFoundHandler)

const routes = app.route('/health', health).route('/posts', posts)

/** アプリ側はこの型だけを import する（Hono RPC）。 */
export type AppType = typeof routes

export default app
