import { useEffect } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";

import SiteHeader from "@/components/site/Header";
import SiteFooter from "@/components/site/SiteFooter";
import { RadarCursor } from "@/components/site/shared";
import LandingPage from "@/pages/LandingPage";
import ProfilePage from "@/pages/ProfilePage";
import CheckoutPage from "@/pages/CheckoutPage";
import PaymentSuccessPage from "@/pages/PaymentSuccessPage";
import AuthPage from "@/pages/AuthPage";
import ArticlePage from "@/pages/ArticlePage";
import AdminLoginPage from "@/pages/AdminLoginPage";
import AdminDashboardPage from "@/pages/AdminDashboardPage";
import { ADMIN_DASHBOARD_PATH, ADMIN_ENTRY_PATH } from "@/lib/adminRoutes";
import { PremiumPurchaseProvider } from "@/components/site/PremiumPurchaseProvider";

const HEADER_OFFSET = 96;

/*
 * Anchor scrolling has to survive the page growing underneath it. The landing
 * page lazy-loads its showcase strip behind an empty placeholder, and images
 * and webfonts land later still, so a target measured once on click is stale
 * a few hundred milliseconds later - which is how "Articles" used to leave
 * the reader parked on the section above it.
 *
 * So rather than measuring once, keep watching the target's document position
 * for a couple of seconds and re-aim whenever something above it changes
 * size. Any real scroll input from the reader ends it immediately.
 */
const SETTLE_WINDOW_MS = 2500;

function HashScroll() {
  const { hash, pathname } = useLocation();

  useEffect(() => {
    if (!hash) {
      return undefined;
    }

    const targetId = decodeURIComponent(hash.slice(1));
    const deadline = performance.now() + SETTLE_WINDOW_MS;
    const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let frameId = 0;
    let cancelled = false;
    let lastTop = null;

    const stop = () => {
      cancelled = true;
      window.cancelAnimationFrame(frameId);
    };

    const step = () => {
      if (cancelled) {
        return;
      }

      const target = document.getElementById(targetId);

      if (target) {
        // Document-space, so this only moves when layout above the target
        // changes - never merely because the page is scrolling.
        const top = Math.max(
          0,
          target.getBoundingClientRect().top + window.scrollY - HEADER_OFFSET
        );

        if (lastTop === null || Math.abs(top - lastTop) > 1) {
          window.scrollTo({ top, behavior: smooth ? "smooth" : "auto" });
          lastTop = top;
        }
      }

      if (performance.now() < deadline) {
        frameId = window.requestAnimationFrame(step);
      }
    };

    frameId = window.requestAnimationFrame(step);

    // The reader taking over always wins.
    window.addEventListener("wheel", stop, { passive: true });
    window.addEventListener("touchstart", stop, { passive: true });
    window.addEventListener("keydown", stop);

    return () => {
      stop();
      window.removeEventListener("wheel", stop);
      window.removeEventListener("touchstart", stop);
      window.removeEventListener("keydown", stop);
    };
  }, [hash, pathname]);

  return null;
}

function App() {
  return (
    <PremiumPurchaseProvider>
      <div className="min-h-screen overflow-x-hidden bg-void text-chalk">
        <HashScroll />
        <RadarCursor />
        <SiteHeader />

        <main>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/payment-success" element={<PaymentSuccessPage />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/articles/:slug" element={<ArticlePage />} />
            <Route path={ADMIN_ENTRY_PATH} element={<AdminLoginPage />} />
            <Route path={ADMIN_DASHBOARD_PATH} element={<AdminDashboardPage />} />
            <Route path="/admin" element={<Navigate to="/" replace />} />
            <Route path="/admin/login" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        <SiteFooter />
      </div>
    </PremiumPurchaseProvider>
  );
}

export default App;
