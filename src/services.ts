export class Timeout {
  private inactivityTimeout?: NodeJS.Timeout;
  private deps: { close: () => void }[];
  private timeout: number;

  constructor(timeout: number, deps: { close: () => void }[]) {
    this.timeout = timeout;
    this.deps = deps;
    this.reset();
  }

  public reset() {
    if (this.inactivityTimeout) {
      clearTimeout(this.inactivityTimeout)
    };
    
    this.inactivityTimeout = setTimeout(async () => {
      console.log(`Browser closed due to inactivity after ${this.timeout} minutes`);
      this.deps.forEach(dep => dep.close());
    }, this.timeout * 60 * 1000); // Convert minutes to milliseconds
  }

  public clear() {
    if (this.inactivityTimeout) {
      clearTimeout(this.inactivityTimeout)
    };
  }
}
