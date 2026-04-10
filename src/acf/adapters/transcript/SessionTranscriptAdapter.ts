import { readFile } from 'fs/promises'
import { getTranscriptPathForSession } from 'src/utils/sessionStorage.js'
import { TranscriptRefSchema, type TranscriptRef } from '../../shared/refs.js'

export class SessionTranscriptAdapter {
  resolveTranscriptRef(sessionId: string, agentId?: string): TranscriptRef {
    return TranscriptRefSchema.parse({
      kind: 'transcript',
      sessionId,
      transcriptPath: getTranscriptPathForSession(sessionId),
      agentId,
    })
  }

  async readTranscriptLines(sessionId: string): Promise<string[]> {
    const transcriptPath = getTranscriptPathForSession(sessionId)
    const raw = await readFile(transcriptPath, 'utf8')
    return raw.split(/\r?\n/).filter(Boolean)
  }
}
