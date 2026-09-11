import { registerPlugin, Capacitor } from '@capacitor/core';

export interface StoreProduct {
  id: string;
  title: string;
  description: string;
  price: string;
  displayPrice: string;
}

export interface StoreTransaction {
  transactionId: string;
  productId: string;
  originalTransactionId: string;
  expiresDate?: string;
}

interface StoreKitPlugin {
  getProducts(options: { productIds: string[] }): Promise<{ products: StoreProduct[] }>;
  purchase(options: { productId: string }): Promise<StoreTransaction>;
  restorePurchases(): Promise<{ transactions: StoreTransaction[] }>;
}

export const StoreKit = registerPlugin<StoreKitPlugin>('StoreKit');

// 상품 ID 는 스토어마다 따로 만든다 — 같은 문자열을 쓸 수 없다.
// iOS: App Store Connect 의 구독 ID (기존).
//   ⚠️ monthly 의 'per' 는 오타처럼 보이지만 실제 등록된 ID다. 결제가 실패하면 여기부터 확인.
// Android: Play Console → Monetize → Subscriptions 의 상품 ID.
//   Play 는 소문자·숫자·밑줄·마침표만 받고 문자로 시작해야 한다.
const APPLE_PRODUCTS = {
  proMonthly: 'app.saveboard.pro.per.monthly',
  proYearly:  'app.saveboard.pro.yearly',
} as const;
const GOOGLE_PRODUCTS = {
  proMonthly: 'pro_monthly',
  proYearly:  'pro_yearly',
} as const;

export const IAP_PRODUCTS =
  Capacitor.getPlatform() === 'android' ? GOOGLE_PRODUCTS : APPLE_PRODUCTS;

/** 구매를 어느 스토어에서 했는지 — subscriptions.source 에 그대로 들어간다. */
export const STORE_SOURCE = Capacitor.getPlatform() === 'android' ? 'google' : 'apple';
