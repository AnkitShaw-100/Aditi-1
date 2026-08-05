import { useEffect, useRef, useState } from "react";
import { ArrowRight, ChevronLeft, ChevronRight, X } from "lucide-react";
import HTMLFlipBook from "react-pageflip";

import SectionReveal from "@/components/site/SectionReveal";
import { AddToCartButton } from "@/components/site/shared";
import { Button } from "@/components/ui/button";
import { PAGEFLIP_PAGES } from "@/data/pageflipPages";
import { DISPATCHES } from "@/data/siteContent";
import { useIsMobile } from "@/hooks/use-mobile";

const BOOK_PAGE_FRAME_RATIO = 1.2941176471;

function loopPage(page, pageCount) {
  if (pageCount <= 0) {
    return 0;
  }

  return ((page % pageCount) + pageCount) % pageCount;
}

function MobileMagazineViewer({ currentPage, direction }) {
  const page = PAGEFLIP_PAGES[currentPage] ?? PAGEFLIP_PAGES[0];

  return (
    <div className="mobile-magazine-viewer">
      <div className="mobile-magazine-viewer__frame">
        <article
          key={currentPage}
          className="mobile-magazine-page"
          data-direction={direction}
        >
          <div className="mobile-magazine-page__inner">
            <img
              src={page.image}
              alt={page.alt}
              className="mobile-magazine-page__image"
              loading="eager"
              draggable={false}
            />
          </div>
        </article>
      </div>
    </div>
  );
}

function ReactPageFlipShowcase() {
  const bookRef = useRef(null);
  const stageRef = useRef(null);
  const isMobile = useIsMobile();
  const [stageWidth, setStageWidth] = useState(320);
  const [currentPage, setCurrentPage] = useState(0);
  const [direction, setDirection] = useState("next");
  const [dismissedEndCta, setDismissedEndCta] = useState(false);
  const pageCount = PAGEFLIP_PAGES.length;
  const premiumMagazine = DISPATCHES.find((item) => item.type === "premium");

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) {
      return undefined;
    }

    const updateWidth = () => {
      const viewportWidth = window.innerWidth || stage.clientWidth;
      setStageWidth(Math.min(stage.clientWidth, viewportWidth));
    };

    updateWidth();
    const observer = new ResizeObserver(updateWidth);
    observer.observe(stage);
    window.addEventListener("resize", updateWidth);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateWidth);
    };
  }, []);

  const bookWidth =
    stageWidth < 768
      ? Math.min(Math.max((stageWidth - 28) * 0.6, 190), 240)
      : Math.min(Math.max(stageWidth * 0.37, 300), 456);
  const bookHeight = Math.round(bookWidth * BOOK_PAGE_FRAME_RATIO);

  useEffect(() => {
    if (isMobile) {
      return undefined;
    }

    const flip = bookRef.current?.pageFlip?.();
    if (!flip) {
      return undefined;
    }

    const activePage = flip.getCurrentPageIndex();
    const nextPage = loopPage(currentPage, pageCount);
    if (activePage === nextPage) {
      return undefined;
    }

    const forwardPage = loopPage(activePage + 1, pageCount);
    const backwardPage = loopPage(activePage - 1, pageCount);

    if (nextPage === forwardPage) {
      if (activePage === pageCount - 1 && nextPage === 0) {
        flip.turnToPage(0);
      } else {
        flip.flipNext("bottom");
      }
      return undefined;
    }

    if (nextPage === backwardPage) {
      if (activePage === 0 && nextPage === pageCount - 1) {
        flip.turnToPage(pageCount - 1);
      } else {
        flip.flipPrev("bottom");
      }
      return undefined;
    }

    flip.turnToPage(nextPage);
    return undefined;
  }, [currentPage, isMobile, pageCount]);

  const goPrev = () => {
    setDirection("prev");
    setCurrentPage((page) => Math.max(0, page - 1));
  };

  const goNext = () => {
    setDirection("next");
    setCurrentPage((page) => Math.min(pageCount - 1, page + 1));
  };

  const handleFlip = (event) => {
    setDirection(event.data > currentPage ? "next" : "prev");
    setCurrentPage(event.data);
  };

  const displayPage = Math.min(currentPage + 1, pageCount);
  const canGoPrev = currentPage > 0;
  const canGoNext = currentPage < pageCount - 1;
  const showEndCta = displayPage === pageCount && !dismissedEndCta && premiumMagazine;

  useEffect(() => {
    if (displayPage !== pageCount) {
      setDismissedEndCta(false);
    }
  }, [displayPage, pageCount]);

  return (
    <section
      className="bookflip2-section border-t border-steel px-4 py-16 scroll-mt-20 md:px-8 md:py-24"
      aria-label="ADITI magazine preview"
    >
      <SectionReveal>
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 mx-auto max-w-2xl text-center">
            <p className="font-plex text-xs font-medium uppercase tracking-[0.18em] text-ember">
              Inside the Magazine
            </p>
            <h2 className="mt-3 font-rajdhani text-[clamp(2rem,6vw,4rem)] font-bold leading-[0.95] text-chalk">
              Flip through ADITI&apos;s editorial world.
            </h2>
            <p className="mt-4 mx-auto max-w-lg font-plex text-base font-light leading-[1.75] text-ash">
              Use the controls to move through the preview at your own pace.
            </p>
          </div>

          <div
            ref={stageRef}
            className="pageflip-stage"
            style={{ "--book-w": `${bookWidth}px`, "--book-h": `${bookHeight}px` }}
          >
            <div className="pageflip-shell">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="pageflip-shell__nav pageflip-shell__nav--prev hidden h-11 w-11 shrink-0 rounded-full border-steel/50 bg-bunker/80 text-chalk hover:border-ember/50 hover:bg-plate md:inline-flex"
                aria-label="Previous page"
                disabled={!canGoPrev}
                onClick={goPrev}
              >
                <ChevronLeft className="size-5" />
              </Button>

              <div className="pageflip-shell__center">
                <div className="pageflip-shell__book-wrap">
                  {isMobile ? (
                    <MobileMagazineViewer
                      currentPage={currentPage}
                      direction={direction}
                    />
                  ) : (
                    <>
                      <HTMLFlipBook
                        key={`${bookWidth}x${bookHeight}`}
                        ref={bookRef}
                        width={bookWidth}
                        height={bookHeight}
                        size="fixed"
                        minWidth={190}
                        maxWidth={456}
                        minHeight={246}
                        maxHeight={590}
                        showCover={false}
                        drawShadow
                        flippingTime={760}
                        usePortrait={false}
                        startZIndex={20}
                        autoSize={false}
                        maxShadowOpacity={0.22}
                        mobileScrollSupport={false}
                        swipeDistance={0}
                        clickEventForward={false}
                        useMouseEvents={false}
                        onFlip={handleFlip}
                        className="pageflip-book"
                      >
                        {PAGEFLIP_PAGES.map((page, index) => (
                          <div key={`${page.alt}-${index}`} className="pageflip-page">
                            <div className="pageflip-page-inner">
                              <img
                                src={page.image}
                                alt={page.alt}
                                className="pageflip-page-image"
                                loading={index < 2 ? "eager" : "lazy"}
                                draggable={false}
                              />
                            </div>
                          </div>
                        ))}
                      </HTMLFlipBook>
                    </>
                  )}
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                size="icon"
                className="pageflip-shell__nav pageflip-shell__nav--next hidden h-11 w-11 shrink-0 rounded-full border-steel/50 bg-bunker/80 text-chalk hover:border-ember/50 hover:bg-plate md:inline-flex"
                aria-label="Next page"
                disabled={!canGoNext}
                onClick={goNext}
              >
                <ChevronRight className="size-5" />
              </Button>
            </div>
          </div>

          <div className="pageflip-footer mt-5 flex flex-col items-center gap-4">
            <div className="pageflip-progress" aria-live="polite">
              <span className="font-plex text-xs uppercase tracking-[0.16em] text-fog">
                Page {displayPage} of {pageCount}
              </span>
              <div className="pageflip-progress-track">
                <div
                  className="pageflip-progress-fill"
                  style={{ width: `${(displayPage / pageCount) * 100}%` }}
                />
              </div>
            </div>

            <div className="pageflip-controls flex items-center justify-center gap-3">
              <Button
                type="button"
                onClick={goPrev}
                disabled={!canGoPrev}
                variant="outline"
                className="h-11 rounded-full border border-white/15 bg-white/5 px-5 font-plex text-xs uppercase tracking-[0.16em] text-chalk hover:bg-white/10 hover:text-chalk disabled:opacity-40"
              >
                <ArrowRight className="mr-2 size-4 rotate-180" />
                Prev
              </Button>
              <Button
                type="button"
                onClick={goNext}
                disabled={!canGoNext}
                className="h-11 rounded-full bg-ember px-5 font-plex text-xs uppercase tracking-[0.16em] text-void hover:bg-[#ddb255] disabled:opacity-40"
              >
                Next
                <ArrowRight className="ml-2 size-4" />
              </Button>
            </div>
          </div>

          {showEndCta ? (
            <aside className="pageflip-end-cta" aria-live="polite">
              <button
                type="button"
                className="pageflip-end-cta__close"
                onClick={() => setDismissedEndCta(true)}
                aria-label="Dismiss magazine purchase prompt"
              >
                <X className="size-4" />
              </button>
              <p className="pageflip-end-cta__eyebrow">Preview complete</p>
              <h3>Own the full issue</h3>
              <p>
                Continue reading ADITI&apos;s inaugural strategy and defence
                magazine.
              </p>
              <AddToCartButton
                article={premiumMagazine}
                stopPropagation={false}
                preselect={false}
                className="pageflip-end-cta__button"
              >
                Own the issue
              </AddToCartButton>
            </aside>
          ) : null}
        </div>
      </SectionReveal>
    </section>
  );
}

function CurvedLoopBand() {
  const marqueeText = [
    "Armament",
    "Doctrine",
    "Initiative",
    "Terrain",
    "Integration",
    "Strategy",
    "Sovereignty",
    "Proudly Indian",
    "Rigorously Analytical",
  ];

  return (
    <section
      className="marquee-band overflow-hidden border-y border-steel bg-void py-3"
      aria-label="ADITI themes"
    >
      <div className="marquee-track flex gap-4 font-plex text-xs font-medium uppercase tracking-[0.15em] text-fog">
        <span className="marquee-track__item">
          {marqueeText.map((word, index) => (
            <span key={`marquee-primary-${index}`}>
              {word} <b className="font-medium text-ember">&middot;</b>{" "}
            </span>
          ))}
        </span>
        <span className="marquee-track__item" aria-hidden="true">
          {marqueeText.map((word, index) => (
            <span key={`marquee-copy-${index}`}>
              {word} <b className="font-medium text-ember">&middot;</b>{" "}
            </span>
          ))}
        </span>
      </div>
    </section>
  );
}

export default function ShowcaseStrip() {
  return (
    <>
      <ReactPageFlipShowcase />
      <CurvedLoopBand />
    </>
  );
}
