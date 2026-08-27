import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight, ChevronLeft, ChevronRight, Minus, Plus, Star } from "lucide-react";
import { useAuth } from "@clerk/clerk-react";
import { Link, useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useIsMobile, useIsTablet } from "@/hooks/use-mobile";
import { addMagazineToCart } from "@/lib/cart";
import { usePremiumPurchase } from "@/components/site/premiumPurchaseContext";

export function RadarCursor() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    if (coarse) return undefined;

    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const ctx = canvas.getContext("2d");
    if (!ctx) return undefined;

    /*
     * The cursor holds one form everywhere on the page. It used to grow over
     * cards, fill in over links and drop its trailing dot over buttons, which
     * made it restless to read against; it now only follows the pointer.
     */
    const RADIUS = 14;
    const TICK_LENGTH = 14;
    const DOT_RADIUS = 3;

    const state = {
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
      dotX: window.innerWidth / 2,
      dotY: window.innerHeight / 2,
      angle: 0,
    };

    let frameId = 0;

    /*
     * Only the two small boxes the cursor actually occupies are cleared each
     * frame. Clearing the whole viewport instead made the browser repaint and
     * re-upload a full-screen layer sixty times a second to draw a 14px
     * circle, which is what made the entire site feel heavy on desktop.
     */
    const RING_BOX = RADIUS + 6;
    const DOT_BOX = 10;
    let painted = null;

    const resize = () => {
      const ratio = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * ratio;
      canvas.height = window.innerHeight * ratio;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      // Resizing the backing store clears it, so there is nothing stale left.
      painted = null;
    };

    const clearPainted = () => {
      if (!painted) {
        return;
      }

      ctx.clearRect(
        painted.x - RING_BOX,
        painted.y - RING_BOX,
        RING_BOX * 2,
        RING_BOX * 2
      );
      ctx.clearRect(
        painted.dotX - DOT_BOX,
        painted.dotY - DOT_BOX,
        DOT_BOX * 2,
        DOT_BOX * 2
      );
    };

    const draw = () => {
      clearPainted();

      state.dotX += (state.x - state.dotX) * 0.14;
      state.dotY += (state.y - state.dotY) * 0.14;
      state.angle += 2;

      ctx.save();
      ctx.translate(state.x, state.y);

      ctx.strokeStyle = "#C99A4A";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(0, 0, RADIUS, 0, Math.PI * 2);
      ctx.stroke();

      ctx.rotate((state.angle * Math.PI) / 180);
      ctx.strokeStyle = "rgba(201, 154, 74, 0.7)";
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, -TICK_LENGTH);
      ctx.stroke();

      ctx.restore();

      ctx.fillStyle = "#C99A4A";
      ctx.beginPath();
      ctx.arc(state.dotX, state.dotY, DOT_RADIUS, 0, Math.PI * 2);
      ctx.fill();

      painted = { x: state.x, y: state.y, dotX: state.dotX, dotY: state.dotY };

      frameId = requestAnimationFrame(draw);
    };

    const handleMouseMove = (event) => {
      state.x = event.clientX;
      state.y = event.clientY;
    };

    const stop = () => {
      cancelAnimationFrame(frameId);
      frameId = 0;
    };

    const start = () => {
      if (!frameId) {
        frameId = requestAnimationFrame(draw);
      }
    };

    // Nothing to animate while the tab is in the background.
    const handleVisibility = () => {
      if (document.hidden) {
        stop();
      } else {
        start();
      }
    };

    document.body.classList.add("cursor-ready");
    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    document.addEventListener("visibilitychange", handleVisibility);

    resize();
    start();

    return () => {
      stop();
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("visibilitychange", handleVisibility);
      document.body.classList.remove("cursor-ready");
    };
  }, []);

  return <canvas ref={canvasRef} id="radarCursor" aria-hidden="true" />;
}

export function RailCarousel({
  items,
  desktopPageSize,
  mobilePageSize = 1,
  ariaLabel,
  trackClassName,
  itemClassName,
  renderItem,
  controlsClassName = "",
  showArrows = false,
  arrowsClassName = "",
  wrapArrows = false,
  tabletPageSize,
}) {
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();

  /*
   * Card rails show 3 across on desktop, 2 between 768px and 1199px, and 1 on
   * a phone. The page size has to track that or the arrows scroll past cards
   * the reader never saw and the dots count pages that do not exist, so rails
   * whose visible count changes on tablet pass tabletPageSize to match.
   */
  const pageSize = isMobile
    ? mobilePageSize
    : isTablet
      ? tabletPageSize ?? desktopPageSize
      : desktopPageSize;
  const trackRef = useRef(null);
  const itemRefs = useRef([]);
  const activePageRef = useRef(0);
  const [activePage, setActivePage] = useState(0);
  const getItemKey = (item, index) => item.title ?? item.name ?? `item-${index}`;

  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));
  const getPageOffset = useCallback((track, page) => {
    const maxScrollLeft = Math.max(0, track.scrollWidth - track.clientWidth);
    const target = itemRefs.current[Math.min(page * pageSize, items.length - 1)];

    return target
      ? Math.min(maxScrollLeft, Math.max(0, target.offsetLeft - track.offsetLeft))
      : 0;
  }, [items.length, pageSize]);

  useEffect(() => {
    itemRefs.current = itemRefs.current.slice(0, items.length);

    const track = trackRef.current;
    if (track) {
      track.scrollTo({ left: 0, behavior: "auto" });
    }
  }, [items, pageSize]);

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      activePageRef.current = 0;
      setActivePage(0);
    });
    return () => cancelAnimationFrame(id);
  }, [items, pageSize]);

  useEffect(() => {
    const track = trackRef.current;
    if (!track || !items.length) {
      return undefined;
    }

    let rafId = 0;

    const updatePage = () => {
      if (!itemRefs.current[0]) {
        return;
      }

      const pageOffsets = Array.from({ length: pageCount }, (_, page) =>
        getPageOffset(track, page)
      );
      const nextPage = pageOffsets.reduce((closestPage, offset, page) => {
        const currentDistance = Math.abs(track.scrollLeft - pageOffsets[closestPage]);
        const nextDistance = Math.abs(track.scrollLeft - offset);
        return nextDistance < currentDistance ? page : closestPage;
      }, 0);

      const boundedPage = Math.min(pageCount - 1, Math.max(0, nextPage));
      activePageRef.current = boundedPage;
      setActivePage(boundedPage);
    };

    const handleScroll = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(updatePage);
    };

    updatePage();
    track.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", updatePage);

    return () => {
      track.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", updatePage);
      cancelAnimationFrame(rafId);
    };
  }, [getPageOffset, items.length, pageCount, pageSize]);

  const scrollToPage = (page) => {
    const nextPage = Math.min(pageCount - 1, Math.max(0, page));
    const track = trackRef.current;
    const target = itemRefs.current[nextPage * pageSize];

    activePageRef.current = nextPage;
    setActivePage(nextPage);

    if (target && track) {
      track.scrollTo({
        left: getPageOffset(track, nextPage),
        behavior: "smooth",
      });
    }
  };

  const scrollByPage = (direction) => {
    const currentPage = activePageRef.current;
    let nextPage = currentPage + direction;

    if (wrapArrows) {
      if (nextPage < 0) nextPage = pageCount - 1;
      if (nextPage >= pageCount) nextPage = 0;
    }

    scrollToPage(nextPage);
  };

  const showPreviousArrow = wrapArrows || activePage > 0;
  const showNextArrow = wrapArrows || activePage < pageCount - 1;

  return (
    <div className="rail-carousel" aria-label={ariaLabel}>
     {showArrows && pageCount > 1 ? (
  <div className={cn("carousel-arrows", arrowsClassName)}>
    <div className="carousel-arrow-side carousel-arrow-side-prev">
      {showPreviousArrow ? (
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="carousel-arrow h-10 w-10 rounded-full border-steel/60 bg-bunker/80 text-chalk hover:border-ember/50 hover:bg-plate hover:text-chalk"
          aria-label={`Previous ${ariaLabel} page`}
          onClick={() => scrollByPage(-1)}
        >
          <ChevronLeft className="size-5" />
        </Button>
      ) : null}
    </div>

    <div className="carousel-arrow-side carousel-arrow-side-next">
      {showNextArrow ? (
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="carousel-arrow h-10 w-10 rounded-full border-steel/60 bg-bunker/80 text-chalk hover:border-ember/50 hover:bg-plate hover:text-chalk"
          aria-label={`Next ${ariaLabel} page`}
          onClick={() => scrollByPage(1)}
        >
          <ChevronRight className="size-5" />
        </Button>
      ) : null}
    </div>
  </div>
) : null}
      <>
        <div
          ref={trackRef}
          className={cn(
            "dispatch-track flex items-start gap-5 overflow-x-auto scroll-smooth pb-2 scrollbar-none [&::-webkit-scrollbar]:hidden",
            trackClassName
          )}
        >
          {items.map((item, index) => (
            <div
              key={getItemKey(item, index)}
              ref={(node) => {
                itemRefs.current[index] = node;
              }}
              className={cn("shrink-0 snap-start", itemClassName)}
            >
              {renderItem(item, index)}
            </div>
          ))}
        </div>
        {pageCount > 1 ? (
          <div
            className={cn("carousel-dots", controlsClassName)}
            aria-label={`${ariaLabel} pages`}
          >
            {Array.from({ length: pageCount }).map((_, index) => (
              <button
                key={`${ariaLabel}-dot-${index}`}
                type="button"
                aria-label={`Go to ${ariaLabel} page ${index + 1}`}
                className={cn("carousel-dot", index === activePage && "active")}
                onClick={() => scrollToPage(index)}
              />
            ))}
          </div>
        ) : null}
      </>
    </div>
  );
}

export function AuthorCard({ author }) {
  return (
    <Card className="authors-card flex h-full overflow-hidden rounded-xl border border-steel/70 bg-[linear-gradient(180deg,rgba(22,27,20,0.98),rgba(9,11,8,0.98))] p-0 shadow-none transition duration-300 hover:-translate-y-0.5 hover:border-ember/40">
      <div className="border-b border-steel/60 px-5 py-5">
        <div className="authors-card-head flex items-center gap-4">
          <img
            src={author.image}
            alt={`Portrait of ${author.name}`}
            className="h-[4.5rem] w-[4.5rem] shrink-0 rounded-full object-cover ring-2 ring-ember/30"
            loading="lazy"
          />

          <div className="authors-card-identity">
            {/* Name / Name + Medals */}
            <h3 className="authors-card-name font-rajdhani text-xl font-bold leading-tight text-chalk">
              {author.name}
            </h3>

            {/* Designation / Professional Status */}
            <p className="mt-2 font-plex text-[0.78rem] font-medium leading-[1.5] tracking-[0.06em] text-ember">
              {author.rank}
            </p>
          </div>
        </div>
      </div>

      <div className="authors-card-body px-5 py-5">
        <p className="font-plex text-[0.7rem] font-medium uppercase tracking-[0.18em] text-fog">
          Highlighted Expertise
        </p>

        <p className="authors-card-specialty mt-2 font-lora text-base italic leading-relaxed text-ash">
          {author.specialty}
        </p>

        {author.summary ? (
          <p className="authors-card-summary mt-4 font-plex text-base font-light leading-[1.8] text-fog">
            {author.summary}
          </p>
        ) : null}
      </div>
    </Card>
  );
}

export function ArticleCard({ article }) {
  const isPremium = article.type === "premium";
  const navigate = useNavigate();
  const premiumPurchase = usePremiumPurchase();

  // Premium cards open the purchase popup; free ones go to the article.
  function openArticle() {
    if (isPremium && premiumPurchase) {
      premiumPurchase.openPremiumPopup(article);
      return;
    }

    navigate(article.href);
  }
  const media = (
    <>
      <img
        className={cn(
          "h-full w-full object-cover",
          isPremium && "object-cover object-center"
        )}
        src={article.image}
        alt={article.tag}
        loading="lazy"
      />
      <span className="absolute bottom-3 left-3 rounded-sm bg-void/75 px-2 py-0.75 font-plex text-xs font-medium uppercase text-ember">
        {article.tag}
      </span>
    </>
  );

  return (
    <Card
      role="link"
      tabIndex={0}
      aria-label={article.ariaLabel}
      className="article-card mx-auto w-full max-w-[30rem] overflow-hidden rounded-xl border border-steel/80 bg-bunker p-0 py-0 ring-0 focus-visible:border-ember focus-visible:outline-none"
      onClick={(event) => {
        if (event.target.closest("a, button")) {
          return;
        }
        openArticle();
      }}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openArticle();
        }
      }}
    >
      {isPremium ? (
        <div className="relative h-[11.25rem] md:h-[13.75rem]">{media}</div>
      ) : (
        <Link
          to={article.href}
          className="relative block h-[11.25rem] md:h-[13.75rem]"
          onClick={(event) => event.stopPropagation()}
        >
          {media}
        </Link>
      )}
      <div className="p-4">
        <h3 className="article-title font-rajdhani text-[1.15rem] font-bold leading-tight text-chalk">
          {isPremium ? (
            article.title
          ) : (
            <Link
              to={article.href}
              className="text-current hover:text-ember"
              onClick={(event) => event.stopPropagation()}
            >
              {article.title}
            </Link>
          )}
        </h3>
        <p className="article-teaser mt-3 font-lora text-[0.88rem] leading-[1.65] text-ash">
          {article.teaser}
        </p>
        <div className="mt-4 flex items-center justify-between gap-3">
          <span className="font-plex text-xs font-light text-fog">
            {article.author ? `by ${article.author}` : article.readTime}
          </span>
          <span className="flex items-center gap-3">
            <b className="font-plex text-sm font-bold tracking-wide text-chalk">
              {article.priceLabel}
            </b>
            {isPremium ? (
              <AddToCartButton article={article}>View</AddToCartButton>
            ) : (
              <Button
                asChild
                variant="ghost"
                className="inline-flex min-h-11 items-center py-3 font-plex text-sm font-medium text-ember hover:bg-transparent hover:text-chalk"
              >
                <Link to={article.href} onClick={(event) => event.stopPropagation()}>
                  {article.cta} <ArrowRight className="size-4" />
                </Link>
              </Button>
            )}
          </span>
        </div>
      </div>
    </Card>
  );
}

/**
 * `preselect={false}` sends the reader to checkout without putting anything in
 * the cart, so they pick the issue themselves. Use it for CTAs that are not
 * tied to one specific issue.
 */
export function AddToCartButton({
  article,
  className,
  children,
  stopPropagation = true,
  preselect = true,
}) {
  const { getToken, isSignedIn } = useAuth();
  const navigate = useNavigate();
  const premiumPurchase = usePremiumPurchase();
  const [status, setStatus] = useState("idle");

  const authUrl = preselect
    ? `/auth?redirect=${encodeURIComponent("/checkout")}&magazine_slug=${encodeURIComponent(article.slug)}`
    : `/auth?redirect=${encodeURIComponent("/checkout")}`;

  async function addToCart(event) {
    event?.preventDefault();

    if (stopPropagation) {
      event?.stopPropagation();
    }

    // CTAs tied to one issue open the purchase popup so the reader can add it
    // to the cart without leaving the page. `preselect={false}` CTAs are not
    // tied to a specific issue, so they still go straight to checkout.
    if (preselect && premiumPurchase) {
      premiumPurchase.openPremiumPopup(article);
      return;
    }

    if (!isSignedIn) {
      navigate(authUrl);
      return;
    }

    if (!preselect) {
      navigate("/checkout");
      return;
    }

    setStatus("adding");

    try {
      await addMagazineToCart({ getToken, magazineSlug: article.slug });
      navigate("/checkout");
    } catch (error) {
      setStatus("error");
      window.alert(error.message || "Unable to add magazine to cart.");
      setStatus("idle");
    }
  }

  return (
    <Button
      type="button"
      variant="ghost"
      disabled={status === "adding"}
      className={cn(
        "inline-flex min-h-11 items-center py-3 font-plex text-sm font-medium text-ember hover:bg-transparent hover:text-chalk",
        className
      )}
      onClick={addToCart}
    >
      {status === "adding" ? "Adding" : (children ?? article.cta)} <ArrowRight className="size-4" />
    </Button>
  );
}

export function FeedbackCard({ feedback }) {
  return (
    <Card className="feedback-card h-full overflow-hidden border-0 bg-transparent p-0 py-0 shadow-none ring-0">
      <div className="feedback-card-inner">
        <div className="feedback-card-top">
          <p className="feedback-category font-plex text-xs font-medium uppercase tracking-[0.18em] text-ember">
            {feedback.category}
          </p>
          <span className="feedback-rating" aria-label="Five star reader rating">
            {Array.from({ length: 5 }).map((_, index) => (
              <Star key={index} className="size-3.5" fill="currentColor" />
            ))}
          </span>
        </div>
        <p className="feedback-quote font-lora italic">"{feedback.quote}"</p>
        <div className="feedback-meta">
          <img
            className="h-14 w-14 rounded-full object-cover"
            src={feedback.image}
            alt={`Portrait of ${feedback.name}`}
            loading="lazy"
          />
          <div>
            <h3 className="font-rajdhani text-xl font-semibold text-chalk">
              {feedback.name}
            </h3>
            <p className="font-plex text-xs font-light text-ash">
              {feedback.role}
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}

export function FaqItem({ item }) {
  const [open, setOpen] = useState(false);
  const contentRef = useRef(null);
  const [maxHeight, setMaxHeight] = useState("0px");

  useEffect(() => {
    if (open && contentRef.current) {
      setMaxHeight(`${contentRef.current.scrollHeight}px`);
      return;
    }

    setMaxHeight("0px");
  }, [open, item.answer]);

  return (
    <details className="faq-item border-b border-steel" open={open}>
      <summary
        className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-5 py-4 font-rajdhani text-[1.05rem] font-semibold text-chalk"
        onClick={(event) => {
          event.preventDefault();
          setOpen((value) => !value);
        }}
      >
        <span className="min-w-0 flex-1 break-words">{item.question}</span>
        <span className="faq-icon shrink-0 text-ember">
          {open ? <Minus className="size-4" /> : <Plus className="size-4" />}
        </span>
      </summary>
      <div className="faq-answer" style={{ maxHeight }}>
        <p
          ref={contentRef}
          className="break-words pb-4 font-plex text-sm font-light leading-[1.7] text-ash"
        >
          {item.answer}
        </p>
      </div>
    </details>
  );
}
