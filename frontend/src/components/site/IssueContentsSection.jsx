import { ArrowRight } from "lucide-react";

import SectionReveal from "@/components/site/SectionReveal";
import { AddToCartButton } from "@/components/site/shared";
import { DISPATCHES } from "@/data/siteContent";

const issueCoverImage = "/article-banners/aditi-strategy-defence-magazine-cover.webp";

const ISSUE_STATS = [
  { value: "16", label: "Contributors" },
  { value: "5", label: "Lenses" },
  { value: "1", label: "Hard question" },
];

export default function IssueContentsSection() {
  const premiumMagazine = DISPATCHES.find((item) => item.type === "premium");

  return (
    <section className="issue-contents-section border-t border-steel px-4 py-16 md:px-8 md:py-24">
      <div className="mx-auto max-w-7xl">
        <SectionReveal>
          <div className="issue-contents-layout">
            <figure className="issue-contents-cover" aria-label="ADITI Issue I cover">
              <img
                src={issueCoverImage}
                alt="ADITI Strategy and Defence Magazine Issue I cover"
                className="issue-contents-cover__image"
                loading="eager"
                draggable={false}
              />
            </figure>

            <div className="issue-contents-copy">
              <p className="issue-contents-kicker">
                Issue I {"\u00B7"} The Maiden Dispatch
              </p>
              <h2 className="issue-contents-title">
                Cognitive <span>Dissonance</span> in Indian Strategy.
              </h2>
              <p className="issue-contents-question">
                How does a rising power hold many competing strategic truths at once
                 and still move as one?
              </p>
              <p className="issue-contents-body">
                As India's power grows, so does the complexity of its choices.
                Different doctrines, different instincts, different timelines
                 all alive inside the same state at the same moment. Issue I
                reads that tension across capability, command, terrain and doctrine,
                and asks the question every maturing power must answer: how do you
                turn many truths into one clear strategy?
              </p>

              <div className="issue-contents-stats" aria-label="Issue I summary stats">
                {ISSUE_STATS.map((stat) => (
                  <div className="issue-contents-stat" key={stat.label}>
                    <strong>{stat.value}</strong>
                    <span>{stat.label}</span>
                  </div>
                ))}
              </div>

              <div className="issue-contents-actions">
                {premiumMagazine ? (
                  <AddToCartButton
                    article={premiumMagazine}
                    stopPropagation={false}
                    className="final-button issue-contents-primary h-11 rounded-none px-7 font-rajdhani text-base font-bold"
                  >
                    Own Issue I {"\u00B7"} {"\u20B9"}350{" "}
                  </AddToCartButton>
                ) : null}
                <a className="issue-contents-link" href="#authors">
                  See who wrote it <ArrowRight className="size-4" />
                </a>
              </div>
            </div>
          </div>
        </SectionReveal>
      </div>
    </section>
  );
}
