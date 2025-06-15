export interface BatchProcessorOptions {
  batchSize?: number;
  maxWaitTime?: number;
}

export class BatchProcessor<T, R> {
  private queue: Array<{ item: T; resolve: (value: R) => void; reject: (error: any) => void }> = [];
  private processing = false;
  private batchSize: number;
  private maxWaitTime: number;
  private timer?: NodeJS.Timeout;

  constructor(
    private processBatch: (items: T[]) => Promise<R[]>,
    options: BatchProcessorOptions = {}
  ) {
    this.batchSize = options.batchSize || 10;
    this.maxWaitTime = options.maxWaitTime || 100;
  }

  async add(item: T): Promise<R> {
    return new Promise<R>((resolve, reject) => {
      this.queue.push({ item, resolve, reject });
      
      if (this.queue.length >= this.batchSize) {
        this.processBatchNow();
      } else if (!this.timer) {
        this.timer = setTimeout(() => this.processBatchNow(), this.maxWaitTime);
      }
    });
  }

  private async processBatchNow(): Promise<void> {
    if (this.processing || this.queue.length === 0) return;
    
    this.processing = true;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = undefined;
    }

    const batch = this.queue.splice(0, this.batchSize);
    const items = batch.map(b => b.item);

    try {
      const results = await this.processBatch(items);
      
      batch.forEach((b, index) => {
        if (results[index] !== undefined) {
          b.resolve(results[index]);
        } else {
          b.reject(new Error('No result for batch item'));
        }
      });
    } catch (error) {
      batch.forEach(b => b.reject(error));
    } finally {
      this.processing = false;
      
      // Process next batch if queue is not empty
      if (this.queue.length > 0) {
        setTimeout(() => this.processBatchNow(), 0);
      }
    }
  }

  getQueueSize(): number {
    return this.queue.length;
  }

  isProcessing(): boolean {
    return this.processing;
  }
} 
