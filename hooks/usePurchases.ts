/**
 * Hook for purchase state management.
 * Provides current entitlement and feature gating.
 */

import { useState, useEffect, useCallback } from 'react';
import purchaseService from '../services/purchases';
import type { PurchaseState } from '../types';

export function usePurchases() {
  const [state, setState] = useState<PurchaseState>({
    entitlement: 'free',
    recordCount: 0,
    canCreateRecord: true,
    canRecord: false,
    canUseTemplates: false,
  });

  const refresh = useCallback(async () => {
    const purchaseState = await purchaseService.getPurchaseState();
    setState(purchaseState);
  }, []);

  useEffect(() => {
    purchaseService.initialize().then(refresh);
  }, [refresh]);

  return { ...state, refresh };
}

export default usePurchases;
