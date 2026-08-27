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

function HashScroll() {
  const { hash, pathname } = useLocation();

  useEffect(() => {
    if (!hash) {
      return undefined;
    }

    const targetId = hash.slice(1);
    const timerId = window.setTimeout(() => {
      const target = document.getElementById(targetId);

      if (!target) {
        return;
      }

      const headerOffset = 96;
      const targetTop =
        target.getBoundingClientRect().top + window.scrollY - headerOffset;

      window.scrollTo({
        top: Math.max(0, targetTop),
        behavior: "smooth",
      });
    }, 0);

    return () => window.clearTimeout(timerId);
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
