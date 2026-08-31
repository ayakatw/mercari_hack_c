import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'
import { requireDatabaseUrl } from './url'

export function createDb(url: string = requireDatabaseUrl()) {
  const client = postgres(url)
  return { db: drizzle(client, { schema, casing: 'snake_case' }), client }
}

export const { db, client } = createDb()

export type Db = typeof db
