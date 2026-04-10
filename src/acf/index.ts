import { ArtifactStore } from './storage/artifacts/ArtifactStore.js'
import { EvidenceIndex } from './storage/artifacts/EvidenceIndex.js'
import { NativeCliRuntimeAdapter } from './adapters/runtime/NativeCliRuntimeAdapter.js'
import { ExecutionDispatcher } from './adapters/runtime/ExecutionDispatcher.js'
import { RuntimeEventProjector } from './adapters/runtime/RuntimeEventProjector.js'
import { NativeWorktreeAdapter } from './adapters/worktree/NativeWorktreeAdapter.js'
import { openAcfControlPlaneDatabase } from './storage/sqlite/schema.js'
import {
  ProjectContextSummaryRepository,
  ProjectRepository,
  ReadinessChecklistRepository,
} from './storage/sqlite/repositories/ProjectRepository.js'
import {
  RequirementDraftRepository,
  RequirementRepository,
} from './storage/sqlite/repositories/IntakeRepository.js'
import {
  TaskRepository,
  TaskRunRepository,
} from './storage/sqlite/repositories/ExecutionRepository.js'
import {
  EvidenceRepository,
  TestEnvironmentConfigRepository,
  VerificationRunRepository,
} from './storage/sqlite/repositories/VerificationRepository.js'
import {
  GateDecisionRepository,
} from './storage/sqlite/repositories/QualityRepository.js'
import { AgentProfileRepository } from './storage/sqlite/repositories/AgentProfileRepository.js'
import { IntakeService } from './application/intake/IntakeService.js'
import { ExecutionService } from './application/execution/ExecutionService.js'
import { VerificationService } from './application/verification/VerificationService.js'
import { QualityService } from './application/quality/QualityService.js'
import { AgentProfileService } from './application/agent/AgentProfileService.js'

export function createAcfSubsystem(repoRoot?: string) {
  const { db, paths } = openAcfControlPlaneDatabase(repoRoot)

  const projects = new ProjectRepository(db)
  const contextSummaries = new ProjectContextSummaryRepository(db)
  const readinessChecklists = new ReadinessChecklistRepository(db)
  const drafts = new RequirementDraftRepository(db)
  const requirements = new RequirementRepository(db)
  const tasks = new TaskRepository(db)
  const taskRuns = new TaskRunRepository(db)
  const testEnvironmentConfigs = new TestEnvironmentConfigRepository(db)
  const verificationRuns = new VerificationRunRepository(db)
  const evidence = new EvidenceRepository(db)
  const gateDecisions = new GateDecisionRepository(db)
  const agentProfiles = new AgentProfileRepository(db)

  const artifactStore = new ArtifactStore(paths.artifactsDir)
  const evidenceIndex = new EvidenceIndex(paths.evidenceDir)
  const runtimeAdapter = new NativeCliRuntimeAdapter()
  const runtimeProjector = new RuntimeEventProjector()
  const executionDispatcher = new ExecutionDispatcher(
    runtimeAdapter,
    runtimeProjector,
  )
  const worktreeAdapter = new NativeWorktreeAdapter()

  return {
    db,
    paths,
    repositories: {
      projects,
      contextSummaries,
      readinessChecklists,
      drafts,
      requirements,
      tasks,
      taskRuns,
      testEnvironmentConfigs,
      verificationRuns,
      evidence,
      gateDecisions,
      agentProfiles,
    },
    stores: {
      artifactStore,
      evidenceIndex,
    },
    adapters: {
      runtimeAdapter,
      runtimeProjector,
      executionDispatcher,
      worktreeAdapter,
    },
    services: {
      intake: new IntakeService(
        projects,
        contextSummaries,
        readinessChecklists,
        drafts,
        requirements,
      ),
      execution: new ExecutionService(
        requirements,
        tasks,
        taskRuns,
        worktreeAdapter,
      ),
      verification: new VerificationService(
        taskRuns,
        testEnvironmentConfigs,
        verificationRuns,
        evidence,
        evidenceIndex,
      ),
      quality: new QualityService(
        taskRuns,
        verificationRuns,
        evidence,
        gateDecisions,
      ),
      agent: new AgentProfileService(agentProfiles),
    },
  }
}
