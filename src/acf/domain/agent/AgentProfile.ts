import { z } from 'zod/v4'
import { AGENT_PROFILE_SOURCES } from '../../shared/enums.js'

export const AgentProfileSchema = z.object({
  id: z.string().min(1),
  agentType: z.string().min(1),
  role: z.string().min(1),
  description: z.string().min(1),
  source: z.enum(AGENT_PROFILE_SOURCES),
  runtimeAgentType: z.string().optional(),
  tools: z.array(z.string()).default([]),
  disallowedTools: z.array(z.string()).default([]),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
})
export type AgentProfile = z.infer<typeof AgentProfileSchema>
