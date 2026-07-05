import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetClose, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useScrollSpy } from "@/hooks/use-scroll-spy";
import { MENU_ITEMS, NAV_ITEMS, SECTION_IDS, navbarLogo } from "@/data/siteContent";
import AuthNavButton from "@/components/site/AuthNavButton";

export default function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const activeSection = useScrollSpy(SECTION_IDS);

  useEffect(() => {
    document.body.classList.toggle("menu-open", menuOpen);
    return () => {
      document.body.classList.remove("menu-open");
    };
  }, [menuOpen]);

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[rgba(17,22,15,0.55)] shadow-[0_16px_55px_rgba(0,0,0,0.2)] backdrop-blur-2xl supports-[backdrop-filter]:bg-[rgba(17,22,15,0.4)]">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-3 sm:px-5 lg:px-4">
        <a
          href="/#intro"
          className="flex h-full items-center"
          aria-label="ADITI home"
        >
          <img
            src={navbarLogo}
            alt="ADITI"
            className="h-9 w-auto max-w-[9.5rem] object-contain sm:h-10 sm:max-w-[11rem] md:h-11 md:max-w-[12.5rem]"
          />
        </a>

        <div className="flex items-center gap-2 sm:gap-3 xl:gap-7">
          <nav className="hidden items-center gap-6 xl:flex" aria-label="Primary navigation">
            {NAV_ITEMS.map((item) => (
              <a
                key={item.id}
                className={cn(
                  "nav-link relative font-plex text-sm font-medium text-fog transition hover:text-chalk",
                  activeSection === item.id && "active text-chalk"
                )}
                href={`/#${item.id}`}
                aria-current={activeSection === item.id ? "page" : undefined}
                data-section={item.id}
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="hidden xl:block">
            <AuthNavButton />
          </div>

          <div className="block xl:hidden">
            <AuthNavButton compact />
          </div>

          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="menu-toggle flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 p-0 text-chalk shadow-none hover:bg-white/10 hover:text-chalk xl:hidden"
                aria-label="Open menu"
              >
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>

            <SheetContent
              side="top"
              showCloseButton={false}
              className="border-0 bg-transparent p-0 text-chalk shadow-none !h-screen !max-h-none !w-screen"
            >
              <div
                className="pointer-events-none fixed inset-0 z-[1000] overflow-y-auto bg-[radial-gradient(circle_at_18%_12%,rgba(128,135,83,0.18),transparent_28rem),radial-gradient(circle_at_82%_20%,rgba(201,154,74,0.12),transparent_22rem),linear-gradient(135deg,#14180f_0%,#090b08_56%,#202719_100%)]"
                aria-hidden="true"
              />
              <SheetClose asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-4 top-3 z-[1002] h-12 w-12 rounded-none border border-[rgba(168,170,157,0.45)] bg-[rgba(9,11,8,0.62)] p-0 font-rajdhani text-3xl font-bold text-chalk md:right-8 md:top-5"
                  aria-label="Close menu"
                >
                  <X className="size-6" />
                </Button>
              </SheetClose>

              <div className="menu-panel relative z-[1001] flex min-h-screen flex-col justify-center pt-16">
                {MENU_ITEMS.map((item) => (
                  <SheetClose asChild key={item.id}>
                    <a
                      href={`/#${item.id}`}
                      className="overlay-row grid min-h-[18vh] grid-cols-[56px_1fr] items-center border-b border-steel px-4 md:grid-cols-[96px_1fr_220px] md:px-8"
                    >
                      <span className="font-plex text-sm font-light text-ember">
                        {item.index}
                      </span>
                      <span className="font-rajdhani text-[clamp(2.5rem,8vw,5rem)] font-bold leading-none text-chalk">
                        {item.title}
                      </span>
                      <span className="hidden font-plex text-xs font-light uppercase tracking-[0.18em] text-fog md:block">
                        {item.meta}
                      </span>
                    </a>
                  </SheetClose>
                ))}
                <div className="px-4 py-5 md:px-8">
                  <AuthNavButton mobile />
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
