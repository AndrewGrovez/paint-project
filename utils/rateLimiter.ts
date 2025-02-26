// utils/rateLimiter.ts
class RequestQueue {
  private queue: Array<{
      resolve: (value: unknown) => void; // Use unknown instead of any for safety
      reject: (reason?: unknown) => void; // Consistent with Promise rejection
      request: () => Promise<unknown>; // Generalize the request return type
  }> = [];
  private processing = false;
  private lastRequestTime = 0;
  private readonly minInterval = 1100;

  async add<T>(request: () => Promise<T>): Promise<T> {
      return new Promise((resolve, reject) => {
          // Type the resolve and reject to match T
          this.queue.push({
              resolve: (value: unknown) => resolve(value as T), // Cast to T since we know it matches
              reject,
              request: request as () => Promise<unknown>, // Upcast to unknown
          });
          if (!this.processing) {
              this.processQueue();
          }
      });
  }

  private async processQueue() {
      if (this.processing || this.queue.length === 0) return;
      this.processing = true;

      try {
          while (this.queue.length > 0) {
              const now = Date.now();
              const timeToWait = Math.max(0, this.lastRequestTime + this.minInterval - now);

              if (timeToWait > 0) {
                  await new Promise(resolve => setTimeout(resolve, timeToWait));
              }

              const { resolve, reject, request } = this.queue.shift()!;
              try {
                  this.lastRequestTime = Date.now();
                  const result = await request();
                  resolve(result);
              } catch (error) {
                  reject(error instanceof Error ? error : new Error(`Request failed: ${String(error)}`));
              }
          }
      } finally {
          this.processing = false;
      }
  }
}

export const requestQueue = new RequestQueue();