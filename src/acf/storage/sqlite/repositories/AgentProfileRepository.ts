import type { Database } from 'bun:sqlite'
import { AgentProfileSchema } from '../../../domain/agent/AgentProfile.js'
import { JsonEntityRepository } from './BaseRepository.js'

export class AgentProfileRepository extends JsonEntityRepository<
  ReturnType<typeof AgentProfileSchema.parse>
> {
  constructor(db: Database) {
    super(db, 'acf_agent_profiles', AgentProfileSchema, [
      'runtime_agent_type',
      'source',
    ])
  }

  save(profile: ReturnType<typeof AgentProfileSchema.parse>) {
    return this.upsert(profile, {
      runtime_agent_type: profile.runtimeAgentType ?? profile.agentType,
      source: profile.source,
    })
  }
}
