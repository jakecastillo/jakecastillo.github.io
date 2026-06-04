// scripts/audit/lib/profiles.mjs
import { devices } from "playwright";

/**
 * Two audit profiles. Desktop is a generous laptop viewport; mobile uses
 * Playwright's iPhone 13 descriptor (390x844, touch, dSF 3).
 */
export const PROFILES = {
  desktop: {
    name: "desktop",
    contextOptions: {
      viewport: { width: 1440, height: 900 },
      deviceScaleFactor: 1,
      isMobile: false,
      hasTouch: false,
    },
  },
  mobile: {
    name: "mobile",
    contextOptions: {
      ...devices["iPhone 13"], // viewport 390x844, touch, mobile UA
    },
  },
};
