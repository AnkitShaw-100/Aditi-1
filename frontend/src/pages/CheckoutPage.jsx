import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { SignInButton, SignedIn, SignedOut, useAuth, useUser } from "@clerk/clerk-react";
import { AlertTriangle, ArrowRight, CheckCircle2, CreditCard, ShieldCheck, Trash2 } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { apiRequest, formatRupees } from "@/lib/api";
import { addMagazineToCart } from "@/lib/cart";
import { MAGAZINE_ISSUES, PURCHASABLE_PRODUCTS } from "@/data/siteContent";

export default function CheckoutPage() {
  useLayoutEffect(() => {
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    window.scrollTo(0, 0);
  }, []);

  return (
    <section className="account-page min-h-screen px-4 pb-16 pt-28 md:px-8">
      <div className="mx-auto max-w-5xl">
        <SignedOut>
          <div className="account-panel mx-auto max-w-xl p-6 text-center md:p-8">
            <p className="font-plex text-xs font-medium uppercase tracking-[0.18em] text-ember">
              Cart
            </p>
            <h1 className="mt-3 font-rajdhani text-4xl font-bold leading-none text-chalk">
              Sign in to view your cart.
            </h1>
            <SignInButton mode="modal" forceRedirectUrl="/checkout">
              <Button className="signin-button mt-6 h-11 rounded-none px-8 font-rajdhani text-lg font-bold">
                Sign In
              </Button>
            </SignInButton>
          </div>
        </SignedOut>

        <SignedIn>
          <CheckoutPanel />
        </SignedIn>
      </div>
    </section>
  );
}

function CheckoutPanel() {
  const { getToken } = useAuth();
  const { user } = useUser();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [cart, setCart] = useState([]);
  const [profile, setProfile] = useState(null);
  const [status, setStatus] = useState("loading");
  const [paymentStatus, setPaymentStatus] = useState("idle");
  const [message, setMessage] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [couponStatus, setCouponStatus] = useState("idle");
  const [couponError, setCouponError] = useState("");
  const autoPaymentStartedRef = useRef(false);
  const autoAddStartedRef = useRef(false);
  const autoPayRequested = searchParams.get("pay") === "1";
  const requestedSlug = searchParams.get("add");

  const loadCheckout = useCallback(async () => {
    setStatus("loading");

    try {
      const profileData = await apiRequest(getToken, "/api/me");
      const cartData = await apiRequest(getToken, "/api/cart");

      setCart(cartData.cart ?? []);
      setProfile(profileData.user ?? null);
      setStatus("ready");
    } catch (error) {
      setStatus("error");
      setMessage(error.message);
    }
  }, [getToken]);

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      loadCheckout();
    }, 0);

    return () => window.clearTimeout(timerId);
  }, [loadCheckout]);

  const cartSlugs = useMemo(
    () => new Set(cart.map((item) => item.slug)),
    [cart]
  );

  const ownedSlugs = useMemo(() => {
    const bought = profile?.magazines_bought ?? [];

    return new Set(
      bought
        .filter((item) => String(item.status ?? "").toLowerCase() === "paid")
        .map((item) => item.slug)
    );
  }, [profile]);

  // Products the reader can still add: not in the cart, not already paid for.
  const availableProducts = PURCHASABLE_PRODUCTS.filter(
    (item) => !cartSlugs.has(item.slug) && !ownedSlugs.has(item.slug)
  );
  const availableIssues = availableProducts.filter((item) =>
    MAGAZINE_ISSUES.some((issue) => issue.slug === item.slug)
  );

  async function addProducts(slugs) {
    setMessage("");

    try {
      let latestCart = null;

      for (const slug of slugs) {
        latestCart = await addMagazineToCart({ getToken, magazineSlug: slug });
      }

      setCart(latestCart?.cart ?? []);
    } catch (error) {
      setMessage(error.message);
    }
  }

  /*
   * Contributor codes cover an item outright. Razorpay cannot raise an order
   * for zero, so this never opens the payment sheet - the server grants the
   * item and we go straight to the success page.
   */
  async function redeemCoupon(event) {
    event?.preventDefault();

    const code = couponCode.trim();

    if (!code) {
      setCouponError("Enter your contributor code.");
      return;
    }

    setCouponStatus("redeeming");
    setCouponError("");

    try {
      const data = await apiRequest(getToken, "/api/coupons/redeem", {
        method: "POST",
        body: JSON.stringify({ code }),
      });

      setCouponStatus("redeemed");
      setCart(data.cart ?? []);
      navigate("/payment-success?coupon=1", {
        state: { couponItem: data.item ?? null },
      });
    } catch (error) {
      setCouponStatus("idle");
      setCouponError(error.message || "That code could not be redeemed.");
    }
  }

  async function removeItem(cartItemId) {
    try {
      const data = await apiRequest(getToken, `/api/cart/${cartItemId}`, {
        method: "DELETE",
      });
      setCart(data.cart ?? []);
    } catch (error) {
      setMessage(error.message);
    }
  }

  const totalPaise = useMemo(
    () => cart.reduce((total, item) => total + Number(item.price_paise || 0), 0),
    [cart]
  );

  const profileComplete = Boolean(
    profile?.username &&
      profile?.email &&
      profile?.phone_number &&
      profile?.dob &&
      profile?.profile_completed_at
  );

  const continueToPayment = useCallback(async () => {
    setPaymentStatus("creating");
    setMessage("");

    try {
      await loadRazorpayCheckout();
      const data = await apiRequest(getToken, "/api/payments/razorpay/order", {
        method: "POST",
      });

      const options = {
        key: data.key_id,
        amount: data.order.amount,
        currency: data.order.currency,
        name: "ADITI",
        description: "ADITI Strategy & Defence Magazine",
        order_id: data.order.id,
        prefill: {
          name: profile?.username ?? user?.fullName ?? "",
          email: profile?.email ?? user?.primaryEmailAddress?.emailAddress ?? "",
          contact: profile?.phone_number ?? user?.primaryPhoneNumber?.phoneNumber ?? "",
        },
        theme: {
          color: "#c99a4a",
        },
        handler: async (response) => {
          try {
            setPaymentStatus("verifying");
            const verified = await apiRequest(getToken, "/api/payments/razorpay/verify", {
              method: "POST",
              body: JSON.stringify(response),
            });

            setCart([]);
            setPaymentStatus("paid");
            window.sessionStorage.setItem(
              "aditi:last-paid-order",
              JSON.stringify({
                orderId: response.razorpay_order_id,
                paymentId: response.razorpay_payment_id,
                purchases: verified.purchases ?? [],
              })
            );
            navigate(`/payment-success?order=${encodeURIComponent(response.razorpay_order_id)}`, {
              replace: true,
              state: {
                orderId: response.razorpay_order_id,
                paymentId: response.razorpay_payment_id,
                purchases: verified.purchases ?? [],
              },
            });
          } catch (error) {
            setPaymentStatus("error");
            setMessage(error.message);
          }
        },
        modal: {
          ondismiss: () => {
            setPaymentStatus("idle");
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      setPaymentStatus("error");
      setMessage(error.message);
    }
  }, [getToken, navigate, profile, user]);

  useEffect(() => {
    if (
      !autoPayRequested ||
      autoPaymentStartedRef.current ||
      status !== "ready" ||
      !profileComplete ||
      !cart.length ||
      paymentStatus !== "idle"
    ) {
      return;
    }

    autoPaymentStartedRef.current = true;
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("pay");
    setSearchParams(nextParams, { replace: true });
    continueToPayment();
  }, [
    autoPayRequested,
    cart.length,
    continueToPayment,
    paymentStatus,
    profileComplete,
    searchParams,
    setSearchParams,
    status,
  ]);

  // A premium card links to /checkout?add=<slug>, so the item the reader
  // clicked lands in the cart without them hunting for it in the picker.
  useEffect(() => {
    if (!requestedSlug || autoAddStartedRef.current || status !== "ready") {
      return;
    }

    autoAddStartedRef.current = true;

    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("add");
    setSearchParams(nextParams, { replace: true });

    const isPurchasable = PURCHASABLE_PRODUCTS.some(
      (item) => item.slug === requestedSlug
    );

    if (
      !isPurchasable ||
      cartSlugs.has(requestedSlug) ||
      ownedSlugs.has(requestedSlug)
    ) {
      return;
    }

    addMagazineToCart({ getToken, magazineSlug: requestedSlug })
      .then((data) => setCart(data?.cart ?? []))
      .catch((error) => setMessage(error.message));
  }, [
    cartSlugs,
    getToken,
    ownedSlugs,
    requestedSlug,
    searchParams,
    setSearchParams,
    status,
  ]);

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1.25fr)_minmax(18rem,0.75fr)]">
      <div className="account-panel p-5 md:p-7">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="font-plex text-xs font-medium uppercase tracking-[0.18em] text-ember">
              Checkout
            </p>
            <h1 className="mt-3 font-rajdhani text-[clamp(2.2rem,7vw,4.2rem)] font-bold leading-none text-chalk">
              Your cart.
            </h1>
          </div>
        </div>

        <div className="mt-7 grid gap-3">
          {status === "loading" ? (
            <p className="font-plex text-sm text-ash">Loading cart...</p>
          ) : cart.length ? (
            cart.map((item) => {
              const product = PURCHASABLE_PRODUCTS.find(
                (entry) => entry.slug === item.slug
              );

              return (
                <article key={item.cart_item_id} className="cart-row">
                  {product ? (
                    <img
                      src={product.cover}
                      alt={`${product.label} cover`}
                      className="cart-row__cover"
                      loading="lazy"
                    />
                  ) : null}
                  <div className="cart-row-copy">
                    <p className="cart-row__issue">{product?.label ?? item.sku}</p>
                    <p className="cart-row-title">{product?.shortTitle ?? item.title}</p>
                    <p className="cart-row-price">{formatRupees(item.price_paise)}</p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="cart-row__remove h-10 w-10 shrink-0 rounded-none border border-steel/60 text-fog hover:border-ember hover:bg-plate hover:text-chalk"
                    aria-label={`Remove ${product?.shortTitle ?? item.title}`}
                    onClick={() => removeItem(item.cart_item_id)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </article>
              );
            })
          ) : (
            <p className="font-plex text-sm leading-7 text-ash">
              Your cart is empty. Add a premium dispatch from the articles section.
            </p>
          )}
          {message ? <p className="font-plex text-sm text-ember">{message}</p> : null}
        </div>

        {status === "ready" && availableProducts.length ? (
          <div className="issue-picker">
            <div className="issue-picker__head">
              <p className="issue-picker__label">
                {cart.length ? "Complete your set" : "Choose your reading"}
              </p>
              {availableIssues.length > 1 ? (
                <Button
                  type="button"
                  className="final-button issue-picker__all h-10 rounded-none px-5 font-rajdhani text-sm font-bold"
                  onClick={() => addProducts(availableIssues.map((issue) => issue.slug))}
                >
                  {availableIssues.length === 2
                    ? "Add both issues"
                    : "Add all issues"}
                </Button>
              ) : null}
            </div>

            <div className="issue-picker__grid">
              {availableProducts.map((item) => (
                <article className="issue-picker__card" key={item.slug}>
                  <img
                    src={item.cover}
                    alt={`${item.label} cover`}
                    className="issue-picker__cover"
                    loading="lazy"
                  />
                  <div className="issue-picker__copy">
                    <p className="issue-picker__issue">{item.label}</p>
                    <p className="issue-picker__title">{item.shortTitle}</p>
                    <p className="issue-picker__price">{item.priceLabel}</p>
                  </div>
                  <Button
                    type="button"
                    className="issue-picker__add h-10 rounded-none px-5 font-rajdhani text-sm font-bold"
                    onClick={() => addProducts([item.slug])}
                  >
                    Add
                  </Button>
                </article>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <aside className="account-panel checkout-payment-panel p-5 md:p-7">
        <p className="font-plex text-xs font-medium uppercase tracking-[0.18em] text-ember">
          Payment Summary
        </p>
        <div className="checkout-summary-stack mt-5 grid gap-3 border-t border-steel/50 pt-5">
          <div className="account-mini-row">
            <span>Items</span>
            <b>{cart.length}</b>
          </div>
          <div className="account-mini-row checkout-total-row">
            <span>Total</span>
            <b>{formatRupees(totalPaise)}</b>
          </div>
        </div>

        <form className="checkout-coupon mt-5" onSubmit={redeemCoupon}>
          <label className="checkout-coupon__label" htmlFor="contributor-code">
            Contributor code
          </label>
          <div className="checkout-coupon__row">
            <input
              id="contributor-code"
              className="checkout-coupon__input"
              type="text"
              inputMode="text"
              autoCapitalize="characters"
              autoComplete="off"
              spellCheck="false"
              placeholder="ADITI-MAG-XXXXXX"
              value={couponCode}
              disabled={couponStatus === "redeeming"}
              onChange={(event) => {
                setCouponCode(event.target.value.toUpperCase());
                setCouponError("");
              }}
            />
            <Button
              type="submit"
              variant="ghost"
              className="checkout-coupon__button"
              disabled={couponStatus === "redeeming" || !cart.length}
            >
              {couponStatus === "redeeming" ? "Checking" : "Apply"}
            </Button>
          </div>
          {couponError ? (
            <p className="checkout-coupon__error" role="alert">
              {couponError}
            </p>
          ) : (
            <p className="checkout-coupon__hint">
              Covers one item at no cost. Keep just that item in your cart.
            </p>
          )}
        </form>

        {!profileComplete ? (
          <div className="checkout-profile-gate mt-5">
            <div className="checkout-status-icon" aria-hidden="true">
              <AlertTriangle className="size-5" />
            </div>
            <p className="checkout-gate-label">Profile required</p>
            <p className="font-rajdhani text-2xl font-bold leading-tight text-chalk">
              Complete profile to unlock payment
            </p>
            <p className="mt-2 font-plex text-sm leading-6 text-ash">
              Payment opens right after your saved profile is confirmed.
            </p>
            <Button
              asChild
              className="final-button checkout-profile-button mt-4 h-11 w-full rounded-none px-4 font-rajdhani text-base font-bold"
            >
              <Link to={`/profile?redirect=${encodeURIComponent("/checkout?pay=1")}`}>
                <CreditCard className="size-4" />
                Continue to Payment
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        ) : (
          <div className="checkout-payment-ready mt-5">
            <div className="checkout-status-icon" aria-hidden="true">
              <CheckCircle2 className="size-5" />
            </div>
            <p className="font-rajdhani text-xl font-bold text-chalk">Payment is ready</p>
            <p className="mt-2 font-plex text-sm leading-6 text-ash">
              Your saved profile will be used for Razorpay, order records, and the receipt email.
            </p>
            <Button
              type="button"
              disabled={!cart.length || paymentStatus === "creating" || paymentStatus === "verifying"}
              onClick={continueToPayment}
              className="final-button checkout-pay-button mt-4 h-11 w-full rounded-none px-6 font-rajdhani text-base font-bold"
            >
              <CreditCard className="size-4" />
              {paymentStatus === "creating"
                ? "Creating Order"
                : paymentStatus === "verifying"
                  ? "Verifying"
                  : "Continue to Payment"}
            </Button>
          </div>
        )}

        <p className="checkout-secure-note mt-3 font-plex text-xs leading-5 text-fog">
          <ShieldCheck className="size-4" />
          Secure payment opens through Razorpay. After successful verification, you will be taken to your download page and the receipt will be emailed.
        </p>
      </aside>
    </div>
  );
}

function loadRazorpayCheckout() {
  if (window.Razorpay) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const existing = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');

    if (existing) {
      existing.addEventListener("load", resolve, { once: true });
      existing.addEventListener("error", () => reject(new Error("Unable to load Razorpay Checkout.")), {
        once: true,
      });
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = resolve;
    script.onerror = () => reject(new Error("Unable to load Razorpay Checkout."));
    document.body.appendChild(script);
  });
}
