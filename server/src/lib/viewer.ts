import { eq } from 'drizzle-orm'
import { createMiddleware } from 'hono/factory'
import { db } from '../db/client'
import { users } from '../db/schema'
import { notFound } from './errors'

/**
 * 認証は無い。デモ用に X-Demo-User ヘッダ（handle）で viewer を切り替える。
 * ヘッダが無ければシードの既定ユーザー（users.is_demo_default）を使う。
 *
 * このファイルは db/queries を経由せず直接 db を引く唯一の例外。
 * viewer を解決する処理自体が viewer を受け取れないため。
 */
export const DEMO_USER_HEADER = 'x-demo-user'

export type Viewer = {
  id: string
  handle: string
  displayName: string
  followingIds: string[]
}

export type AppEnv = { Variables: { viewer: Viewer } }

const COLUMNS = {
  id: true,
  handle: true,
  displayName: true,
  followingIds: true,
} as const

export async function resolveViewer(handle: string | null): Promise<Viewer> {
  const row = handle
    ? await db.query.users.findFirst({ columns: COLUMNS, where: eq(users.handle, handle) })
    : await db.query.users.findFirst({ columns: COLUMNS, where: eq(users.isDemoDefault, true) })

  if (!row) {
    throw notFound(
      handle
        ? `demo user '${handle}' not found. X-Demo-User に存在する handle を指定してください。`
        : '既定のデモユーザーが居ません。pnpm seed を実行してください。',
    )
  }
  return row
}

/** viewer が要るルートは Hono インスタンスの先頭でこれを use する。 */
export const withViewer = createMiddleware<AppEnv>(async (c, next) => {
  c.set('viewer', await resolveViewer(c.req.header(DEMO_USER_HEADER) ?? null))
  await next()
})
