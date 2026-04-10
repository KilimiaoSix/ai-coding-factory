import type { Database } from 'bun:sqlite'
import { z } from 'zod/v4'
import { nowIsoTimestamp } from '../../../shared/ids.js'

type SqlitePayloadRow = {
  payload: string
}

function readTimestamp(
  entity: Record<string, unknown>,
  field: 'createdAt' | 'updatedAt',
): string | undefined {
  const value = entity[field]
  return typeof value === 'string' && value.length > 0 ? value : undefined
}

export class JsonEntityRepository<T extends { id: string }> {
  private readonly upsertSql: string

  constructor(
    protected readonly db: Database,
    private readonly table: string,
    private readonly schema: z.ZodType<T>,
    private readonly indexedColumns: readonly string[],
  ) {
    const insertColumns = [
      'id',
      ...this.indexedColumns,
      'payload',
      'created_at',
      'updated_at',
    ]
    const placeholders = insertColumns.map(() => '?').join(', ')
    const updates = [
      ...this.indexedColumns.map(column => `${column} = excluded.${column}`),
      'payload = excluded.payload',
      'updated_at = excluded.updated_at',
    ].join(', ')
    this.upsertSql =
      `INSERT INTO ${this.table} (${insertColumns.join(', ')}) ` +
      `VALUES (${placeholders}) ` +
      `ON CONFLICT(id) DO UPDATE SET ${updates}`
  }

  upsert(
    entity: T,
    indexValues: Record<string, string | null | undefined>,
  ): T {
    const parsed = this.schema.parse(entity)
    const entityRecord = parsed as Record<string, unknown>
    const createdAt = readTimestamp(entityRecord, 'createdAt') ?? nowIsoTimestamp()
    const updatedAt = readTimestamp(entityRecord, 'updatedAt') ?? createdAt
    const values = [
      parsed.id,
      ...this.indexedColumns.map(column => indexValues[column] ?? null),
      JSON.stringify(parsed),
      createdAt,
      updatedAt,
    ]
    this.db.prepare(this.upsertSql).run(...values)
    return parsed
  }

  getById(id: string): T | null {
    const row = this.db
      .prepare(`SELECT payload FROM ${this.table} WHERE id = ?`)
      .get(id) as SqlitePayloadRow | null
    return row ? this.schema.parse(JSON.parse(row.payload)) : null
  }

  listAll(): T[] {
    const rows = this.db
      .prepare(`SELECT payload FROM ${this.table} ORDER BY created_at ASC`)
      .all() as SqlitePayloadRow[]
    return rows.map(row => this.schema.parse(JSON.parse(row.payload)))
  }

  listByColumn(column: string, value: string): T[] {
    if (!this.indexedColumns.includes(column)) {
      throw new Error(
        `Column ${column} is not indexed on repository table ${this.table}`,
      )
    }
    const rows = this.db
      .prepare(
        `SELECT payload FROM ${this.table} WHERE ${column} = ? ORDER BY created_at ASC`,
      )
      .all(value) as SqlitePayloadRow[]
    return rows.map(row => this.schema.parse(JSON.parse(row.payload)))
  }
}
