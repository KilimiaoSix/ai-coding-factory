import type { AgentDefinition } from 'src/tools/AgentTool/loadAgentsDir.js'
import { MarkdownAgentProfileAdapter } from '../../adapters/agents/MarkdownAgentProfileAdapter.js'
import type { AgentProfileRepository } from '../../storage/sqlite/repositories/AgentProfileRepository.js'

export class AgentProfileService {
  constructor(
    private readonly profiles: AgentProfileRepository,
    private readonly adapter = new MarkdownAgentProfileAdapter(),
  ) {}

  syncAgentDefinition(agent: AgentDefinition) {
    return this.profiles.save(this.adapter.fromAgentDefinition(agent))
  }

  syncAgentDefinitions(agents: AgentDefinition[]) {
    return agents.map(agent => this.syncAgentDefinition(agent))
  }
}
