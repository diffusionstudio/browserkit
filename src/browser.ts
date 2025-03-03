import puppeteer, { Browser as PuppeteerBrowser, Target } from 'puppeteer-core';
import { MAX_BROWSER_INSTANCES, CHROME_PATH, CHROME_ARGS } from './environment';
import { CHROME_SECURITY_FLAGS } from './constants';
import { report } from './monitoring';
import { v4 as uuid } from 'uuid';
import { supabase } from './lib/supabase';

export const browsers = new Map<string, Browser>();

export class Browser {
  public readonly user?: string | null;
  public readonly id: string = uuid();
  public instance?: PuppeteerBrowser;
  public pages: string[] = [];

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
        console.error('Error creating browser database entry:', error);
        return;
      }

      this.instance = await puppeteer.launch({
        executablePath: CHROME_PATH,
        headless: true,
        args: [...CHROME_SECURITY_FLAGS, ...CHROME_ARGS],
      });

      this.instance.on('targetcreated', this.handlePageCreated.bind(this));
      console.log('Initialized browser:', this.id);
      browsers.set(this.id, this);
      this.handleUtilizationReport();
    } catch (e) {
      console.error('Error initializing browser:', e);
      // Cleanup database entry if browser failed to initialize
      await supabase
        .from('browsers')
        .delete()
        .eq('id', this.id)
        .then(res => res.error && console.error('Error cleaning up browser entry:', res.error));
    }
  }

  public async close() {
    if (!this.instance) return;

    try {
      await this.instance.close();
      console.log('Closed browser:', this.id);
    } catch (e) {
      console.error('Error closing browser:', e);
    } finally {
      await supabase
        .from('browsers')
        .update({ closed_at: new Date().toISOString() })
        .is('closed_at', null)
        .eq('id', this.id)
        .single()
        .then(res => res.error && console.error('Error updating browser closed_at:', res.error));

      await supabase
        .from('browser_tabs')
        .update([{ browser: this.id, closed_at: new Date().toISOString() }])
        .eq('browser', this.id)
        .then(res => res.error && console.error('Error updating browser tabs:', res.error));

      browsers.delete(this.id);
      this.instance = undefined;
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
      console.error('Error creating tab database entry:', error);
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
        .then(res => res.error && console.error('Error updating tab closed_at:', res.error));

      this.pages = this.pages.filter(id => id !== tabId);
    }
  }

  private async handleUtilizationReport() {
    return await report([{
      type: 'custom.googleapis.com/browser_utilization',
      value: browsers.size / MAX_BROWSER_INSTANCES,
    }]);
  }
}

/**
 * Handle SIGINT, SIGTERM, and SIGQUIT signals
 */
['SIGINT', 'SIGTERM', 'SIGQUIT'].forEach(signal => {
  process.on(signal, () => {
    console.log(`${signal} received`);
    for (const browser of browsers.values()) {
      browser.close();
    }
    browsers.clear();
    process.exit(0);
  });
});
