import AuroraGraphic from "@/components/site/AuroraGraphic";

export default function MissionSection() {
  return (
    <section id="mission" className="mission-section scroll-mt-20">
      <div className="mission-mesh" aria-hidden="true" />
      <div className="mission-glow mission-glow--left" aria-hidden="true" />
      <div className="mission-glow mission-glow--right" aria-hidden="true" />
      <div className="mission-noise" aria-hidden="true" />

      <div className="mission-shell mx-auto max-w-7xl px-4 py-18 md:px-8 md:py-24">
        <div className="mission-copy max-w-6xl">
          <p className="font-plex text-xs font-medium uppercase tracking-[0.18em] text-ember">
            Mission Statement
          </p>
          <p className="mission-word mt-4 font-rajdhani font-bold leading-none text-chalk">
            ADITI
          </p>
          <p className="mission-audience mt-4 text-ember">is for those</p>
          <h2 className="mission-headline mt-5 font-rajdhani font-bold text-chalk">
            Who wants the argument, not the headline.
            <span>The reasoning, not the noise.</span>
          </h2>
          <p className="mission-subtext mt-6 font-plex font-light text-ash">
            One issue. One deep argument. The questions shaping Indian power,
            answered by India's strategic minds. ADITI Issue I is out &mdash;
            Read Issue I today.
          </p>
          <div className="mission-rail mt-8" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          <p className="mission-note mt-7 max-w-2xl font-lora text-[1rem] italic leading-relaxed text-fog">
            This magazine is for The ADITI Reader
          </p>
        </div>
      </div>

      <div className="mission-aurora" aria-hidden="true">
        <AuroraGraphic
          colorStops={["#202719", "#c99a4a", "#8a713f"]}
          amplitude={0.78}
          blend={0.68}
          speed={0.48}
        />
      </div>
    </section>
  );
}
