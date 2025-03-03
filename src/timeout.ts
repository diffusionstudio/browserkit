export class Timeout {
  private inactivityTimeout?: NodeJS.Timeout;
  private deps: { close(): Promise<void> | void }[];
  private timeout: number;

  constructor(timeout: number, deps: { close(): Promise<void> | void }[]) {
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

  public async terminate() {
    for (const dep of this.deps) {
      await dep.close();
    }

    if (this.inactivityTimeout) {
      clearTimeout(this.inactivityTimeout)
    };
  }
}
