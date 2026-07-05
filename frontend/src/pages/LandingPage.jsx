import { lazy, Suspense } from "react";

import HeroSection from "@/components/site/HeroSection";
import MissionSection from "@/components/site/MissionSection";
// import BrandSection from "@/components/site/BrandSection";
import IssueContentsSection from "@/components/site/IssueContentsSection";
import AuthorsSection from "@/components/site/AuthorsSection";
import FrameworkSection from "@/components/site/FrameworkSection";
import DispatchesSection from "@/components/site/DispatchesSection";
import IssueOfferSection from "@/components/site/IssueOfferSection";
import FaqSection from "@/components/site/FaqSection";
import IssueReserveSection from "@/components/site/IssueReserveSection";
import ReaderFeedbackSection from "@/components/site/ReaderFeedbackSection";
import PurchaseNudgePopup from "@/components/site/PurchaseNudgePopup";
import { useInView } from "@/hooks/use-in-view";

const ShowcaseStrip = lazy(() => import("@/components/site/ShowcaseStrip"));

function DeferredShowcaseStrip() {
  const [ref, shouldLoad] = useInView({
    rootMargin: "900px 0px",
    threshold: 0,
    once: true,
  });

  return (
    <div ref={ref}>
      {shouldLoad ? (
        <Suspense
          fallback={
            <section
              className="bookflip2-section bookflip2-section--placeholder border-t border-steel px-4 py-16 md:px-8 md:py-24"
              aria-hidden="true"
            />
          }
        >
          <ShowcaseStrip />
        </Suspense>
      ) : (
        <section
          className="bookflip2-section bookflip2-section--placeholder border-t border-steel px-4 py-16 md:px-8 md:py-24"
          aria-hidden="true"
        />
      )}
    </div>
  );
}

export default function LandingPage() {
  return (
    <>
      <PurchaseNudgePopup />
      <HeroSection />
      <MissionSection />
      <ReaderFeedbackSection />
      {/* <BrandSection /> */}
      <IssueContentsSection />
      <AuthorsSection />
      <DeferredShowcaseStrip />
      <FrameworkSection />
      <DispatchesSection />
      <IssueOfferSection />
      <FaqSection />
      <IssueReserveSection />
      {/* <EditionsSection /> */}
      {/* <OjasSection /> */}
    </>
  );
}
