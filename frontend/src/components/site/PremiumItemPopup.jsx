import { useEffect, useState } from "react";
import { ArrowRight, Check, ShoppingCart, X } from "lucide-react";
import { useAuth } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { addMagazineToCart } from "@/lib/cart";

const ADDED_CLOSE_DELAY_MS = 1100;

/**
 * Shown when a reader clicks a premium article or magazine anywhere on the
 * site. "Add to cart" keeps them where they were browsing; "Buy now" sends
 * them on to checkout with that issue already in the cart.
 */
export default function PremiumItemPopup({ article, onClose }) {
  const { getToken, isSignedIn } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState("idle");
  /*
   * Magazine issues use a portrait cover, which deserves to be shown whole;
   * premium articles use a wide banner, which only reads well filling the
   * panel. The image itself is the only thing that knows which it is.
   */
  const [coverFit, setCoverFit] = useState("contain");

  const authUrl = `/auth?redirect=${encodeURIComponent("/checkout")}&magazine_slug=${encodeURIComponent(article.slug)}`;

  useEffect(() => {
    function onKeyDown(event) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", onKeyDown);

    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  // The overlay covers the page, so stop the body scrolling behind it.
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  useEffect(() => {
    if (status !== "added") {
      return undefined;
    }

    const timerId = window.setTimeout(onClose, ADDED_CLOSE_DELAY_MS);

    return () => window.clearTimeout(timerId);
  }, [status, onClose]);

  const isBusy = status === "adding" || status === "buying";

  async function addToCart() {
    if (!isSignedIn) {
      navigate(authUrl);
      return;
    }

    setStatus("adding");

    try {
      await addMagazineToCart({ getToken, magazineSlug: article.slug });
      setStatus("added");
    } catch (error) {
      setStatus("idle");
      window.alert(error.message || "Unable to add magazine to cart.");
    }
  }

  async function buyNow() {
    if (!isSignedIn) {
      navigate(authUrl);
      return;
    }

    setStatus("buying");

    try {
      await addMagazineToCart({ getToken, magazineSlug: article.slug });
      onClose();
      navigate("/checkout");
    } catch (error) {
      setStatus("idle");
      window.alert(error.message || "Unable to continue checkout.");
    }
  }

  return (
    <div
      className="item-popup-overlay"
      role="presentation"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <aside
        className="purchase-popup item-popup"
        role="dialog"
        aria-modal="true"
        aria-label={`Buy ${article.title}`}
      >
        <button
          type="button"
          className="purchase-popup__close"
          aria-label="Close purchase popup"
          onClick={onClose}
        >
          <X className="size-4" />
        </button>

        <div
          className={`purchase-popup__media item-popup__media item-popup__media--${coverFit}`}
          aria-hidden="true"
        >
          <img
            src={article.image}
            alt=""
            loading="eager"
            onLoad={(event) => {
              const { naturalWidth, naturalHeight } = event.currentTarget;
              setCoverFit(naturalWidth > naturalHeight ? "cover" : "contain");
            }}
          />
        </div>

        <div className="purchase-popup__content item-popup__content">
          <p className="purchase-popup__eyebrow item-popup__eyebrow">{article.tag}</p>
          <h2>{article.title}</h2>
          <p>{article.teaser}</p>

          <div className="purchase-popup__footer item-popup__footer">
            <div className="item-popup__price">
              <span>{article.priceLabel}</span>
              <small>One-time purchase {"·"} instant access</small>
            </div>
            <div className="item-popup__actions">
              <Button
                type="button"
                variant="ghost"
                className="item-popup__secondary"
                disabled={isBusy || status === "added"}
                onClick={addToCart}
              >
                {status === "added" ? (
                  <>
                    <Check className="size-4" />
                    Added
                  </>
                ) : (
                  <>
                    <ShoppingCart className="size-4" />
                    {status === "adding" ? "Adding" : "Add to cart"}
                  </>
                )}
              </Button>
              <Button
                type="button"
                className="final-button purchase-popup__cta item-popup__primary"
                disabled={isBusy}
                onClick={buyNow}
              >
                {status === "buying" ? "Opening" : "Buy now"}
                <ArrowRight className="size-4" />
              </Button>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
