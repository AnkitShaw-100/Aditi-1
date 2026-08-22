import { useState } from "react";

import SectionReveal from "@/components/site/SectionReveal";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { LENSES, frameworkBg } from "@/data/siteContent";
import frameworkWordmark from "../../../media/framework-wordmark.png";

export default function FrameworkSection() {
  const [activeLens, setActiveLens] = useState(LENSES[0].id);

  return (
    <section
      id="pillars"
      className="bg-void px-4 py-12 scroll-mt-20 md:px-8 md:py-16"
    >
      <div className="mx-auto max-w-7xl">
        <SectionReveal>
          <div
            className="framework-stage relative overflow-hidden rounded-2xl border border-steel/60 md:rounded-xl"
            style={{
              backgroundImage: `linear-gradient(135deg, rgba(35, 41, 31, 0.92), rgba(9, 11, 8, 0.98)), url(${frameworkBg})`,
            }}
          >
            <div className="framework-shell">
              <div>
                <p className="framework-kicker">Brand Framework</p>
                <h2 className="framework-title mt-5 font-rajdhani font-bold text-chalk">
                  Most magazines have a name. Ours is a method.
                </h2>
                <p className="framework-copy mt-6">
                  Every strategic outcome is decided by five forces:{" "}
                  <span>
                    what you fight with, how you think, who moves first, where it
                    happens, and how it all holds together.
                  </span>{" "}
                  Miss one, and the whole picture
                  lies to you. ADITI is those five forces — and every issue
                  reads one hard question through all of them, to the end.
                </p>
                <div className="aditi-mark" aria-label="ADITI brand letters">
                  <img src={frameworkWordmark} alt="ADITI" draggable={false} />
                </div>
              </div>

              <div className="framework-panel">
                <Tabs
                  value={activeLens}
                  onValueChange={setActiveLens}
                  orientation="vertical"
                  className="flex flex-col gap-0"
                >
                  <TabsList
                    variant="line"
                    className="lens-nav grid w-full gap-0 rounded-none bg-transparent p-0"
                  >
                    {LENSES.map((lens) => (
                      <TabsTrigger
                        key={lens.id}
                        value={lens.id}
                        onMouseEnter={() => setActiveLens(lens.id)}
                        className={cn(
                          "lens-button flex min-h-18 w-full items-center justify-start gap-4 rounded-none border-b border-steel/40 bg-transparent px-0 text-left text-fog hover:bg-transparent hover:text-chalk data-[state=active]:border-ember/75 data-[state=active]:bg-transparent data-[state=active]:text-chalk data-active:border-ember/75 data-active:bg-transparent data-active:text-chalk",
                          "md:grid md:grid-cols-[3rem_minmax(0,1fr)] md:items-center md:gap-4"
                        )}
                      >
                        <b className="font-rajdhani text-4xl leading-none text-ember md:text-[2.5rem]">
                          {lens.index}
                        </b>
                        <span className="font-plex text-[0.8rem] font-medium uppercase tracking-[0.2em]">
                          {lens.title}
                        </span>
                      </TabsTrigger>
                    ))}
                  </TabsList>

                  {LENSES.map((lens) => (
                    <TabsContent
                      key={lens.id}
                      value={lens.id}
                      className="lens-detail mt-6"
                    >
                      <h3 className="font-rajdhani text-[clamp(1.7rem,2.6vw,2.4rem)] font-bold leading-[1] text-chalk">
                        {lens.title}
                      </h3>
                      <p className="mt-4 max-w-2xl font-plex text-base leading-[1.75] text-ash">
                        {lens.copy}
                      </p>
                    </TabsContent>
                  ))}
                </Tabs>
              </div>
            </div>
          </div>
        </SectionReveal>
      </div>
    </section>
  );
}
