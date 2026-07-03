import SectionReveal from "@/components/site/SectionReveal";
import { AuthorCard, RailCarousel } from "@/components/site/shared";
import { AUTHORS } from "@/data/siteContent";

export default function AuthorsSection() {
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
                Issue I is written by 15 contributors across the armed forces,
                strategic scholarship, industry, space, cyber, aviation and
                defence technology.
              </p>
            </div>

            <div className="authors-carousel-wrap min-w-0">
              <RailCarousel
                items={AUTHORS}
                desktopPageSize={2}
                mobilePageSize={1}
                ariaLabel="Contributors carousel"
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
