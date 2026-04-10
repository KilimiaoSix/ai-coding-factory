import type { Requirement } from '../intake/Requirement.js'

export type RequirementPhase =
  | 'draft'
  | 'started'
  | 'execution'
  | 'verification'
  | 'done'
  | 'blocked'

export function deriveRequirementPhase(requirement: Requirement): RequirementPhase {
  switch (requirement.status) {
    case 'draft':
      return 'draft'
    case 'started':
      return 'started'
    case 'in_progress':
      return 'execution'
    case 'completed':
      return 'done'
    case 'blocked':
      return 'blocked'
  }
}
