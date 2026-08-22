import { RailCarousel, FeedbackCard } from "@/components/site/shared";
import { READER_FEEDBACKS } from "@/data/siteContent";

export default function ReaderFeedbackSection() {
  return (
    <section
      id="feedback"
      className="feedback-section border-t border-steel bg-void px-4 py-16 scroll-mt-20 md:px-8 md:py-24"
    >
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 md:mb-14">
          <p className="font-plex text-xs font-medium uppercase tracking-[0.18em] text-ember">
            Reader Testimonials
          </p>
          <h2 className="mt-3 max-w-3xl font-rajdhani text-[clamp(2rem,6vw,3.9rem)] font-bold leading-[0.98] text-chalk">
            Trusted by readers who need depth, not noise.
          </h2>
        </div>

        {/* Carousel with bottom navigation */}
        <div className="feedback-carousel-shell relative pb-20">
          <RailCarousel
            items={READER_FEEDBACKS}
            desktopPageSize={3}
            ariaLabel="Reader feedback carousel"
            trackClassName="feedback-track"
            itemClassName="basis-full md:basis-[calc((100%_-_2rem)/3)] flex"
            controlsClassName="feedback-carousel-dots mt-8"
            showArrows
            arrowsClassName="feedback-carousel-arrows"
            renderItem={(feedback) => <FeedbackCard feedback={feedback} />}
          />
        </div>
      </div>
    </section>
  );
}