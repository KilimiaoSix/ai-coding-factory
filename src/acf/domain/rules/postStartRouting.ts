import type { Requirement } from '../intake/Requirement.js'

export type PostStartRoute = 'execution' | 'verification' | 'done' | 'blocked'

export function derivePostStartRoute(requirement: Requirement): PostStartRoute {
  switch (requirement.status) {
    case 'completed':
      return 'done'
    case 'blocked':
      return 'blocked'
    case 'in_progress':
      return 'verification'
    case 'draft':
    case 'started':
      return 'execution'
  }
}
