/** 無料プラン: 保持できるロードマップの上限 */
export const FREE_ROADMAP_MAX = 3;

/** 無料プラン: 暦月（UTC）あたりの AI ロードマップ生成回数 */
export const FREE_AI_GENERATIONS_PER_MONTH = 3;

/** Pro: 暦月（UTC）あたりの AI 生成上限（実質十分な枠） */
export const PRO_AI_GENERATIONS_PER_MONTH = 100;

/** 現在の利用集計用キー `YYYY-MM`（UTC） */
export function currentAiUsageMonthKey(): string {
  return new Date().toISOString().slice(0, 7);
}
