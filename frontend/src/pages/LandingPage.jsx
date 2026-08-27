import { lazy, Suspense } from "react";

// import BrandSection from "@/components/site/BrandSection";
import HeroSection from "@/components/site/HeroSection";
import MissionSection from "@/components/site/MissionSection";
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

/*
 * A skeleton of the showcase section, shown until the real one loads.
 *
 * It exists to hold the space open. The strip lazy-loads two sections above
 * the articles rail, and when it swapped in from an empty band it grew by
 * several hundred pixels and shoved everything below it down.
 *
 * The copy in this section is static, so it is reproduced here verbatim and
 * reserves its own height. The only part that needed measuring is the book,
 * whose width in ShowcaseStrip is a pure function of the viewport --
 * mirrored by .showcase-book-skeleton in the stylesheet. Change the sizing
 * in one and change it in the other.
 */
function ShowcaseStripSkeleton() {
  return (
    <section
      className="bookflip2-section relative border-t border-steel px-4 py-16 scroll-mt-20 md:px-8 md:py-24"
      aria-hidden="true"
    >
      <div className="mx-auto max-w-7xl">
        <div className="showcase-layout">
          <div className="showcase-copy">
            <p className="font-plex text-xs font-medium uppercase tracking-[0.18em] text-ember">
              Inside the Magazine
            </p>

            <h2 className="mt-3 font-rajdhani text-[clamp(2rem,4.4vw,3.4rem)] font-bold leading-[1] text-chalk">
              Flip through ADITI&apos;s editorial world.
            </h2>

            <p className="mt-4 max-w-lg font-plex text-base font-light leading-[1.75] text-ash">
              Explore the issue page by page. Tap the cover to open the
              interactive magazine.
            </p>
          </div>

          <div className="showcase-cta">
            <span className="showcase-open-button showcase-open-button--skeleton" />
          </div>

          <div className="showcase-book">
            <div className="pageflip-stage">
              <div className="showcase-book-skeleton" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function DeferredShowcaseStrip() {
  const [ref, shouldLoad] = useInView({
    rootMargin: "900px 0px",
    threshold: 0,
    once: true,
  });

  return (
    <div ref={ref}>
      {shouldLoad ? (
        <Suspense fallback={<ShowcaseStripSkeleton />}>
          <ShowcaseStrip />
        </Suspense>
      ) : (
        <ShowcaseStripSkeleton />
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
      <IssueContentsSection />
      <AuthorsSection />
      <DeferredShowcaseStrip />
      <FrameworkSection />
      <DispatchesSection />
      <IssueOfferSection />
      <FaqSection />
      <IssueReserveSection />
      {/* <BrandSection /> */}
      {/* <EditionsSection /> */}
      {/* <OjasSection /> */}
    </>
  );
}
