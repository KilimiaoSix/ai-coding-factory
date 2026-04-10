import { getPlan, getPlanFilePath } from 'src/utils/plans.js'

export type PlanModeSnapshot = {
  path: string
  content: string | null
}

export class PlanModeAdapter {
  readCurrentPlan(): PlanModeSnapshot {
    return {
      path: getPlanFilePath(),
      content: getPlan(),
    }
  }
}
