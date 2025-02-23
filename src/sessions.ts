import { Browser } from "puppeteer-core";

export const sessions = new Map<string, Browser>();

/**
 * Handle SIGINT, SIGTERM, and SIGQUIT signals
 */
['SIGINT', 'SIGTERM', 'SIGQUIT'].forEach(signal => {
  process.on(signal, () => {
    console.log(`${signal} received`);
    for (const browser of sessions.values()) {
      browser.close();
    }
    sessions.clear();
    process.exit(0);
  });
});
