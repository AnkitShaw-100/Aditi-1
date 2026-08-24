import * as React from "react"

const MOBILE_BREAKPOINT = 768

function getIsMobile() {
  if (typeof window === "undefined") {
    return false;
  }
  return window.innerWidth < MOBILE_BREAKPOINT;
}

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState(getIsMobile);

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return isMobile;
}

/*
 * The carousel stylesheets switch card widths at 1200px, so the rails need the
 * same boundary in JS to keep the page size matched to how many cards are
 * actually on screen.
 */
const DESKTOP_BREAKPOINT = 1200;

const TABLET_QUERY =
  `(min-width: ${MOBILE_BREAKPOINT}px) and (max-width: ${DESKTOP_BREAKPOINT - 1}px)`;

function getIsTablet() {
  if (typeof window === "undefined") {
    return false;
  }
  return window.matchMedia(TABLET_QUERY).matches;
}

export function useIsTablet() {
  const [isTablet, setIsTablet] = React.useState(getIsTablet);

  React.useEffect(() => {
    const mql = window.matchMedia(TABLET_QUERY);
    const onChange = () => {
      setIsTablet(mql.matches);
    };
    onChange();
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return isTablet;
}
