import { useState } from "react";
import { Check, ChevronLeft, ChevronRight } from "lucide-react";

import SectionReveal from "@/components/site/SectionReveal";
import { AddToCartButton } from "@/components/site/shared";
import { AUTHOR_ISSUES, MAGAZINE_ISSUES, magazineForIssue } from "@/data/siteContent";

function contributorCount(ordinal) {
  return AUTHOR_ISSUES.find((issue) => issue.ordinal === ordinal)?.authors.length ?? 0;
}

function offerPoints(ordinal) {
  return [
    `All ${contributorCount(ordinal)} contributions - the full issue, instantly`,
    "Yours to keep - read it for years",
    "One payment - buy only the issue you want",
    "Read on mobile & desktop",
    ordinal === "I"
      ? "Read ADITI from its very first edition"
      : "The latest edition, straight to your account",
  ];
}

// Newest issue first, matching the order on the issue carousel.
const OFFER_CARDS = MAGAZINE_ISSUES.map((issue) => ({
  ...issue,
  magazine: magazineForIssue(issue.ordinal),
  points: offerPoints(issue.ordinal),
})).filter((card) => card.magazine);

export default function IssueOfferSection() {
  const [activeIndex, setActiveIndex] = useState(0);

  if (!OFFER_CARDS.length) {
    return null;
  }

  const card = OFFER_CARDS[Math.min(activeIndex, OFFER_CARDS.length - 1)];
  const canGoNewer = activeIndex > 0;
  const canGoOlder = activeIndex < OFFER_CARDS.length - 1;

  return (
    <section className="issue-offer-section border-t border-steel px-4 py-16 md:px-8 md:py-24">
      <div className="mx-auto max-w-6xl">
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
              One purchase, yours forever. Every issue you buy lives in your ADITI
              account {" "}&mdash; read anytime, on any device.
            </p>
          </div>

          <div
            className="issue-offer-carousel"
            role="group"
            aria-roledescription="carousel"
            aria-label="Issue offers"
          >
            <article className="issue-offer-card" key={card.slug}>
              <div className="issue-offer-badge">
                Volume I {"·"} {card.label}
              </div>
              <div className="issue-offer-price">
                <span>{"₹"}</span>
                <strong>{card.magazine.priceLabel.replace("₹", "")}</strong>
              </div>
              <h3>The complete issue</h3>
              <p className="issue-offer-subtitle">
                {card.label} &mdash; {card.shortTitle}.
              </p>

              <ul className="issue-offer-list">
                {card.points.map((point) => (
                  <li key={point}>
                    <Check className="size-4" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>

              <AddToCartButton
                article={card.magazine}
                stopPropagation={false}
                className="final-button issue-offer-button h-12 w-full rounded-none font-rajdhani text-base font-bold"
              >
                Own {card.label} {"·"} {card.magazine.priceLabel}
              </AddToCartButton>

              <p className="issue-offer-footnote">
                Secure checkout {"·"} Instant access
              </p>
            </article>

            {OFFER_CARDS.length > 1 ? (
              <div className="issue-offer-nav">
                <button
                  type="button"
                  className="issue-offer-nav__button"
                  aria-label="Show the newer issue"
                  disabled={!canGoNewer}
                  onClick={() => setActiveIndex((index) => Math.max(0, index - 1))}
                >
                  <ChevronLeft className="size-5" />
                </button>
                <p className="issue-offer-nav__status" aria-live="polite">
                  {card.label} of {OFFER_CARDS[0].label}
                </p>
                <button
                  type="button"
                  className="issue-offer-nav__button"
                  aria-label="Show the previous issue"
                  disabled={!canGoOlder}
                  onClick={() =>
                    setActiveIndex((index) =>
                      Math.min(OFFER_CARDS.length - 1, index + 1)
                    )
                  }
                >
                  <ChevronRight className="size-5" />
                </button>
              </div>
            ) : null}
          </div>
        </SectionReveal>
      </div>
    </section>
  );
}
