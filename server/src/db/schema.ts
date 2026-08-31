import { relations, sql } from 'drizzle-orm'
import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'

/** 投稿画像に付けるアイテムタグ。メルカリへの遷移先を持つ。 */
export type ItemTag = {
  label: string
  priceYen: number
  mercariUrl: string
  /** 画像上の位置。0..1 の相対座標。 */
  x: number
  y: number
}

export const users = pgTable(
  'users',
  {
    id: uuid().primaryKey().defaultRandom(),
    handle: text().notNull(),
    displayName: text().notNull(),
    avatarUrl: text().notNull(),
    bio: text().notNull().default(''),
    /** 推し棚。 */
    oshiTags: text().array().notNull().default(sql`'{}'::text[]`),
    /** フォロー先。テーブルを 2 つに保つため配列で持つ。 */
    followingIds: uuid().array().notNull().default(sql`'{}'::uuid[]`),
    /** X-Demo-User ヘッダが無いときの既定 viewer。シードで 1 名だけ true にする。 */
    isDemoDefault: boolean().notNull().default(false),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex('users_handle_key').on(t.handle)],
)

export const posts = pgTable(
  'posts',
  {
    id: uuid().primaryKey().defaultRandom(),
    authorId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    caption: text().notNull(),
    imageUrl: text().notNull(),
    itemTags: jsonb().$type<ItemTag[]>().notNull().default([]),
    likeCount: integer().notNull().default(0),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    // カーソルページネーション用。並び順と完全に一致させる。
    index('posts_created_at_id_idx').on(t.createdAt.desc(), t.id.desc()),
    index('posts_author_id_idx').on(t.authorId),
  ],
)

export const usersRelations = relations(users, ({ many }) => ({
  posts: many(posts),
}))

export const postsRelations = relations(posts, ({ one }) => ({
  author: one(users, { fields: [posts.authorId], references: [users.id] }),
}))
