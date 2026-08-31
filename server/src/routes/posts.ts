import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { listPosts } from '../db/queries/posts'
import { validationHook } from '../lib/errors'
import { pageQuery } from '../lib/pagination'
import { type AppEnv, withViewer } from '../lib/viewer'

export const posts = new Hono<AppEnv>()
  .use('*', withViewer)
  .get('/', zValidator('query', pageQuery, validationHook), async (c) => {
    const page = await listPosts(c.get('viewer'), c.req.valid('query'))
    return c.json(page)
  })
