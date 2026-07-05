import { useEffect, useMemo, useState } from "react";
import { ArrowRight, ShoppingCart, X } from "lucide-react";
import { useAuth, useClerk } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { DISPATCHES } from "@/data/siteContent";
import { addMagazineToCart } from "@/lib/cart";

const SHOW_DELAY_MS = 2500;

export default function PurchaseNudgePopup() {
  const { getToken, isSignedIn } = useAuth();
  const { openSignIn } = useClerk();
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [status, setStatus] = useState("idle");

  const featuredArticle = useMemo(
    () => DISPATCHES.find((item) => item.type === "premium") ?? DISPATCHES[0],
    []
  );

  useEffect(() => {
    if (isDismissed) {
      return undefined;
    }

    const showTimer = window.setTimeout(() => {
      setIsVisible(true);
    }, SHOW_DELAY_MS);

    return () => window.clearTimeout(showTimer);
  }, [isDismissed]);

  if (!isVisible || !featuredArticle) {
    return null;
  }

  const authUrl = `/auth?redirect=${encodeURIComponent("/checkout")}&magazine_slug=${encodeURIComponent(featuredArticle.slug)}`;

  async function buyNow() {
    if (!isSignedIn) {
      setIsVisible(false);
      setIsDismissed(true);
      openSignIn({
        forceRedirectUrl: authUrl,
        signUpForceRedirectUrl: authUrl,
      });
      return;
    }

    setStatus("adding");

    try {
      await addMagazineToCart({ getToken, magazineSlug: featuredArticle.slug });
      setIsVisible(false);
      setIsDismissed(true);
      navigate("/checkout");
    } catch (error) {
      setStatus("error");
      window.alert(error.message || "Unable to continue checkout.");
      setStatus("idle");
    }
  }

  return (
    <aside className="purchase-popup" aria-label="Buy magazine popup" role="status">
      <button
        type="button"
        className="purchase-popup__close"
        aria-label="Close magazine popup"
        onClick={() => {
          setIsVisible(false);
          setIsDismissed(true);
        }}
      >
        <X className="size-4" />
      </button>

      <div className="purchase-popup__media" aria-hidden="true">
        <img src={featuredArticle.image} alt="" loading="eager" />
      </div>

      <div className="purchase-popup__content">
        <p className="purchase-popup__eyebrow">Magazine access</p>
        <h2>Buy the inaugural ADITI magazine.</h2>
        <p>
          Sign in only when you choose to buy. Payment opens securely from checkout.
        </p>
        <div className="purchase-popup__footer">
          <span>{featuredArticle.priceLabel}</span>
          <Button
            type="button"
            className="final-button purchase-popup__cta"
            disabled={status === "adding"}
            onClick={buyNow}
          >
            <ShoppingCart className="size-4" />
            {status === "adding" ? "Adding" : "Buy Now"}
            <ArrowRight className="size-4" />
          </Button>
        </div>
      </div>
    </aside>
  );
}
