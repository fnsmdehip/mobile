/**
 * RevenueCat Integration for cnsnt app.
 *
 * Free tier: 5 consent records, no recording
 * Pro tier ($4.99/mo): unlimited records, recording, all templates
 *
 * Uses AsyncStorage for offline entitlement caching.
 * RevenueCat SDK is configured but gracefully degrades if unavailable.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { FREE_TIER_LIMIT } from '../constants/theme';
import type { Entitlement, PurchaseState } from '../types';

const ENTITLEMENT_CACHE_KEY = 'cnsnt_entitlement';
const RECORD_COUNT_KEY = 'cnsnt_record_count';

/**
 * Initialize RevenueCat.
 * In a production build this would call Purchases.configure().
 * For the managed Expo workflow, we use a mock that checks cached state.
 */
async function initializeRevenueCat(): Promise<void> {
  // RevenueCat SDK initialization would go here in production:
  // await Purchases.configure({ apiKey: RC_API_KEY });
  //
  // For Expo managed workflow, the actual RC SDK requires a custom dev client.
  // We provide the integration point and cache the entitlement state.
}

class PurchaseService {
  private initialized: boolean = false;

  /**
   * Initialize the purchase service.
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      await initializeRevenueCat();
      this.initialized = true;
    } catch (_error) {
      // Graceful degradation - app works in free tier
    }
  }

  /**
   * Get the current entitlement level.
   */
  async getEntitlement(): Promise<Entitlement> {
    try {
      // In production, this would check RevenueCat:
      // const customerInfo = await Purchases.getCustomerInfo();
      // const isPro = customerInfo.entitlements.active[PRO_ENTITLEMENT_ID] != null;

      const cached = await AsyncStorage.getItem(ENTITLEMENT_CACHE_KEY);
      if (cached === 'pro') return 'pro';
      return 'free';
    } catch {
      return 'free';
    }
  }

  /**
   * Get the current record count from cache.
   */
  async getRecordCount(): Promise<number> {
    const count = await AsyncStorage.getItem(RECORD_COUNT_KEY);
    return count ? parseInt(count, 10) : 0;
  }

  /**
   * Update the record count cache.
   */
  async updateRecordCount(count: number): Promise<void> {
    await AsyncStorage.setItem(RECORD_COUNT_KEY, count.toString());
  }

  /**
   * Get full purchase state for UI gating.
   */
  async getPurchaseState(): Promise<PurchaseState> {
    const entitlement = await this.getEntitlement();
    const recordCount = await this.getRecordCount();
    const isPro = entitlement === 'pro';

    return {
      entitlement,
      recordCount,
      canCreateRecord: isPro || recordCount < FREE_TIER_LIMIT,
      canRecord: isPro,
      canUseTemplates: isPro,
    };
  }

  /**
   * Check if a specific feature is available.
   */
  async canAccess(feature: 'recording' | 'templates' | 'create_record'): Promise<boolean> {
    const state = await this.getPurchaseState();
    switch (feature) {
      case 'recording':
        return state.canRecord;
      case 'templates':
        return state.canUseTemplates;
      case 'create_record':
        return state.canCreateRecord;
      default:
        return false;
    }
  }

  /**
   * Purchase Pro subscription.
   * In production, this triggers the RevenueCat purchase flow.
   */
  async purchasePro(): Promise<boolean> {
    try {
      // In production:
      // const { customerInfo } = await Purchases.purchasePackage(proPackage);
      // const isPro = customerInfo.entitlements.active[PRO_ENTITLEMENT_ID] != null;

      // This would be replaced by actual RevenueCat result:
      // await AsyncStorage.setItem(ENTITLEMENT_CACHE_KEY, 'pro');
      // return true;

      return false; // No actual purchase in dev mode
    } catch (_error) {
      return false;
    }
  }

  /**
   * Restore purchases (for users who already paid).
   */
  async restorePurchases(): Promise<Entitlement> {
    try {
      // In production:
      // const customerInfo = await Purchases.restorePurchases();
      // const isPro = customerInfo.entitlements.active[PRO_ENTITLEMENT_ID] != null;

      const cached = await AsyncStorage.getItem(ENTITLEMENT_CACHE_KEY);
      return cached === 'pro' ? 'pro' : 'free';
    } catch {
      return 'free';
    }
  }

  /**
   * Get available packages/offerings for display.
   */
  async getOfferings(): Promise<{
    proMonthly: { price: string; identifier: string } | null;
  }> {
    try {
      // In production:
      // const offerings = await Purchases.getOfferings();
      // const monthly = offerings.current?.availablePackages.find(p => p.identifier === '$rc_monthly');

      return {
        proMonthly: {
          price: '$4.99/mo',
          identifier: 'cnsnt_pro_monthly',
        },
      };
    } catch {
      return { proMonthly: null };
    }
  }

  /**
   * Check if user is in free tier and at limit.
   */
  async isAtFreeLimit(): Promise<boolean> {
    const state = await this.getPurchaseState();
    return state.entitlement === 'free' && state.recordCount >= FREE_TIER_LIMIT;
  }
}

export const purchaseService = new PurchaseService();
export default purchaseService;
