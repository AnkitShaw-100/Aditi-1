import { Check } from "lucide-react";

import SectionReveal from "@/components/site/SectionReveal";
import { AddToCartButton } from "@/components/site/shared";
import { DISPATCHES } from "@/data/siteContent";

const OFFER_POINTS = [
  "All 16 contributions - the full issue, instantly",
  "Yours to keep - read it for years",
  "One payment - buy only the issue you want",
  "Read on mobile & desktop",
  "Read ADITI from its very first edition",
];

export default function IssueOfferSection() {
  const premiumMagazine = DISPATCHES.find((item) => item.type === "premium");

  if (!premiumMagazine) {
    return null;
  }

  return (
    <section className="issue-offer-section border-t border-steel px-4 py-16 md:px-8 md:py-24">
      <div className="mx-auto max-w-5xl">
        <SectionReveal>
          <div className="issue-offer-heading text-center">
            <p className="font-plex text-xs font-medium uppercase tracking-[0.28em] text-ember">
              The Offer
            </p>
            <h2 className="issue-offer-title mt-3 font-rajdhani font-bold text-chalk">
              Be the one in the room
              <span className="issue-offer-title__accent">
                who actually <span>understands.</span>
              </span>
            </h2>
            <p className="mx-auto mt-5 max-w-3xl font-lora text-sm leading-[1.8] text-ash md:text-base">
              No commitment. No account to manage. Just the complete first issue
              {" "}&mdash; yours the moment you buy it.
            </p>
          </div>

          <article className="issue-offer-card">
            <div className="issue-offer-badge">Volume I {"\u00B7"} Issue I</div>
            <div className="issue-offer-price">
              <span>{"\u20B9"}</span>
              <strong>350</strong>
            </div>
            <h3>The complete magazine</h3>
            <p className="issue-offer-subtitle">
              Issue I &mdash; Cognitive Dissonance in Indian Strategy.
            </p>

            <ul className="issue-offer-list">
              {OFFER_POINTS.map((point) => (
                <li key={point}>
                  <Check className="size-4" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>

            <AddToCartButton
              article={premiumMagazine}
              stopPropagation={false}
              className="final-button issue-offer-button h-12 w-full rounded-none font-rajdhani text-base font-bold"
            >
              Own Issue I {"\u00B7"} {"\u20B9"}350
            </AddToCartButton>

            <p className="issue-offer-footnote">
              Secure checkout {"\u00B7"} Instant access
            </p>
          </article>
        </SectionReveal>
      </div>
    </section>
  );
}
