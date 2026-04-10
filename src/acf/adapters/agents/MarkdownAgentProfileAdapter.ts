import type { AgentDefinition } from 'src/tools/AgentTool/loadAgentsDir.js'
import {
  AgentProfileSchema,
  type AgentProfile,
} from '../../domain/agent/AgentProfile.js'
import {
  createAgentProfileId,
  nowIsoTimestamp,
} from '../../shared/ids.js'

export class MarkdownAgentProfileAdapter {
  fromAgentDefinition(
    agent: AgentDefinition,
    role = 'execution_agent',
  ): AgentProfile {
    const timestamp = nowIsoTimestamp()
    return AgentProfileSchema.parse({
      id: createAgentProfileId(),
      agentType: agent.agentType,
      role,
      description: agent.whenToUse,
      source: agent.source ?? 'unknown',
      runtimeAgentType: agent.agentType,
      tools: agent.tools ?? [],
      disallowedTools: agent.disallowedTools ?? [],
      createdAt: timestamp,
      updatedAt: timestamp,
    })
  }
}
