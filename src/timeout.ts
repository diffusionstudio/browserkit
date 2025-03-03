export class Timeout {
  private inactivityTimeout?: NodeJS.Timeout;
  private deps: { close(): void }[];
  private timeout: number;

  constructor(timeout: number, deps: { close(): void }[]) {
    this.timeout = timeout;
    this.deps = deps;
    this.reset();
  }

  public reset() {
    this.clear();

    this.inactivityTimeout = setTimeout(
      () => this.deps.forEach(dep => dep.close()),
      this.timeout * 60 * 1000
    );
  }

  public clear() {
    if (this.inactivityTimeout) {
      clearTimeout(this.inactivityTimeout)
    };
  }
}
