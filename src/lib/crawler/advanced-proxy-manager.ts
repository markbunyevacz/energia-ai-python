// This file will contain the AdvancedProxyManager class
import type { CrawlerProxy } from './types';
import { Logger } from '../logging/logger';

interface ProxyHealth {
  consecutiveFails: number;
  lastUsed: number;
  isHealthy: boolean;
}

export class AdvancedProxyManager {
  private proxies: CrawlerProxy[];
  private proxyHealth: Map<string, ProxyHealth>;
  private currentIndex: number;
  private readonly logger: Logger;
  private readonly maxFails: number;
  private readonly cooldownPeriod: number; // in milliseconds

  constructor(proxies: CrawlerProxy[], maxFails = 3, cooldownPeriod = 5 * 60 * 1000) {
    this.proxies = this.shuffle(proxies);
    this.proxyHealth = new Map();
    this.currentIndex = 0;
    this.logger = new Logger('AdvancedProxyManager');
    this.maxFails = maxFails;
    this.cooldownPeriod = cooldownPeriod;

    this.proxies.forEach(proxy => {
      this.proxyHealth.set(proxy.server, {
        consecutiveFails: 0,
        lastUsed: 0,
        isHealthy: true,
      });
    });
  }

  private shuffle<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  public getNextProxy(): CrawlerProxy | null {
    if (this.proxies.length === 0) {
      this.logger.warn('No proxies available.');
      return null;
    }

    const initialIndex = this.currentIndex;
    let attempts = 0;
    while (attempts < this.proxies.length) {
      const proxy = this.proxies[this.currentIndex];
      const health = this.proxyHealth.get(proxy.server);

      if (health?.isHealthy) {
        this.logger.info(`Using proxy: ${proxy.server}`);
        health.lastUsed = Date.now();
        this.currentIndex = (this.currentIndex + 1) % this.proxies.length;
        return proxy;
      }

      // Check if the proxy can be revived from cooldown
      if (health && !health.isHealthy && (Date.now() - health.lastUsed > this.cooldownPeriod)) {
        this.logger.info(`Proxy ${proxy.server} is out of cooldown. Reviving.`);
        health.isHealthy = true;
        health.consecutiveFails = 0;
        // Continue to the check above
      } else {
        this.currentIndex = (this.currentIndex + 1) % this.proxies.length;
      }
      
      attempts++;
      if (this.currentIndex === initialIndex && attempts > this.proxies.length) {
          // Full circle, no healthy proxy found
          break;
      }
    }

    this.logger.error('No healthy proxies available. Waiting before trying again.');
    // Optional: could throw an error or wait
    return null;
  }

  public reportFailure(proxyServer: string): void {
    const health = this.proxyHealth.get(proxyServer);
    if (health) {
      health.consecutiveFails++;
      health.lastUsed = Date.now();
      this.logger.warn(`Failure reported for proxy: ${proxyServer}. Fails: ${health.consecutiveFails}`);
      if (health.consecutiveFails >= this.maxFails) {
        health.isHealthy = false;
        this.logger.error(`Proxy ${proxyServer} has been deactivated due to excessive failures.`);
      }
    }
  }

  public reportSuccess(proxyServer: string): void {
    const health = this.proxyHealth.get(proxyServer);
    if (health) {
      if (health.consecutiveFails > 0) {
          this.logger.info(`Proxy ${proxyServer} is working again. Resetting failure count.`);
      }
      health.consecutiveFails = 0;
    }
  }
} 
