import { useEffect, useLayoutEffect, useMemo, useState } from "react";
import { SignIn, SignedIn, SignedOut, useAuth } from "@clerk/clerk-react";
import { ArrowRight } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/api";

function safeRedirectPath(value) {
  if (typeof value === "string" && value.startsWith("/") && !value.startsWith("//")) {
    return value;
  }

  return "/checkout";
}

export default function AuthPage() {
  const [searchParams] = useSearchParams();
  const redirectTo = safeRedirectPath(searchParams.get("redirect"));
  const magazineSlug = searchParams.get("magazine_slug") || "";

  useLayoutEffect(() => {
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    window.scrollTo(0, 0);
  }, [magazineSlug, redirectTo]);

  const completionUrl = useMemo(() => {
    const params = new URLSearchParams({ redirect: redirectTo });

    if (magazineSlug) {
      params.set("magazine_slug", magazineSlug);
    }

    return `/auth?${params.toString()}`;
  }, [magazineSlug, redirectTo]);

  return (
    <section className="account-page grid min-h-screen place-items-center px-4 py-20 md:px-8">
      <div className="mx-auto grid w-full max-w-3xl justify-items-center">
        <SignedOut>
          <div className="auth-widget auth-widget--standalone">
            <SignIn routing="hash" forceRedirectUrl={completionUrl} />
          </div>
        </SignedOut>

        <SignedIn>
          <PendingCartRedirect redirectTo={redirectTo} magazineSlug={magazineSlug} />
        </SignedIn>
      </div>
    </section>
  );
}

function PendingCartRedirect({ redirectTo, magazineSlug }) {
  const navigate = useNavigate();
  const { getToken, isLoaded } = useAuth();
  const [message, setMessage] = useState("Preparing checkout...");

  useEffect(() => {
    if (!isLoaded) {
      return undefined;
    }

    let active = true;

    async function continueFlow() {
      try {
        if (magazineSlug) {
          await apiRequest(getToken, "/api/cart", {
            method: "POST",
            body: JSON.stringify({ magazine_slug: magazineSlug }),
          });
        }

        if (active) {
          navigate(redirectTo, { replace: true });
        }
      } catch (error) {
        if (active) {
          setMessage(error.message || "Unable to continue checkout.");
        }
      }
    }

    continueFlow();

    return () => {
      active = false;
    };
  }, [getToken, isLoaded, magazineSlug, navigate, redirectTo]);

  return (
    <div className="account-panel mx-auto max-w-xl p-6 text-center md:p-8">
      <p className="font-plex text-xs font-medium uppercase tracking-[0.18em] text-ember">
        Checkout
      </p>
      <h1 className="mt-3 font-rajdhani text-4xl font-bold leading-none text-chalk">
        {message}
      </h1>
      <p className="mt-4 font-plex text-sm leading-7 text-ash">
        Keep this page open while we take you to your cart.
      </p>
      {message !== "Preparing checkout..." ? (
        <Button
          asChild
          variant="ghost"
          className="mt-6 h-11 rounded-none border border-steel/70 px-5 font-rajdhani text-base font-bold text-chalk hover:border-ember hover:bg-plate hover:text-chalk"
        >
          <Link to="/checkout">
            Open Checkout <ArrowRight className="size-4" />
          </Link>
        </Button>
      ) : null}
    </div>
  );
}
