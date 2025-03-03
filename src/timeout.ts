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
    
    this.inactivityTimeout = setTimeout(
      this.terminate.bind(this), 
      this.timeout * 60 * 1000
    );
  }

  public terminate() {
    this.deps.forEach(dep => dep.close());

    if (this.inactivityTimeout) {
      clearTimeout(this.inactivityTimeout)
    };
  }
}
