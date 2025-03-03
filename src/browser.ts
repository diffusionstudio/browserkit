import puppeteer, { Browser as PuppeteerBrowser, Target } from 'puppeteer-core';
import { v4 as uuid } from 'uuid';
import fs from 'fs';

import { MAX_BROWSER_INSTANCES, CHROME_PATH, CHROME_ARGS } from './environment';
import { CHROME_SECURITY_FLAGS } from './constants';
import { report } from './monitoring';
import { supabase } from './supabase';
import { logger } from "./logger";

export const browsers = new Map<string, Browser>();

export class Browser {
  public readonly user?: string | null;
  public readonly id: string = uuid();
  public instance?: PuppeteerBrowser;
  public pages: string[] = [];
  public dataDir: string = `/tmp/browser-session/${this.id.replace(/-/g, '')}`;

  public constructor(user?: string | null) {
    this.user = user;
  }

  public async init() {
    try {
      const { error } = await supabase
        .from('browsers')
        .insert([{ id: this.id, user: this.user }])
        .single();

      if (error) {
        logger.error('Error creating browser database entry:', error);
        return;
      }

      this.instance = await puppeteer.launch({
        executablePath: CHROME_PATH,
        headless: true,
        args: [
          ...CHROME_SECURITY_FLAGS,
          ...CHROME_ARGS,
          `--user-data-dir=${this.dataDir}`,
        ],
      });

      this.instance.on('targetcreated', this.handlePageCreated.bind(this));
      logger.info('Initialized browser:', this.id);
      browsers.set(this.id, this);
      this.handleUtilizationReport();
    } catch (e) {
      logger.error('Error initializing browser:', e);
      // Cleanup database entry if browser failed to initialize
      await supabase
        .from('browsers')
        .delete()
        .eq('id', this.id)
        .then(res => res.error && logger.error('Error cleaning up browser entry:', res.error));
    }
  }

  public async close() {
    if (!this.instance) return;

    try {
      await this.instance.close();
      await fs.promises.rm(this.dataDir, { recursive: true, force: true });
      logger.info('Closed browser and removed data directory:', this.id);
    } catch (e) {
      logger.error('Error closing browser:', e);
    } finally {
      await supabase
        .from('browsers')
        .update({ closed_at: new Date().toISOString() })
        .is('closed_at', null)
        .eq('id', this.id)
        .single()
        .then(res => res.error && logger.error('Error updating browser closed_at:', res.error));

      await supabase
        .from('browser_tabs')
        .update([{ browser: this.id, closed_at: new Date().toISOString() }])
        .eq('browser', this.id)
        .then(res => res.error && logger.error('Error updating browser tabs:', res.error));

      this.instance = undefined;
      browsers.delete(this.id);
      this.handleUtilizationReport();
    }
  }

  private async handlePageCreated(target: Target) {
    if (target.type() !== 'page') return;

    const page = await target.page();

    const { data, error } = await supabase
      .from('browser_tabs')
      .insert([{ browser: this.id }])
      .select()
      .single();

    if (error || !data) {
      logger.error('Error creating tab database entry:', error);
    } else {
      this.pages.push(data.id);
      page?.on('close', () => this.handlePageClosed(data.id)());
    }
  }

  private handlePageClosed(tabId: string) {
    return async () => {
      await supabase
        .from('browser_tabs')
        .update({ closed_at: new Date().toISOString() })
        .eq('id', tabId)
        .single()
        .then(res => res.error && logger.error('Error updating tab closed_at:', res.error));

      this.pages = this.pages.filter(id => id !== tabId);
    }
  }

  private async handleUtilizationReport() {
    return await report([{
      type: 'custom.googleapis.com/browser_utilization',
      value: Math.round(browsers.size * 100 / MAX_BROWSER_INSTANCES),
    }]);
  }
}

/**
 * Handle SIGINT, SIGTERM, and SIGQUIT signals
 */
['SIGINT', 'SIGTERM', 'SIGQUIT'].forEach(signal => {
  process.on(signal, () => {
    logger.info(`${signal} received`);
    for (const browser of browsers.values()) {
      browser.close();
    }
    browsers.clear();
    process.exit(0);
  });
});
