import Stripe from "stripe";

/**
 * Stripe 公式の推奨に近づけるため SDK 経由でクライアントを生成する。
 * （`maxNetworkRetries` で一時的なネットワークエラーを軽減）
 */
export function createStripeClient(secretKey: string): Stripe {
  return new Stripe(secretKey, {
    typescript: true,
    maxNetworkRetries: 2,
  });
}
