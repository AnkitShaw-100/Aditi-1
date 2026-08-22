import AuroraGraphic from "@/components/site/AuroraGraphic";

export default function MissionSection() {
  return (
    <section
      id="mission"
      className="mission-section relative isolate overflow-hidden scroll-mt-20 bg-[#08090C]"
    >
      {/* Background layers */}
      <div className="mission-mesh absolute inset-0" aria-hidden="true" />
      <div
        className="mission-glow mission-glow--left absolute -left-32 top-[-8rem] h-[26rem] w-[26rem] rounded-full blur-[110px] md:h-[34rem] md:w-[34rem]"
        aria-hidden="true"
      />
      <div
        className="mission-glow mission-glow--right absolute -right-28 bottom-[-10rem] h-[22rem] w-[22rem] rounded-full blur-[100px] md:h-[30rem] md:w-[30rem]"
        aria-hidden="true"
      />
      <div className="mission-noise absolute inset-0 opacity-20" aria-hidden="true" />

      {/* Aurora accent */}
      <div className="mission-aurora pointer-events-none absolute inset-x-0 bottom-0 h-[34%] opacity-60 md:h-[42%]" aria-hidden="true">
        <AuroraGraphic
          colorStops={["#202719", "#c99a4a", "#B22222"]}
          amplitude={0.78}
          blend={0.68}
          speed={0.48}
        />
      </div>

      {/* Content */}
      <div className="mission-shell relative z-10 mx-auto max-w-7xl px-6 py-20 md:px-10 md:py-28 lg:py-32">
        <div className="mission-copy max-w-5xl">
          <p className="font-plex text-xs font-semibold uppercase tracking-[0.22em] text-amber-300/90">
            Mission Statement
          </p>

          <p className="mission-word mt-5 font-rajdhani text-6xl font-bold leading-none text-white sm:text-7xl md:text-8xl lg:text-[7rem]">
            ADITI
          </p>

          <p className="mission-audience mt-5 text-base text-amber-200/80 md:text-lg">
            is for those
          </p>

          <h2 className="mission-headline mt-6 max-w-4xl font-rajdhani text-3xl font-bold leading-[1.05] text-white sm:text-4xl md:text-5xl lg:text-6xl">
            Who wants the argument, not the headline.
            <span className="mt-2 block text-white/90">
              The reasoning, not the noise.
            </span>
          </h2>

          <p className="mission-subtext mt-8 max-w-3xl font-plex text-base leading-8 text-neutral-300 md:text-lg">
            One issue. One deep argument. The questions shaping Indian power,
            answered by India's strategic minds. ADITI Issue I is out &mdash;
            read Issue I today.
          </p>

          <div className="mission-rail mt-10 flex items-center gap-3" aria-hidden="true">
            <span className="h-px w-10 bg-red-300/80" />
            <span className="h-px w-20 bg-amber-400/50" />
            <span className="h-px w-10 bg-amber-300/80" />
          </div>

          <p className="mission-note mt-8 max-w-2xl font-lora text-lg italic leading-relaxed text-neutral-300">
            This magazine is for The ADITI Reader
          </p>
        </div>
      </div>
    </section>
  );
}