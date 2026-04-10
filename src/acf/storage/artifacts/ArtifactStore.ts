import { createHash, randomUUID } from 'crypto'
import { mkdir, readFile, stat, writeFile } from 'fs/promises'
import { dirname, join } from 'path'
import { ArtifactRefSchema, type ArtifactRef } from '../../shared/refs.js'

export class ArtifactStore {
  constructor(private readonly artifactsDir: string) {}

  private async ensureParent(targetPath: string): Promise<void> {
    await mkdir(dirname(targetPath), { recursive: true })
  }

  async writeTextArtifact(
    relativePath: string,
    content: string,
    mediaType = 'text/plain',
  ): Promise<ArtifactRef> {
    const path = join(this.artifactsDir, relativePath)
    await this.ensureParent(path)
    await writeFile(path, content, 'utf8')
    const sha256 = createHash('sha256').update(content).digest('hex')
    return ArtifactRefSchema.parse({ kind: 'artifact', path, mediaType, sha256 })
  }

  async writeJsonArtifact<T>(
    relativePath: string,
    content: T,
  ): Promise<ArtifactRef> {
    return this.writeTextArtifact(
      relativePath,
      JSON.stringify(content, null, 2),
      'application/json',
    )
  }

  async registerExistingArtifact(
    path: string,
    mediaType = 'application/octet-stream',
  ): Promise<ArtifactRef> {
    const buffer = await readFile(path)
    const sha256 = createHash('sha256').update(buffer).digest('hex')
    return ArtifactRefSchema.parse({ kind: 'artifact', path, mediaType, sha256 })
  }

  async createSnapshotArtifact(content: string): Promise<ArtifactRef> {
    const fileName = `${randomUUID()}.txt`
    return this.writeTextArtifact(fileName, content)
  }

  async exists(path: string): Promise<boolean> {
    try {
      await stat(path)
      return true
    } catch {
      return false
    }
  }
}
