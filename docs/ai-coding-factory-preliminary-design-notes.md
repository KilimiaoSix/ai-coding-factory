# AI-Coding-Factory 预设计草案

本文档用于承接方案评审过程中已经讨论过、但粒度已下沉到详细设计层的内容。

它不是最终技术设计文档，也不是最终数据表设计文档，而是当前阶段的预设计输入。后续如果进入正式架构设计，可基于本文档继续展开。

相关文档：

- 方案评审文档：[ai-coding-factory-review.md](/Users/kilimiao/CodeProject/claude-code/docs/ai-coding-factory-review.md)
- 立项文档：[ai-coding-factory-project-proposal.md](/Users/kilimiao/CodeProject/claude-code/docs/ai-coding-factory-project-proposal.md)

## 一、需求启动链路预设计

当前已形成的设计方向：

- 用户前台入口为 `Product Agent`
- `Product Agent` 仅维护 `RequirementDraft`
- 用户点击 `Start` 后，由系统冻结需求基线并创建正式 `Requirement`
- 新建的 `Requirement` 从 `phase = intake` 开始，不直接进入开发，而是进入 `Product / PM / Lead` 的正式需求评审

建议的对象链路：

- `RequirementDraft`
  - `draft`
  - `clarifying`
  - `ready_to_start`
  - `archived`
- `Requirement`
  - `phase = intake | planning | execution | qa | release | done`
  - `state = active | blocked | cancelled`

## 二、首期最小对象模型预设计

首期最小运行对象建议收敛为：

- `Project`
- `Requirement`
- `Change Request`
- `Task`
- `TaskRun`
- `VerificationRun`
- `Evidence`
- `Bug`
- `Blocker`
- `GateDecision`

职责边界：

- `Requirement` 承担外层交付对象职责
- `Change Request` 承担 `Start` 后正式需求变更对象职责
- `Task / TaskRun` 承担执行单元职责
- `VerificationRun / Evidence` 承担验证与证据职责
- `Bug` 承担 QA 正式缺陷对象职责
- `Blocker` 承担非缺陷型阻塞职责
- `GateDecision` 承担阶段出口裁决职责

## 三、用户接入型 Blocker 升级方向

当前已形成的方向：

- `Blocker` 默认内部流转
- 内部创建者不等于用户接入升级者
- 只有已影响流程推进、内部无法自愈且明确需要外部动作的 `Blocker` 才允许升级给用户

建议的升级权分配：

- 技术型 `Blocker`
  - 升级权：`Lead`
- 协调型 `Blocker`
  - 升级权：`PM`
- 业务决策型 `Blocker`
  - 升级权：`Product`

前台表达规则：

- 虽然升级权按类型分配，但最终统一通过 `Product Agent` 面向用户表达
- 对用户的升级内容必须包含：
  - 卡在哪里
  - 为什么内部无法解决
  - 需要用户做什么
  - 不处理会影响什么

用户回复后的分流方向：

- 只是补信息/给资源/做选择：优先回写 `Blocker` 处理链路
- 若改变执行基线：进入 `Change Request`

## 四、Requirement 分层字段方向

当前建议将正式 `Requirement` 按 `Product / PM / Lead / System` 四组分层建模。

### 1. 基础字段

- `id`
- `project_id`
- `draft_id`
- `code`
- `title`
- `description`
- `created_at`
- `updated_at`
- `started_at`
- `created_from`
- `baseline_version`

### 2. Product 字段

- `problem_statement`
- `business_goal`
- `target_users`
- `scope_in`
- `scope_out`
- `acceptance_criteria`
- `business_priority_note`
- `business_acceptance_status`
- `business_acceptance_note`

### 3. PM 字段

- `priority`
- `target_date`
- `dependency_summary`
- `external_dependencies`
- `delivery_risk`
- `coordination_note`
- `change_control_status`

### 4. Lead 字段

- `technical_constraints`
- `technical_assumptions`
- `implementation_direction`
- `feasibility_status`
- `feasibility_note`
- `testability_note`
- `execution_strategy_summary`

### 5. Intake 评审字段

- `product_review_status`
- `pm_review_status`
- `lead_review_status`
- `intake_review_summary`

### 6. 流程字段

- `phase`
- `state`

### 7. 系统派生字段

- `current_gate_summary`
- `open_bug_count`
- `open_blocker_count`
- `verification_summary`
- `active_task_count`
- `completed_task_count`

字段归属建议：

- `Product` 主导业务定义与业务验收相关字段
- `PM` 主导优先级、排期、依赖、协调和变更控制字段
- `Lead` 主导技术约束、技术可行性和执行方向字段
- `System` 维护聚合摘要与派生状态

## 五、Change Request 预设计

当前已形成的方向：

- `Start` 后用户仍可持续输入
- 用户输入默认先进入 `Product Agent`
- 不影响执行基线的输入不进入正式变更对象
- 影响范围、验收标准、交付边界、优先级或排期基线的输入，必须形成独立 `Change Request`
- `Change Request` 未批准前，在途 Agent 默认继续当前基线
- `Change Request` 批准后，由 `PM` 与 `Lead` 共同决定在途任务的继续、调整、暂停或取消

建议的对象职责：

- 记录谁提出了变更
- 记录变更想改什么、为什么改
- 记录变更当前状态与审批结论
- 记录对 Requirement 基线和在途任务的影响
- 记录是否触发阶段回退或任务重排

建议的高层状态：

- `draft`
- `submitted`
- `under_review`
- `approved`
- `rejected`
- `withdrawn`
- `applied`

建议的字段方向：

### 1. 基础字段

- `id`
- `project_id`
- `requirement_id`
- `code`
- `title`
- `summary`
- `created_at`
- `updated_at`
- `submitted_at`

### 2. 提出与分类字段

- `proposed_by_role`
- `proposed_by_agent_id`
- `change_type`
- `urgency`
- `reason`

### 3. 变更内容字段

- `requested_scope_change`
- `requested_acceptance_change`
- `requested_priority_change`
- `requested_target_date_change`
- `requested_delivery_change`
- `requested_notes`

### 4. 评估字段

- `product_assessment`
- `pm_impact_assessment`
- `lead_impact_assessment`
- `qa_impact_assessment`

### 5. 审批与执行字段

- `status`
- `decision_summary`
- `approved_by_role`
- `applied_at`
- `requires_phase_reopen`
- `reopen_target_phase`

### 6. 在途任务影响字段

- `affected_task_ids`
- `unaffected_task_ids`
- `needs_adjustment_task_ids`
- `invalidated_task_ids`
- `execution_impact_summary`

建议的分类方向：

- 普通澄清：不进入 `Change Request`
- Blocker 回复：不进入 `Change Request`
- 流程/优先级调整：视是否影响执行基线决定是否进入 `Change Request`
- 正式需求变更：必须进入 `Change Request`

## 六、Task 分层字段方向

首期 `Task` 建议保留 4 种类型：

- `analysis`
- `implementation`
- `verification`
- `fix`

并按 `Lead / PM / Owner / System` 分层建模。

### 1. 基础字段

- `id`
- `project_id`
- `requirement_id`
- `code`
- `type`
- `title`
- `description`
- `intent`
- `created_at`
- `updated_at`

### 2. Lead 字段

- `technical_scope`
- `acceptance_hint`
- `depends_on_task_ids`
- `target_role`
- `estimated_complexity`
- `bug_id`
- `definition_note`

### 3. PM 字段

- `priority`
- `target_date`
- `sequence_order`
- `coordination_note`
- `delivery_risk`
- `external_dependency_note`
- `tracking_status`

### 4. Owner / 执行字段

- `owner_role`
- `owner_agent_id`
- `worktree_ref`
- `status`
- `progress_note`
- `blocked_reason`
- `handoff_note`
- `completion_note`
- `started_at`
- `completed_at`

### 5. System 字段

- `current_run_id`
- `latest_verification_status`
- `open_blocker_count`
- `last_activity_at`
- `verification_summary`
- `is_ready_for_execution`
- `is_done_confirmed`

## 七、GateDecision 预设计

`GateDecision` 当前建议直接对应 `Requirement.phase` 之间的出口裁决。

建议的 gate 类型：

- `intake_to_planning`
- `planning_to_execution`
- `execution_to_qa`
- `qa_to_release`
- `release_to_done`

### 1. 基础字段

- `id`
- `project_id`
- `requirement_id`
- `gate_type`
- `created_at`
- `updated_at`

### 2. 归属字段

- `from_phase`
- `to_phase`
- `gate_owner_role`
- `decision_source_role`

### 3. 裁决字段

- `status`
- `summary`
- `reason`

### 4. 必要输入字段

- `required_inputs`
- `input_status`

建议：

- `required_inputs` 与 `input_status` 首期采用 JSON 结构
- `passed` 只能由该阶段主控 Agent 写入
- 若 `required_inputs` 未满足，不得写入 `passed`
- 否决输入由相关角色提供，正式阶段裁决由主控 Agent 落库

### 5. 关联事实字段

- `related_task_ids`
- `related_verification_run_ids`
- `related_bug_ids`
- `related_blocker_ids`

### 6. 重判链路字段

- `supersedes_gate_decision_id`

## 八、Phase 主控 Agent 方向

当前已形成的方向：

- `Requirement.phase` 必须与 `Task`、`VerificationRun`、`Bug`、`Blocker` 等执行事实关联
- 阶段不因任务状态满足而自动推进
- 系统负责聚合事实，主控 Agent 负责做正式 `GateDecision`

建议的主控分配：

- `intake -> planning`
  - 主控 Agent：`PM`
  - 必要输入：`Product`、`Lead`
- `planning -> execution`
  - 主控 Agent：`PM`
  - 必要输入：`Lead`
- `execution -> qa`
  - 主控 Agent：`Lead`
  - 必要输入：`PM`
- `qa -> release`
  - 主控 Agent：`Lead`
  - 必要输入：`QA`、`PM`
- `release -> done`
  - 主控 Agent：`PM`
  - 必要输入：`Lead`、`Product`

约束建议：

- Task 只提供阶段推进的事实基础，不直接驱动 phase 自动跳转
- 若必要输入未满足，主控 Agent 不得强行推进 Gate
- `QA` 拥有质量否决输入权，但不拥有阶段推进权
- `Product` 负责业务验收输入，但不直接承担流程推进职责

## 九、Gate 输入项方向

当前已形成一组标准输入项命名方向，后续可在正式设计中继续细化：

- `product_review_approved`
- `pm_review_approved`
- `lead_review_approved`
- `no_hard_blocker`
- `required_analysis_done`
- `execution_plan_ready`
- `task_set_ready`
- `lead_execution_ready`
- `pm_execution_ready`
- `required_implementation_done`
- `required_fix_done`
- `lead_ready_for_qa`
- `pm_ready_for_qa`
- `verification_passed`
- `no_blocking_bug`
- `pm_release_ready`
- `lead_release_recommended`
- `release_actions_completed`
- `product_acceptance_accepted`
- `lead_delivery_completed`
- `pm_closeout_ready`

`input_status` 的方向建议为对象结构，便于记录来源角色与说明：

```json
{
  "verification_passed": {
    "value": true,
    "source_role": "qa",
    "note": "qa regression run #12 passed"
  }
}
```

## 十、说明

本文档保留的是“已讨论出的预设计方向”，不是最终实现约束。

后续如果进入正式技术设计，建议继续拆出：

- 数据模型设计文档
- 状态机与 Gate 规则文档
- 权限矩阵文档
- GUI 信息架构文档
