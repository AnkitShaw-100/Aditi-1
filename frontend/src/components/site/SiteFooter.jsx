import { NAV_ITEMS } from "@/data/siteContent";

export default function SiteFooter() {
  return (
    <footer className="site-footer border-t border-steel bg-void">
      <div className="mx-auto grid max-w-7xl gap-x-10 gap-y-12 px-4 py-12 md:grid-cols-[1.3fr_0.7fr_1.15fr_1fr] md:px-8 md:py-16">
        <div>
          <p className="font-rajdhani text-2xl font-bold leading-none tracking-[0.12em] text-chalk">
            ADITI
          </p>
          <p className="mt-5 max-w-[34ch] font-plex text-sm font-light leading-relaxed text-fog">
            Indian strategic geopolitics and military affairs, written as disciplined arguments for readers who want depth over noise.
          </p>
          <p className="mt-4 font-plex text-xs uppercase leading-relaxed tracking-[0.2em] text-ember">
            Quarterly dispatches. Independent reading.
          </p>
        </div>

        <div>
          <p className="font-plex text-xs font-medium uppercase leading-none tracking-[0.18em] text-ember">
            Explore
          </p>
          <nav className="mt-3 flex flex-col font-plex text-sm font-light text-fog" aria-label="Footer navigation">
            {NAV_ITEMS.map((item) => (
              <a
                key={item.id}
                className="flex min-h-10 items-center transition hover:text-chalk"
                href={`#${item.id}`}
              >
                {item.label}
              </a>
            ))}
          </nav>
        </div>

        <div>
          <p className="font-plex text-xs font-medium uppercase leading-none tracking-[0.18em] text-ember">
            Contact
          </p>
          <div className="mt-5 space-y-3 font-plex text-sm font-light leading-[1.7] text-fog">
            <p>aditidefence@cscan.co.in</p>
            <p>Innov8 Coworking Space, Lower Ground Floor, Saket Salcon, Rasvilas, next to Select Citywalk Mall, Saket District Centre, District Centre, Sector 6, Pushp Vihar, New Delhi, Delhi 110017, India</p>
          </div>
        </div>

        <div>
          <p className="font-plex text-xs font-medium uppercase leading-none tracking-[0.18em] text-ember">
            Current Issue
          </p>
          <p className="mt-5 font-rajdhani text-xl font-bold leading-tight text-chalk">
            Volume I, Dispatch Series
          </p>
          <p className="mt-3 font-plex text-sm font-light leading-relaxed text-fog">
            Receive one article at a time. No feed churn. No noise. Just analysis worth keeping.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href="#read"
              className="inline-flex min-h-10 items-center rounded-full border border-ember/40 bg-ember/10 px-4 font-plex text-xs uppercase tracking-[0.16em] text-chalk transition hover:bg-ember/20"
            >
              Browse Dispatches
            </a>
          </div>
        </div>
      </div>
      <div>
        <div className="mx-auto grid max-w-7xl gap-3 px-4 pb-8 pt-2 font-plex text-xs font-light text-fog md:grid-cols-[1fr_auto] md:items-center md:px-8">
          <p>&copy; 2024 ADITI Strategic Publications</p>
          <p className="uppercase tracking-[0.18em]">
            Strategy, doctrine, terrain, and consequence
          </p>
        </div>
      </div>
    </footer>
  );
}
