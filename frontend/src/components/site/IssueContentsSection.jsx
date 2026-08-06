import { useState } from "react";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";

import SectionReveal from "@/components/site/SectionReveal";
import { AddToCartButton } from "@/components/site/shared";
import { AUTHOR_ISSUES, magazineForIssue } from "@/data/siteContent";

// Counted from the contributor list so the stat can never drift out of sync.
function contributorCount(ordinal) {
  return AUTHOR_ISSUES.find((issue) => issue.ordinal === ordinal)?.authors.length ?? 0;
}

function issueStats(contributorCount) {
  return [
    { value: String(contributorCount), label: "Contributors" },
    { value: "5", label: "Lenses" },
    { value: "1", label: "Hard question" },
  ];
}

// Newest issue first. Moving "next" walks back through the archive.
const ISSUES = [
  {
    id: "issue-2",
    ordinal: "II",
    cover: "/article-banners/aditi-strategy-defence-magazine-issue-2-cover.webp",
    kicker: `Issue II ${"·"} The Maiden Dispatch`,
    title: { lead: "Forging the Republic's ", accent: "Power", tail: "" },
    question:
      "How does a republic forge enduring power without losing the principles that give it purpose?",
    body:
      "As India's ambitions expand, so must the institutions, industries, and ideas that sustain them. Power is not built through military strength alone, but through the steady forging of doctrine, technology, industry, diplomacy, and national resolve. Issue II explores how these elements converge across Armament, Doctrine, Initiative, Terrain, and Integration, asking the defining question of a rising republic: how do you transform national potential into enduring power?",
    stats: issueStats(contributorCount("II")),
  },
  {
    id: "issue-1",
    ordinal: "I",
    cover: "/article-banners/aditi-strategy-defence-magazine-cover.webp",
    kicker: `Issue I ${"·"} The Maiden Dispatch`,
    title: { lead: "Cognitive ", accent: "Dissonance", tail: " in Indian Strategy?" },
    question:
      "How does a rising power hold many competing strategic truths at once and still move as one?",
    body:
      "As India's power grows, so does the complexity of its choices. Different doctrines, different instincts, different timelines all alive inside the same state at the same moment. Issue I reads that tension across Armament, Doctrine, Initiative, Terrain and Integration and asks the question every maturing power must answer: how do you turn many truths into one clear strategy?",
    stats: issueStats(contributorCount("I")),
  },
];

export default function IssueContentsSection() {
  const [activeIndex, setActiveIndex] = useState(0);

  const issue = ISSUES[activeIndex];
  const premiumMagazine = magazineForIssue(issue.ordinal);
  const canGoNewer = activeIndex > 0;
  const canGoOlder = activeIndex < ISSUES.length - 1;

  return (
    <section className="issue-contents-section border-t border-steel px-4 py-16 md:px-8 md:py-24">
      <div className="mx-auto max-w-7xl">
        <SectionReveal>
          <div
            className="issue-contents-layout"
            role="group"
            aria-roledescription="carousel"
            aria-label="ADITI issues"
          >
            <figure
              className="issue-contents-cover"
              aria-label={`ADITI Issue ${issue.ordinal} cover`}
            >
              <img
                key={issue.id}
                src={issue.cover}
                alt={`ADITI Strategy and Defence Magazine Issue ${issue.ordinal} cover`}
                className="issue-contents-cover__image"
                loading="eager"
                draggable={false}
              />
            </figure>

            <div className="issue-contents-copy" key={issue.id}>
              <p className="issue-contents-kicker">{issue.kicker}</p>
              <h2 className="issue-contents-title">
                {issue.title.lead}
                <span>{issue.title.accent}</span>
                {issue.title.tail}
              </h2>
              <p className="issue-contents-question">{issue.question}</p>
              <p className="issue-contents-body">{issue.body}</p>

              <div
                className="issue-contents-stats"
                aria-label={`Issue ${issue.ordinal} summary stats`}
              >
                {issue.stats.map((stat) => (
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
                    Own Issue {issue.ordinal} {"·"} {premiumMagazine.priceLabel}{" "}
                  </AddToCartButton>
                ) : null}
                <a className="issue-contents-link" href="#authors">
                  See who wrote it <ArrowRight className="size-4" />
                </a>
              </div>

              <div className="issue-contents-nav">
                <button
                  type="button"
                  className="issue-contents-nav__button"
                  aria-label="Show the newer issue"
                  disabled={!canGoNewer}
                  onClick={() => setActiveIndex((index) => Math.max(0, index - 1))}
                >
                  <ChevronLeft className="size-5" />
                </button>
                <p className="issue-contents-nav__status" aria-live="polite">
                  Issue {issue.ordinal} of {ISSUES[0].ordinal}
                </p>
                <button
                  type="button"
                  className="issue-contents-nav__button"
                  aria-label="Show the previous issue"
                  disabled={!canGoOlder}
                  onClick={() =>
                    setActiveIndex((index) => Math.min(ISSUES.length - 1, index + 1))
                  }
                >
                  <ChevronRight className="size-5" />
                </button>
              </div>
            </div>
          </div>
        </SectionReveal>
      </div>
    </section>
  );
}
