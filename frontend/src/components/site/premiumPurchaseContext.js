import { createContext, useContext } from "react";

export const PremiumPurchaseContext = createContext(null);

/**
 * Returns `null` outside the provider so callers can fall back to the plain
 * navigation they used before the popup existed.
 */
export function usePremiumPurchase() {
  return useContext(PremiumPurchaseContext);
}
