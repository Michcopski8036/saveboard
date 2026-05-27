import { registerPlugin } from '@capacitor/core';

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

// NOTE: verify exact monthly ID in App Store Connect if purchase fails
export const IAP_PRODUCTS = {
  proMonthly: 'app.saveboard.pro.per.monthly',
  proYearly:  'app.saveboard.pro.yearly',
} as const;
