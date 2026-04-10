import { z } from 'zod/v4'
import { VERIFICATION_TARGETS } from '../../shared/enums.js'

export const TestEnvironmentConfigSchema = z.object({
  id: z.string().min(1),
  projectId: z.string().min(1),
  target: z.enum(VERIFICATION_TARGETS),
  command: z.string().min(1),
  cwd: z.string().optional(),
  env: z.record(z.string(), z.string()).default({}),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
})
export type TestEnvironmentConfig = z.infer<typeof TestEnvironmentConfigSchema>
