import { RailCarousel, FeedbackCard } from "@/components/site/shared";
import { FEEDBACKS } from "@/data/siteContent";

export default function CredentialsSection() {
  return (
    <section
      id="credentials"
      className="credentials-field px-4 py-16 scroll-mt-20 md:px-8 md:py-24"
    >
      <div className="credentials-shell mx-auto max-w-7xl">
        <p className="font-plex text-xs font-medium uppercase tracking-[0.18em] text-ember">
          Credentials
        </p>
        <div className="credentials-head mt-3 grid gap-6 md:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] md:items-end">
          <div>
            <h2 className="max-w-3xl font-rajdhani text-[clamp(2.2rem,7vw,4.6rem)] font-bold leading-[0.95] text-chalk">
              Written by analysts and contributors.
            </h2>
            <p className="mt-4 max-w-2xl font-plex text-sm font-light leading-[1.8] text-ash">
              Editorial voices built around strategy, doctrine, technology and geopolitical judgment.
            </p>
          </div>
        </div>

        <RailCarousel
          items={FEEDBACKS}
          desktopPageSize={3}
          tabletPageSize={2}
          ariaLabel="Reader and editor feedback carousel"
          trackClassName="feedback-track"
          itemClassName="basis-full md:basis-[calc((100%_-_2rem)/3)]"
          showArrows
          arrowsClassName="feedback-carousel-arrows"
          controlsClassName="feedback-carousel-dots"
          renderItem={(feedback) => <FeedbackCard feedback={feedback} />}
        />
      </div>
    </section>
  );
}
