import { useCallback, useMemo, useState } from "react";

import PremiumItemPopup from "@/components/site/PremiumItemPopup";
import { PremiumPurchaseContext } from "@/components/site/premiumPurchaseContext";

/**
 * Premium CTAs live in half a dozen sections, so the popup is owned once at
 * the app root and opened through this context instead of each section
 * rendering its own copy.
 */
export function PremiumPurchaseProvider({ children }) {
  const [article, setArticle] = useState(null);

  const openPremiumPopup = useCallback((item) => {
    if (!item?.slug) {
      return;
    }

    setArticle(item);
  }, []);

  const closePremiumPopup = useCallback(() => setArticle(null), []);

  const value = useMemo(
    () => ({ openPremiumPopup, closePremiumPopup }),
    [openPremiumPopup, closePremiumPopup]
  );

  return (
    <PremiumPurchaseContext.Provider value={value}>
      {children}
      {article ? (
        <PremiumItemPopup article={article} onClose={closePremiumPopup} />
      ) : null}
    </PremiumPurchaseContext.Provider>
  );
}

