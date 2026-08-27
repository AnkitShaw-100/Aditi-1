import { useEffect, useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";

import { Button } from "@/components/ui/button";
import { AddToCartButton } from "@/components/site/shared";
import { LATEST_PREMIUM_MAGAZINE, heroMobileVideo, heroVideo } from "@/data/siteContent";

const DESKTOP_HERO_VIDEO_QUERY = "(min-width: 768px)";

function getInitialHeroVideo() {
  if (typeof window === "undefined") {
    return heroVideo;
  }

  return window.matchMedia(DESKTOP_HERO_VIDEO_QUERY).matches
    ? heroVideo
    : heroMobileVideo;
}

export default function HeroSection() {
  const [isMuted, setIsMuted] = useState(true);
  const [activeHeroVideo, setActiveHeroVideo] = useState(getInitialHeroVideo);
  const heroVideoRef = useRef(null);
  const activeHeroVideoRef = useRef(activeHeroVideo);
  const premiumMagazine = LATEST_PREMIUM_MAGAZINE;

  useEffect(() => {
    const video = heroVideoRef.current;
    if (!video) {
      return undefined;
    }

    video.muted = isMuted;
    video.playsInline = true;
    video.defaultMuted = true;

    if (activeHeroVideoRef.current !== activeHeroVideo) {
      activeHeroVideoRef.current = activeHeroVideo;
      video.load();
    }

    const playVideo = () => {
      video.play().catch(() => {});
    };

    video.addEventListener("canplay", playVideo, { once: true });
    if (isMuted) {
      playVideo();
    } else {
      video.play().catch(() => {});
    }

    return () => video.removeEventListener("canplay", playVideo);
  }, [activeHeroVideo, isMuted]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const mediaQuery = window.matchMedia(DESKTOP_HERO_VIDEO_QUERY);
    const syncHeroVideo = () => {
      setActiveHeroVideo(mediaQuery.matches ? heroVideo : heroMobileVideo);
    };

    syncHeroVideo();
    mediaQuery.addEventListener("change", syncHeroVideo);

    return () => mediaQuery.removeEventListener("change", syncHeroVideo);
  }, []);

  /*
   * A full-screen looping video keeps decoding frames while the reader is
   * halfway down the page, which costs a decode and a composite per frame for
   * something nobody can see. Pause it once the hero scrolls away, and pick
   * it back up on return. Sound stays off on resume so the video never starts
   * talking behind the reader's back.
   */
  useEffect(() => {
    const video = heroVideoRef.current;

    if (!video || typeof IntersectionObserver === "undefined") {
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.some((entry) => entry.isIntersecting);

        if (visible) {
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      },
      { threshold: 0.05 }
    );

    observer.observe(video);

    const handleVisibility = () => {
      if (document.hidden) {
        video.pause();
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [activeHeroVideo]);

  const toggleVideoSound = () => {
    const video = heroVideoRef.current;
    if (!video) {
      return;
    }

    const nextMuted = !isMuted;
    video.muted = nextMuted;
    video.defaultMuted = nextMuted;

    if (!nextMuted) {
      video.volume = 1;
      video.play().catch(() => {});
    }

    setIsMuted(nextMuted);
  };

  return (
    <section
      id="intro"
      className="hero-media relative min-h-screen overflow-hidden scroll-mt-20"
    >
      <video
        ref={heroVideoRef}
        className="absolute inset-0 z-0 h-screen min-h-screen w-full object-cover opacity-100"
        autoPlay
        muted={isMuted}
        loop
        playsInline
        preload="metadata"
        aria-label="ADITI hero video"
        src={activeHeroVideo}
      >
      </video>
      <div className="absolute inset-0 z-10 bg-linear-to-b from-void/5 via-plate/20 to-void/85" />
      <button
        type="button"
        className="absolute bottom-4 right-4 z-[60] grid h-11 w-11 place-items-center rounded-full border border-white/15 bg-void/55 text-chalk backdrop-blur-md transition touch-manipulation hover:border-ember/60 hover:bg-void/75 hover:text-ember focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember/60 sm:bottom-5 sm:right-5 sm:h-12 sm:w-12 md:bottom-6 md:right-6"
        onClick={toggleVideoSound}
        aria-label={isMuted ? "Turn sound on" : "Turn sound off"}
        aria-pressed={!isMuted}
      >
        {isMuted ? <VolumeX className="size-5" /> : <Volume2 className="size-5" />}
      </button>
      <div className="hero-panel absolute inset-x-0 bottom-0 z-20">
        <div className="hero-panel__shell mx-auto flex min-h-full max-w-7xl items-end px-5 sm:px-6 lg:px-10">
          <div className="hero-editorial-copy max-w-4xl">
            <h1 className="hero-editorial-title font-rajdhani font-bold text-chalk text-balance">
              For a century,
              <br />
              <em className="hero-editorial-italic">India was read by others.</em>
            </h1>
            <p className="hero-editorial-subline font-rajdhani font-bold text-chalk">
              <span>This is India,</span>{" "}
              <span>read by India.</span>
            </p>
            <div className="hero-editorial-actions flex flex-col gap-3 sm:flex-row sm:items-stretch">
              <Button
                asChild
                className="h-12 rounded-full bg-ember px-6 font-rajdhani text-base font-bold text-void hover:bg-[#ddb255]"
              >
                <a href="#read">Read for free</a>
              </Button>
              {premiumMagazine ? (
                <AddToCartButton
                  article={premiumMagazine}
                  stopPropagation={false}
                  preselect={false}
                  className="hero-issue-button h-12 rounded-full border border-white/15 bg-white/5 px-6 font-rajdhani text-base font-bold uppercase tracking-[0.14em] text-chalk hover:bg-white/10 hover:text-chalk"
                >
                  Own the issue {"\u00B7"} {premiumMagazine.priceLabel}
                </AddToCartButton>
              ) : null}
            </div>
          </div>
        </div>
      </div>
      <a
        href="#mission"
        className="hero-scroll-cue blink absolute left-1/2 z-20 -translate-x-1/2 font-plex text-sm text-ember"
        aria-label="Scroll to ADITI introduction"
      >
        &#9660;
      </a>
    </section>
  );
}
