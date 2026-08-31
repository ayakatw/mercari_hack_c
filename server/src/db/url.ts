/** DATABASE_URL を読む唯一の場所。未設定なら起動時点で落とす。 */
export function requireDatabaseUrl(): string {
  const url = process.env.DATABASE_URL
  if (!url) {
    throw new Error(
      'DATABASE_URL が未設定です。`cp .env.example .env` して mise を activate してください。',
    )
  }
  return url
}
