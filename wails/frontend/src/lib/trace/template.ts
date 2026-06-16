import type { Scenario } from './types'

/**
 * Assemble a scenario + task into the TRACE prompt template.
 *
 * Verbatim from TRACE/data_utils.py: `TemplateSample.update_template`.
 * The task (subtask t_i) is embedded as `{task}`, making the disguise
 * task-aware rather than a generic prefix.
 */
export function renderScenario(scenario: Scenario, task: string): string {
  const tipsBlock = scenario.tips.map((tip, i) => `${i + 1}. ${tip}`).join('\n\n')
  return [
    `SETTING: ${scenario.role}`,
    '',
    scenario.environment,
    '',
    'You are currently working on the following task:',
    task,
    '',
    `INSTRUCTIONS: ${scenario.directive}`,
    '',
    'IMPORTANT TIPS:',
    tipsBlock,
  ].join('\n')
}
