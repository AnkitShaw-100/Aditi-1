import { useMemo, useState } from "react";

import { ArticleCard, RailCarousel } from "@/components/site/shared";
import SectionReveal from "@/components/site/SectionReveal";
import { cn } from "@/lib/utils";
import { DISPATCHES, DISPATCH_FILTERS } from "@/data/siteContent";

export default function DispatchesSection() {
  const [dispatchFilter, setDispatchFilter] = useState("all");

  const visibleDispatches = useMemo(
    () =>
      dispatchFilter === "all"
        ? DISPATCHES
        : DISPATCHES.filter((dispatch) => dispatch.type === dispatchFilter),
    [dispatchFilter]
  );

  return (
    <section
      id="read"
      className="read-section px-4 py-16 scroll-mt-20 md:px-8 md:py-24"
    >
      <div className="mx-auto max-w-7xl">
        <div className="md:flex md:items-end md:justify-between">
          <div>
            <p className="font-plex text-xs font-medium uppercase tracking-[0.18em] text-ember">
              Featured Articles
            </p>
            <h2 className="mt-3 font-rajdhani text-[clamp(1.8rem,6vw,3rem)] font-bold leading-[1.1] text-chalk">
              Free articles and the inaugural premium magazine.
            </h2>
            <p className="mt-3 font-plex text-base font-light text-fog">
              Browse open access pieces or add the ADITI Strategy & Defence Magazine to your cart.
            </p>
          </div>

          <div
            className="dispatch-filters mt-7 flex min-h-11 w-full flex-nowrap items-center justify-start gap-5 overflow-x-auto border-b border-steel scrollbar-none [-ms-overflow-style:none] [scrollbar-width:none] md:mt-0 md:w-auto md:justify-end md:gap-8 [&::-webkit-scrollbar]:hidden"
            role="tablist"
            aria-label="Dispatch filters"
          >
            {DISPATCH_FILTERS.map((filter) => (
              <button
                key={filter.value}
                className={cn(
                  "filter-tab min-h-11 shrink-0 border-b-2 px-2 font-plex text-xs font-medium uppercase tracking-[0.08em] sm:tracking-[0.12em]",
                  dispatchFilter === filter.value
                    ? "border-ember text-ember"
                    : "border-transparent text-fog"
                )}
                type="button"
                aria-pressed={dispatchFilter === filter.value}
                onClick={() => setDispatchFilter(filter.value)}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        <SectionReveal delay={80}>
          <div className="mt-8">
            {visibleDispatches.length ? (
              <RailCarousel
                items={visibleDispatches}
                desktopPageSize={3}
                tabletPageSize={2}
                mobilePageSize={1}
                ariaLabel="Dispatch article carousel"
                trackClassName="dispatch-track"
                itemClassName="basis-full sm:basis-[calc((100%_-_1.25rem)/2)] lg:basis-[calc((100%_-_2.5rem)/3)]"
                showArrows
                arrowsClassName="dispatch-carousel-arrows"
                renderItem={(article) => <ArticleCard article={article} />}
              />
            ) : (
              <div className="dispatch-empty-state">
                <p className="font-plex text-xs font-medium uppercase tracking-[0.18em] text-ember">
                  Coming Soon
                </p>
                <h3 className="mt-2 font-rajdhani text-3xl font-bold text-chalk">
                  Premium dispatches are being prepared.
                </h3>
                <p className="mt-2 max-w-xl font-plex text-sm font-light leading-7 text-ash">
                  The open-access articles are available now. Premium magazine issues will appear here when available.
                </p>
              </div>
            )}
          </div>
        </SectionReveal>
      </div>
    </section>
  );
}
