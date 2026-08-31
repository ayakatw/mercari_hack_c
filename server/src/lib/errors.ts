import type { Context } from 'hono'
import type { ContentfulStatusCode } from 'hono/utils/http-status'

/**
 * 例外 → HTTP レスポンスの変換はこのファイルだけが行う（R4）。
 * ルートの中で c.json({ error }) を組み立てないこと。
 */
export type ErrorCode = 'bad_request' | 'not_found' | 'forbidden' | 'internal'

const STATUS: Record<ErrorCode, ContentfulStatusCode> = {
  bad_request: 400,
  forbidden: 403,
  not_found: 404,
  internal: 500,
}

export class AppError extends Error {
  readonly code: ErrorCode

  constructor(code: ErrorCode, message: string) {
    super(message)
    this.name = 'AppError'
    this.code = code
  }

  get status(): ContentfulStatusCode {
    return STATUS[this.code]
  }
}

export const badRequest = (message: string) => new AppError('bad_request', message)
export const notFound = (message: string) => new AppError('not_found', message)
export const forbidden = (message: string) => new AppError('forbidden', message)

/** app.onError に渡す。レスポンス形状はここでしか決まらない。 */
export function errorHandler(err: Error, c: Context) {
  if (err instanceof AppError) {
    return c.json({ error: { code: err.code, message: err.message } }, err.status)
  }
  console.error(err)
  return c.json({ error: { code: 'internal', message: 'internal server error' } }, 500)
}

/** app.notFound に渡す。 */
export function notFoundHandler(c: Context) {
  return c.json({ error: { code: 'not_found', message: 'route not found' } }, 404)
}

/** zValidator の第 3 引数。バリデーション失敗も AppError に寄せる。 */
type ValidationResult =
  | { success: true }
  | { success: false; error: { issues: readonly { path: PropertyKey[]; message: string }[] } }

export function validationHook(result: ValidationResult) {
  if (result.success) return
  const detail = result.error.issues
    .map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`)
    .join(', ')
  throw badRequest(detail)
}
