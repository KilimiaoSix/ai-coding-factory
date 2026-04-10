import { Database } from 'bun:sqlite'
import { existsSync, mkdirSync } from 'fs'
import { join } from 'path'
import { getCwd } from 'src/utils/cwd.js'
import { findCanonicalGitRoot } from 'src/utils/git.js'
import { nowIsoTimestamp } from '../../shared/ids.js'
import { INITIAL_ACF_SCHEMA_SQL } from './migrations/0001_initial.js'

export type AcfStoragePaths = {
  repoRoot: string
  rootDir: string
  dbPath: string
  artifactsDir: string
  evidenceDir: string
  snapshotsDir: string
}

export type AcfDatabase = Database

export function resolveAcfRepoRoot(repoRoot?: string): string {
  return repoRoot ?? findCanonicalGitRoot(getCwd()) ?? getCwd()
}

export function getAcfStoragePaths(repoRoot?: string): AcfStoragePaths {
  const resolvedRepoRoot = resolveAcfRepoRoot(repoRoot)
  const rootDir = join(resolvedRepoRoot, '.claude', 'acf')
  return {
    repoRoot: resolvedRepoRoot,
    rootDir,
    dbPath: join(rootDir, 'control-plane.sqlite'),
    artifactsDir: join(rootDir, 'artifacts'),
    evidenceDir: join(rootDir, 'evidence'),
    snapshotsDir: join(rootDir, 'snapshots'),
  }
}

export function ensureAcfStorageDirs(paths: AcfStoragePaths): void {
  for (const target of [
    paths.rootDir,
    paths.artifactsDir,
    paths.evidenceDir,
    paths.snapshotsDir,
  ]) {
    if (!existsSync(target)) {
      mkdirSync(target, { recursive: true })
    }
  }
}

export function runAcfMigrations(db: AcfDatabase): void {
  db.exec('PRAGMA journal_mode = WAL;')
  db.exec('PRAGMA foreign_keys = ON;')
  db.exec(INITIAL_ACF_SCHEMA_SQL)

  const version = '0001_initial'
  const existing = db
    .prepare('SELECT version FROM acf_schema_migrations WHERE version = ?')
    .get(version) as { version: string } | null
  if (!existing) {
    db.prepare(
      'INSERT INTO acf_schema_migrations (version, applied_at) VALUES (?, ?)',
    ).run(version, nowIsoTimestamp())
  }
}

export function openAcfControlPlaneDatabase(repoRoot?: string): {
  db: AcfDatabase
  paths: AcfStoragePaths
} {
  const paths = getAcfStoragePaths(repoRoot)
  ensureAcfStorageDirs(paths)
  const db = new Database(paths.dbPath, { create: true })
  runAcfMigrations(db)
  return { db, paths }
}
