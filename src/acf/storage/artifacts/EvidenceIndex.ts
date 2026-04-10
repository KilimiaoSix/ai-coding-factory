import { mkdir, readFile, writeFile } from 'fs/promises'
import { join } from 'path'
import {
  EvidenceSchema,
  type Evidence,
} from '../../domain/verification/Evidence.js'

export class EvidenceIndex {
  constructor(private readonly evidenceDir: string) {}

  private getIndexPath(evidenceId: string): string {
    return join(this.evidenceDir, `${evidenceId}.json`)
  }

  async write(evidence: Evidence): Promise<string> {
    await mkdir(this.evidenceDir, { recursive: true })
    const validated = EvidenceSchema.parse(evidence)
    const targetPath = this.getIndexPath(validated.id)
    await writeFile(targetPath, JSON.stringify(validated, null, 2), 'utf8')
    return targetPath
  }

  async read(evidenceId: string): Promise<Evidence | null> {
    try {
      const raw = await readFile(this.getIndexPath(evidenceId), 'utf8')
      return EvidenceSchema.parse(JSON.parse(raw))
    } catch {
      return null
    }
  }
}
