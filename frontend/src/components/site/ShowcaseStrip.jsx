import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  X,
} from "lucide-react";
import HTMLFlipBook from "react-pageflip";

import SectionReveal from "@/components/site/SectionReveal";
import { AddToCartButton } from "@/components/site/shared";
import { Button } from "@/components/ui/button";
import { PAGEFLIP_PAGES } from "@/data/pageflipPages";
import { DISPATCHES } from "@/data/siteContent";
import { useIsMobile } from "@/hooks/use-mobile";

const BOOK_COVER =
  "/article-banners/aditi-strategy-defence-magazine-issue-2-cover.webp";

const BOOK_PAGE_FRAME_RATIO = 1.2941176471;

function loopPage(page, pageCount) {
  if (pageCount <= 0) {
    return 0;
  }

  return ((page % pageCount) + pageCount) % pageCount;
}

function MobileMagazineViewer({ currentPage, direction }) {
  const totalPages = PAGEFLIP_PAGES.length + 1;

  let image = BOOK_COVER;
  let alt = "ADITI Issue II cover";

  if (currentPage > 0 && currentPage < totalPages) {
    const page = PAGEFLIP_PAGES[currentPage - 1];

    if (page) {
      image = page.image;
      alt = page.alt;
    }
  }

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
              src={image}
              alt={alt}
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
  const [isBookOpen, setIsBookOpen] = useState(false);

  // Front cover + actual magazine pages.
  // Back cover is intentionally NOT included.
  const pageCount = PAGEFLIP_PAGES.length + 1;

  const premiumMagazine = DISPATCHES.find(
    (item) => item.type === "premium",
  );

  /* =========================================================
     MEASURE AVAILABLE WIDTH
  ========================================================= */
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

  /* =========================================================
     BOOK SIZE
  ========================================================= */
  const bookWidth =
    stageWidth < 768
      ? Math.min(Math.max((stageWidth - 28) * 0.6, 190), 240)
      : Math.min(Math.max(stageWidth * 0.37, 300), 456);

  const bookHeight = Math.round(
    bookWidth * BOOK_PAGE_FRAME_RATIO,
  );

  /*
   * Large screens read as a real book: two facing pages at a time.
   * Below 1024px there is not enough width for a spread, so the book
   * falls back to a single page (and under 768px the mobile viewer
   * takes over entirely).
   */
  const isSpread = !isMobile && stageWidth >= 1024;

  /* =========================================================
     SYNC REACT STATE WITH REACT-PAGEFLIP
  ========================================================= */
  useEffect(() => {
    if (!isBookOpen || isMobile) {
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
      if (
        activePage === pageCount - 1 &&
        nextPage === 0
      ) {
        flip.turnToPage(0);
      } else {
        flip.flipNext("bottom");
      }

      return undefined;
    }

    if (nextPage === backwardPage) {
      if (
        activePage === 0 &&
        nextPage === pageCount - 1
      ) {
        flip.turnToPage(pageCount - 1);
      } else {
        flip.flipPrev("bottom");
      }

      return undefined;
    }

    flip.turnToPage(nextPage);

    return undefined;
  }, [
    currentPage,
    isBookOpen,
    isMobile,
    pageCount,
  ]);

  /* =========================================================
     OPEN MAGAZINE
  ========================================================= */
  const openMagazine = () => {
    setDismissedEndCta(false);
    setDirection("next");
    setCurrentPage(isSpread ? 1 : 0);
    setIsBookOpen(true);
  };

  /* =========================================================
     CLOSE MAGAZINE
  ========================================================= */
  const closeMagazine = () => {
    setIsBookOpen(false);
  };

  /* =========================================================
     KEYBOARD SUPPORT
  ========================================================= */
  useEffect(() => {
    if (!isBookOpen) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        closeMagazine();
        return;
      }

      if (event.key === "ArrowRight") {
        setDirection("next");

        setCurrentPage((page) =>
          Math.min(pageCount - 1, page + 1),
        );
      }

      if (event.key === "ArrowLeft") {
        setDirection("prev");

        setCurrentPage((page) =>
          Math.max(0, page - 1),
        );
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    /*
     * IMPORTANT:
     * We intentionally DO NOT use:
     *
     * document.body.style.overflow = "hidden";
     *
     * because the main website must remain scrollable
     * while the magazine popup is open.
     */

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown,
      );
    };
  }, [isBookOpen, pageCount]);

  /* =========================================================
     PREVIOUS
  ========================================================= */
  const goPrev = () => {
    setDirection("prev");

    setCurrentPage((page) =>
      Math.max(0, page - 1),
    );
  };

  /* =========================================================
     NEXT
  ========================================================= */
  const goNext = () => {
    setDirection("next");

    setCurrentPage((page) =>
      Math.min(pageCount - 1, page + 1),
    );
  };

  /* =========================================================
     FLIP EVENT
  ========================================================= */
  const handleFlip = (event) => {
    const nextPage = event.data;

    setDirection(
      nextPage > currentPage ? "next" : "prev",
    );

    setCurrentPage(nextPage);
  };

  const displayPage = currentPage + 1;

  const displayLabel =
    currentPage === 0
      ? "Cover"
      : `Page ${currentPage}`;

  const canGoPrev = currentPage > 0;

  const canGoNext =
    currentPage < pageCount - 1;

  const showEndCta =
    currentPage === pageCount - 1 &&
    !dismissedEndCta &&
    premiumMagazine;

  useEffect(() => {
    if (currentPage !== pageCount - 1) {
      setDismissedEndCta(false);
    }
  }, [currentPage, pageCount]);

  return (
    <section
      ref={stageRef}
      className="bookflip2-section relative border-t border-steel px-4 py-16 scroll-mt-20 md:px-8 md:py-24"
      aria-label="ADITI magazine preview"
    >
      <SectionReveal>
        <div className="mx-auto max-w-7xl">

          {/* =====================================================
              SECTION HEADER
          ===================================================== */}

          <div className="showcase-layout">

            <div className="showcase-copy">
              <p className="font-plex text-xs font-medium uppercase tracking-[0.18em] text-ember">
                Inside the Magazine
              </p>

              <h2 className="mt-3 font-rajdhani text-[clamp(2rem,4.4vw,3.4rem)] font-bold leading-[1] text-chalk">
                Flip through ADITI&apos;s editorial world.
              </h2>

              <p className="mt-4 max-w-lg font-plex text-base font-light leading-[1.75] text-ash">
                Explore the issue page by page. Tap the cover to
                open the interactive magazine.
              </p>

            </div>

            {/* Its own grid item, so it can sit under the copy on desktop
                and under the book on phones. */}
            <div className="showcase-cta">
              <button
                type="button"
                onClick={openMagazine}
                className="showcase-open-button"
              >
                <Maximize2 className="size-4" />
                Tap to open the issue
              </button>
            </div>

            {/* =================================================
                CLOSED MAGAZINE
            ================================================= */}

            <div className="showcase-book">
              <div
                className="pageflip-stage"
            style={{
              "--book-w": `${bookWidth}px`,
              "--book-h": `${bookHeight}px`,
            }}
          >
            <div className="showcase-book-float flex w-full items-center justify-center">

              <button
                type="button"
                onClick={openMagazine}
                className="group relative block cursor-pointer border-0 bg-transparent p-0 outline-none"
                aria-label="Open ADITI magazine"
                style={{
                  width: `${bookWidth}px`,
                  height: `${bookHeight}px`,
                  perspective: "1600px",
                }}
              >

                {/* Back/depth layer */}

                <span
                  aria-hidden="true"
                  className="absolute inset-0 rounded-[3px] bg-black/60"
                  style={{
                    transform:
                      "translate3d(-12px, 10px, -35px) rotateY(-5deg)",
                    filter: "blur(1px)",
                  }}
                />

                {/* Magazine shadow */}

                <span
                  aria-hidden="true"
                  className="absolute -bottom-8 left-[8%] right-[8%] h-10 rounded-full bg-black/60 blur-2xl transition-all duration-500 group-hover:-bottom-10 group-hover:opacity-80"
                />

                {/* Magazine */}

                <span
                  className="relative block h-full w-full overflow-hidden rounded-[3px] border border-white/15 bg-[#10140f] transition-all duration-700 ease-out group-hover:-translate-y-2"
                  style={{
                    transformStyle: "preserve-3d",
                    boxShadow:
                      "0 30px 80px rgba(0,0,0,.55), 14px 18px 0 rgba(0,0,0,.16)",
                  }}
                >

                  <img
                    src={BOOK_COVER}
                    alt="ADITI Issue II cover"
                    className="block h-full w-full object-cover"
                    loading="eager"
                    draggable={false}
                  />

                  {/* Cover lighting */}

                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/25"
                  />

                  {/* Spine/depth */}

                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute bottom-0 left-0 top-0 w-[3px] bg-black/40"
                  />

                </span>
              </button>
            </div>
          </div>

              <div className="mt-6 flex flex-col items-center gap-2">
                <span className="font-plex text-xs uppercase tracking-[0.2em] text-fog">
                  Cover
                </span>

                <span className="font-plex text-[10px] uppercase tracking-[0.14em] text-fog/60">
                  Issue II
                </span>
              </div>
            </div>

          </div>

          {/* =====================================================
              MAGAZINE POPUP
          ===================================================== */}

          {isBookOpen ? (
            <div
              className="fixed inset-0 z-[100] flex items-center justify-center bg-transparent p-3 backdrop-blur-2xl md:p-6"
              role="dialog"
              aria-modal="true"
              aria-label="ADITI interactive magazine"
              onMouseDown={(event) => {
                if (
                  event.target === event.currentTarget
                ) {
                  closeMagazine();
                }
              }}
            >

              {/* Ambient glow */}

              <div
                aria-hidden="true"
                className="pointer-events-none absolute left-1/2 top-1/2 h-[70vh] w-[70vw] -translate-x-1/2 -translate-y-1/2 rounded-full bg-ember/5 blur-[100px]"
              />

              {/* =================================================
                  POPUP CONTAINER
              ================================================= */}

              <div
                className="relative flex max-h-[96vh] w-full max-w-[1200px] flex-col items-center overflow-hidden rounded-2xl border border-white/10 bg-[#090c08]/95 p-3 shadow-[0_40px_120px_rgba(0,0,0,.75)] md:p-6"
                onWheel={(event) => {
                  event.stopPropagation();
                }}
              >

                {/* Top bar */}

                <div className="relative z-20 flex w-full items-center justify-between pb-3 md:pb-4">

                  <div>
                    <p className="font-plex text-[9px] uppercase tracking-[0.2em] text-ember md:text-[10px]">
                      ADITI
                    </p>

                    <p className="mt-1 font-rajdhani text-sm font-semibold uppercase tracking-[0.08em] text-chalk md:text-base">
                      Issue II — Interactive Preview
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={closeMagazine}
                    className="flex size-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-chalk transition-all duration-200 hover:border-ember/40 hover:bg-ember/10 hover:text-ember md:size-10"
                    aria-label="Close magazine"
                  >
                    <X className="size-4 md:size-5" />
                  </button>
                </div>

                {/* =================================================
                    FLIPBOOK AREA
                ================================================= */}

                <div
                  className="flex min-h-0 w-full flex-1 items-center justify-center"
                  style={{
                    minHeight: isMobile
                      ? "min(68vh, 620px)"
                      : "min(72vh, 650px)",
                  }}
                >

                  <div
                    className="relative flex items-center justify-center"
                    style={{
                      width: "100%",
                      height: "100%",
                    }}
                  >

                    {/* Previous */}

                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="absolute left-1 top-1/2 z-30 hidden h-11 w-11 -translate-y-1/2 shrink-0 rounded-full border-steel/50 bg-bunker/80 text-chalk shadow-lg backdrop-blur-md hover:border-ember/50 hover:bg-plate md:inline-flex lg:left-4"
                      aria-label="Previous page"
                      disabled={!canGoPrev}
                      onClick={goPrev}
                    >
                      <ChevronLeft className="size-5" />
                    </Button>

                    {/* =================================================
                        BOOK
                    ================================================= */}

                    <div
                      className="flex items-center justify-center"
                      style={{
                        width: `${bookWidth}px`,
                        height: `${bookHeight}px`,
                        maxWidth: "100%",
                        maxHeight: "calc(96vh - 180px)",
                      }}
                    >

                      {isMobile ? (
                        <MobileMagazineViewer
                          currentPage={currentPage}
                          direction={direction}
                        />
                      ) : (
                        <HTMLFlipBook
                          key={`${bookWidth}x${bookHeight}x${isSpread ? "spread" : "single"}`}
                          ref={bookRef}
                          width={bookWidth}
                          height={bookHeight}
                          size="fixed"
                          minWidth={190}
                          maxWidth={456}
                          minHeight={246}
                          maxHeight={590}
                          showCover={true}
                          drawShadow
                          flippingTime={900}
                          usePortrait={!isSpread}
                          startZIndex={20}
                          autoSize={false}
                          maxShadowOpacity={0.4}

                          /*
                           * Keep pageflip from hijacking normal
                           * website scrolling.
                           */
                          mobileScrollSupport={false}
                          swipeDistance={0}
                          clickEventForward={false}
                          useMouseEvents={false}

                          onFlip={handleFlip}
                          className="pageflip-book"
                        >

                          {/* FRONT COVER */}

                          <div className="pageflip-page pageflip-cover">
                            <div className="pageflip-page-inner">
                              <img
                                src={BOOK_COVER}
                                alt="ADITI Issue II cover"
                                className="pageflip-page-image"
                                loading="eager"
                                draggable={false}
                              />
                            </div>
                          </div>

                          {/* ACTUAL MAGAZINE PAGES */}

                          {PAGEFLIP_PAGES.map(
                            (page, index) => (
                              <div
                                key={`${page.alt}-${index}`}
                                className="pageflip-page"
                              >
                                <div className="pageflip-page-inner">
                                  <img
                                    src={page.image}
                                    alt={page.alt}
                                    className="pageflip-page-image"
                                    loading={
                                      index < 2
                                        ? "eager"
                                        : "lazy"
                                    }
                                    draggable={false}
                                  />
                                </div>
                              </div>
                            ),
                          )}

                        </HTMLFlipBook>
                      )}

                    </div>

                    {/* Next */}

                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="absolute right-1 top-1/2 z-30 hidden h-11 w-11 -translate-y-1/2 shrink-0 rounded-full border-steel/50 bg-bunker/80 text-chalk shadow-lg backdrop-blur-md hover:border-ember/50 hover:bg-plate md:inline-flex lg:right-4"
                      aria-label="Next page"
                      disabled={!canGoNext}
                      onClick={goNext}
                    >
                      <ChevronRight className="size-5" />
                    </Button>

                  </div>
                </div>

                {/* =================================================
                    MOBILE ARROWS
                ================================================= */}

                <div className="flex items-center justify-center gap-3 py-2 md:hidden">

                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="size-10 rounded-full border-white/10 bg-white/5 text-chalk"
                    aria-label="Previous page"
                    disabled={!canGoPrev}
                    onClick={goPrev}
                  >
                    <ChevronLeft className="size-4" />
                  </Button>

                  <span className="min-w-[80px] text-center font-plex text-[10px] uppercase tracking-[0.16em] text-fog">
                    {displayLabel}
                  </span>

                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="size-10 rounded-full border-white/10 bg-white/5 text-chalk"
                    aria-label="Next page"
                    disabled={!canGoNext}
                    onClick={goNext}
                  >
                    <ChevronRight className="size-4" />
                  </Button>

                </div>

                {/* =================================================
                    FOOTER / PROGRESS
                ================================================= */}

                <div className="w-full max-w-[420px] pt-2 md:pt-3">

                  <div
                    className="pageflip-progress"
                    aria-live="polite"
                  >

                    <div className="flex items-center justify-between">

                      <span className="font-plex text-[10px] uppercase tracking-[0.16em] text-fog">
                        {displayLabel}
                      </span>

                      <span className="font-plex text-[10px] uppercase tracking-[0.12em] text-fog/60">
                        {displayPage} / {pageCount}
                      </span>

                    </div>

                    <div className="pageflip-progress-track mt-2">

                      <div
                        className="pageflip-progress-fill"
                        style={{
                          width: `${
                            (displayPage / pageCount) * 100
                          }%`,
                        }}
                      />

                    </div>
                  </div>

                  {/* Desktop controls */}

                  <div className="mt-4 hidden items-center justify-center gap-3 md:flex">

                    <Button
                      type="button"
                      onClick={goPrev}
                      disabled={!canGoPrev}
                      variant="outline"
                      className="h-10 rounded-full border border-white/15 bg-white/5 px-5 font-plex text-xs uppercase tracking-[0.16em] text-chalk hover:bg-white/10 hover:text-chalk disabled:opacity-40"
                    >
                      <ArrowRight className="mr-2 size-4 rotate-180" />
                      Prev
                    </Button>

                    <Button
                      type="button"
                      onClick={goNext}
                      disabled={!canGoNext}
                      className="h-10 rounded-full bg-ember px-5 font-plex text-xs uppercase tracking-[0.16em] text-void hover:bg-[#ddb255] disabled:opacity-40"
                    >
                      Next
                      <ArrowRight className="ml-2 size-4" />
                    </Button>

                  </div>
                </div>

                {/* =================================================
                    END CTA
                ================================================= */}

                {showEndCta ? (
                  <aside
                    className="pageflip-end-cta"
                    aria-live="polite"
                  >

                    <button
                      type="button"
                      className="pageflip-end-cta__close"
                      onClick={() =>
                        setDismissedEndCta(true)
                      }
                      aria-label="Dismiss magazine purchase prompt"
                    >
                      <X className="size-4" />
                    </button>

                    <p className="pageflip-end-cta__eyebrow">
                      Preview complete
                    </p>

                    <h3>Own the full issue</h3>

                    <p>
                      Continue reading ADITI&apos;s inaugural
                      strategy and defence magazine.
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
            </div>
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
              {word}{" "}
              <b className="font-medium text-ember">
                &middot;
              </b>{" "}
            </span>
          ))}
        </span>

        <span
          className="marquee-track__item"
          aria-hidden="true"
        >
          {marqueeText.map((word, index) => (
            <span key={`marquee-copy-${index}`}>
              {word}{" "}
              <b className="font-medium text-ember">
                &middot;
              </b>{" "}
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