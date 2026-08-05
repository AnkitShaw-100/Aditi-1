import { useState } from "react";
import brandSectionBg from "../../../media/brand-section-bg.png";

import SectionReveal from "@/components/site/SectionReveal";
import { AddToCartButton } from "@/components/site/shared";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { BRAND_STATS, DISPATCHES } from "@/data/siteContent";

const magazineMockup = "/article-banners/aditi-strategy-defence-magazine-mockup.webp";

export default function BrandSection() {
  const [activeStat, setActiveStat] = useState(null);
  const premiumMagazine = DISPATCHES.find((item) => item.type === "premium");

  return (
    <section
      id="brand"
      className="steel-field px-5 py-16 scroll-mt-20 md:px-10 md:py-24"
      style={{
        background: `url(${brandSectionBg}) center / cover no-repeat`,
      }}
    >
      <div className="mx-auto max-w-7xl">
        <SectionReveal>
        <div className="brand-grid grid grid-cols-1 gap-5 lg:grid-cols-2">
          <Card className="brand-box brand-box--intro brand-card-equal warm-briefing min-h-[360px] gap-0 overflow-hidden rounded-2xl p-0 shadow-2xl">
            <div className="brand-intro-shell flex h-full flex-col justify-between">
              <div>
                <p className="font-plex text-xs font-medium uppercase tracking-[0.18em] text-ember">
                  What is ADITI
                </p>
                <h2 className="mt-4 max-w-[9.5ch] font-rajdhani text-[clamp(2.35rem,5.8vw,4.3rem)] font-bold leading-[0.9] tracking-[-0.03em] text-void text-balance">
                  Pay for the argument, not the access
                </h2>
                <p className="brand-intro-text copy-width mt-8 max-w-[34rem] font-lora text-[1.1rem] leading-relaxed text-void/90">
                  Buy the analysis you need without a subscription.
                </p>
                <ul className="reading-card-list mt-4 font-lora text-[1.06rem] leading-relaxed">
                  <li>Premium Magzines at {premiumMagazine?.priceLabel ?? "\u20B9100"}, no subscription required</li>
                  <li>Open-access primers to start with, before you go premium</li>
                  <li>Built for mobile and desktop readability</li>
                </ul>
              </div>

              <div className="brand-stats-row brand-stats-row--inside">
                {BRAND_STATS.map((stat) => (
                  <div
                    key={stat.label}
                    className={cn(
                      "brand-stat-item brand-stat-item--glass",
                      activeStat === stat.label && "brand-stat-item--active",
                      stat.tone === "void" && "brand-stat-item--void",
                      stat.tone === "plate" && "brand-stat-item--plate",
                      stat.tone === "ember" && "brand-stat-item--ember"
                    )}
                    onTouchStart={() => setActiveStat(stat.label)}
                    onTouchEnd={() => setActiveStat(null)}
                    onTouchCancel={() => setActiveStat(null)}
                  >
                    <p className="brand-stat-value font-rajdhani text-[2.5rem] font-bold leading-none tracking-[-0.04em] text-ember md:text-[3rem]">
                      {stat.value}
                    </p>
                    <p className="brand-stat-label font-plex text-[0.62rem] font-medium uppercase tracking-[0.2em] text-steel md:text-[0.72rem]">
                      {stat.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          <div className="brand-side-layout flex flex-col gap-5">
            <Card
              id="premium-magazine"
              className="brand-box brand-box--reading brand-card-equal h-full min-h-[320px] scroll-mt-24 gap-0 overflow-hidden rounded-2xl p-0 shadow-[0_0_45px_rgba(200,133,58,0.16)]"
            >
              <img
                src={magazineMockup}
                alt="ADITI Strategy and Defence Magazine mockup"
                className="h-1/2 min-h-[14rem] w-full rounded-t-2xl object-cover object-center lg:min-h-0"
              />
              <div className="brand-reading-shell flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center md:p-8">
                <div>
                  <p className="font-plex text-xs font-medium uppercase tracking-[0.18em] text-chalk">
                    Premium Magazine
                  </p>
                  <h3 className="mx-auto mt-4 max-w-[11ch] text-center font-rajdhani text-[clamp(2rem,6.4vw,3.6rem)] font-bold leading-[0.95]">
                    <span>Volume 1, Issue 1.</span>
                    <span className="reading-card-nowrap">Cognitive Dissonance.</span>
                  </h3>
                </div>
                <div className="flex justify-center">
                  {premiumMagazine ? (
                    <AddToCartButton
                      article={premiumMagazine}
                      stopPropagation={false}
                      preselect={false}
                      className="mt-2 min-h-11 rounded-full bg-ember px-6 py-3 font-rajdhani text-base font-bold text-void transition hover:bg-chalk hover:text-void"
                    >
                      Buy Now
                    </AddToCartButton>
                  ) : null}
                </div>
              </div>
            </Card>
          </div>
        </div>
        </SectionReveal>
      </div>
    </section>
  );
}
