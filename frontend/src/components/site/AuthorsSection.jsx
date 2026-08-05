import { useState } from "react";

import SectionReveal from "@/components/site/SectionReveal";
import { AuthorCard, RailCarousel } from "@/components/site/shared";
import { AUTHOR_ISSUES } from "@/data/siteContent";
import { cn } from "@/lib/utils";

export default function AuthorsSection() {
  const [activeIssueId, setActiveIssueId] = useState(AUTHOR_ISSUES[0].id);

  const activeIssue =
    AUTHOR_ISSUES.find((issue) => issue.id === activeIssueId) ?? AUTHOR_ISSUES[0];

  return (
    <section
      id="authors"
      className="authors-section border-t border-steel px-4 py-16 scroll-mt-20 md:px-8 md:py-24"
    >
      <div className="mx-auto max-w-7xl">
        <SectionReveal>
          <div className="grid gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-start">
            <div>
              <p className="font-plex text-xs font-medium uppercase tracking-[0.18em] text-ember">
                Who writes it
              </p>
              <h2 className="mt-3 max-w-xl font-rajdhani text-[clamp(2rem,6vw,4rem)] font-bold leading-[0.96] text-chalk">
                Read the people who made the decisions.
              </h2>
              <p className="mt-4 max-w-lg font-plex text-base font-light leading-[1.85] text-ash">
                {activeIssue.authors.length} contributors. {activeIssue.label}.
                India's military leaders, scholars and industry pioneers on space,
                cyber, aviation and defence technology {" "}&mdash; perspectives you
                won't find assembled anywhere else
              </p>

              <div
                className="authors-issue-switch"
                role="tablist"
                aria-label="Contributors by issue"
              >
                {AUTHOR_ISSUES.map((issue) => (
                  <button
                    key={issue.id}
                    type="button"
                    role="tab"
                    id={`authors-tab-${issue.id}`}
                    aria-selected={issue.id === activeIssue.id}
                    aria-controls={`authors-panel-${issue.id}`}
                    className={cn(
                      "authors-issue-switch__button",
                      issue.id === activeIssue.id && "is-active"
                    )}
                    onClick={() => setActiveIssueId(issue.id)}
                  >
                    {issue.label}
                  </button>
                ))}
              </div>
            </div>

            <div
              className="authors-carousel-wrap min-w-0"
              id={`authors-panel-${activeIssue.id}`}
              role="tabpanel"
              aria-labelledby={`authors-tab-${activeIssue.id}`}
            >
              <RailCarousel
                key={activeIssue.id}
                items={activeIssue.authors}
                desktopPageSize={2}
                mobilePageSize={1}
                ariaLabel={`${activeIssue.label} contributors carousel`}
                trackClassName="authors-track"
                itemClassName="authors-carousel-item"
                showArrows
                arrowsClassName="authors-carousel-arrows"
                renderItem={(author) => <AuthorCard author={author} />}
              />
            </div>
          </div>
        </SectionReveal>
      </div>
    </section>
  );
}
