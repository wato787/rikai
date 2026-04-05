/** Stripe SDK の型差異を吸収（current_period_end は秒） */
export function subscriptionCurrentPeriodEndMs(sub: unknown): number | null {
  if (!sub || typeof sub !== "object") return null;
  const v = (sub as { current_period_end?: unknown }).current_period_end;
  if (typeof v !== "number") return null;
  return v * 1000;
}
