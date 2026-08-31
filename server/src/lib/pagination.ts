import { z } from 'zod'
import { badRequest } from './errors'

/**
 * ページネーションはカーソル方式に統一する（R4）。offset は使わない。
 * 並び順 (created_at DESC, id DESC) と 1 対 1 で対応する。
 */
export type Cursor = { createdAt: Date; id: string }

export const DEFAULT_LIMIT = 20
export const MAX_LIMIT = 50

export function encodeCursor(cursor: Cursor): string {
  return Buffer.from(`${cursor.createdAt.toISOString()}|${cursor.id}`).toString('base64url')
}

export function decodeCursor(raw: string): Cursor {
  const [createdAt, id] = Buffer.from(raw, 'base64url').toString('utf8').split('|')
  const at = createdAt ? new Date(createdAt) : null
  if (!at || Number.isNaN(at.getTime()) || !id) throw badRequest('cursor is malformed')
  return { createdAt: at, id }
}

/** 全一覧ルートはこのスキーマを query に使う。独自の limit/cursor を定義しない。 */
export const pageQuery = z.object({
  limit: z.coerce.number().int().min(1).max(MAX_LIMIT).default(DEFAULT_LIMIT),
  cursor: z
    .string()
    .optional()
    .transform((raw) => (raw ? decodeCursor(raw) : null)),
})

export type PageParams = z.output<typeof pageQuery>

export type Page<T> = { items: T[]; nextCursor: string | null }

/**
 * クエリは limit + 1 件取り、この関数に渡す。
 * 余分な 1 件の有無で次ページの有無を判定する。
 */
export function toPage<T>(rows: T[], limit: number, toCursor: (row: T) => Cursor): Page<T> {
  const hasNext = rows.length > limit
  const items = hasNext ? rows.slice(0, limit) : rows
  const last = items.at(-1)
  return { items, nextCursor: hasNext && last ? encodeCursor(toCursor(last)) : null }
}
