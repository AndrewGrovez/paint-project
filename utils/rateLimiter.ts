// utils/rateLimiter.ts
class RequestQueue {
    private queue: Array<{
      resolve: (value: any) => void;
      reject: (reason?: any) => void;
      request: () => Promise<any>;
    }> = [];
    private processing = false;
    private lastRequestTime = 0;
    private readonly minInterval = 1100; // slightly more than 1 second to be safe
  
    async add<T>(request: () => Promise<T>): Promise<T> {
      return new Promise((resolve, reject) => {
        this.queue.push({ resolve, reject, request });
        this.processQueue();
      });
    }
  
    private async processQueue() {
      if (this.processing || this.queue.length === 0) return;
      this.processing = true;
  
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
          reject(error);
        }
      }
  
      this.processing = false;
    }
  }
  
  export const requestQueue = new RequestQueue();