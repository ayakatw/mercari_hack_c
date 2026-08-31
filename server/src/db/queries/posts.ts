import { and, desc, inArray, sql } from 'drizzle-orm'
import { type Cursor, type PageParams, toPage } from '../../lib/pagination'
import type { Viewer } from '../../lib/viewer'
import { db } from '../client'
import { posts } from '../schema'

/**
 * db/queries の関数はすべて第一引数に viewer を取る（R3）。
 * 本番ではここにブロック・公開範囲の条件が入る。
 */
export async function listPosts(viewer: Viewer, params: PageParams) {
  const authorIds = [viewer.id, ...viewer.followingIds]

  const rows = await db.query.posts.findMany({
    columns: {
      id: true,
      caption: true,
      imageUrl: true,
      itemTags: true,
      likeCount: true,
      createdAt: true,
    },
    with: {
      author: { columns: { id: true, handle: true, displayName: true, avatarUrl: true } },
    },
    where: and(
      inArray(posts.authorId, authorIds),
      params.cursor
        ? sql`(${posts.createdAt}, ${posts.id}) < (${params.cursor.createdAt.toISOString()}::timestamptz, ${params.cursor.id}::uuid)`
        : undefined,
    ),
    orderBy: [desc(posts.createdAt), desc(posts.id)],
    limit: params.limit + 1,
  })

  return toPage(rows, params.limit, (row): Cursor => ({ createdAt: row.createdAt, id: row.id }))
}
