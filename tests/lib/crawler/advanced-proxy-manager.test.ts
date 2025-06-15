import { AdvancedProxyManager } from '../../../src/lib/crawler/advanced-proxy-manager';
import { describe, it, expect, beforeEach } from '@jest/globals';
import type { CrawlerProxy } from '../../../src/lib/crawler/types';

describe('AdvancedProxyManager', () => {
  let proxies: CrawlerProxy[];

  beforeEach(() => {
    proxies = [
      { server: 'http://proxy1.example.com:8080' },
      { server: 'http://proxy2.example.com:8080', username: 'user', password: 'password' },
      { server: 'http://proxy3.example.com:8080' },
    ];
  });

  it('should initialize with a list of proxies', () => {
    const manager = new AdvancedProxyManager(proxies);
    // The shuffle makes direct comparison difficult, so we check the length
    expect(manager['proxies'].length).toBe(proxies.length);
  });

  it('should return a healthy proxy', () => {
    const manager = new AdvancedProxyManager(proxies);
    const proxy = manager.getNextProxy();
    expect(proxy).not.toBeNull();
    expect(proxies).toContainEqual(proxy!);
  });

  it('should rotate proxies', () => {
    const manager = new AdvancedProxyManager(proxies);
    const firstProxy = manager.getNextProxy()?.server;
    const secondProxy = manager.getNextProxy()?.server;
    const thirdProxy = manager.getNextProxy()?.server;
    const fourthProxy = manager.getNextProxy()?.server; // Should be the same as the first in a circular fashion

    expect(firstProxy).not.toBe(secondProxy);
    expect(secondProxy).not.toBe(thirdProxy);
    expect(fourthProxy).toBe(firstProxy);
  });

  it('should report a proxy failure and deactivate it after max retries', () => {
    const manager = new AdvancedProxyManager(proxies, 2); // 2 max fails
    const proxyToFail = proxies[0].server;

    manager.reportFailure(proxyToFail);
    expect(manager['proxyHealth'].get(proxyToFail)?.consecutiveFails).toBe(1);
    expect(manager['proxyHealth'].get(proxyToFail)?.isHealthy).toBe(true);

    manager.reportFailure(proxyToFail);
    expect(manager['proxyHealth'].get(proxyToFail)?.consecutiveFails).toBe(2);
    expect(manager['proxyHealth'].get(proxyToFail)?.isHealthy).toBe(false);
  });

  it('should not return a deactivated proxy', () => {
    const manager = new AdvancedProxyManager(proxies, 1);
    const proxyToFail = manager['proxies'][0]; // Get a predictable proxy

    manager.reportFailure(proxyToFail.server);

    for (let i = 0; i < proxies.length; i++) {
      const p = manager.getNextProxy();
      expect(p?.server).not.toBe(proxyToFail.server);
    }
  });

  it('should reset the failure count on success', () => {
    const manager = new AdvancedProxyManager(proxies, 3);
    const proxyServer = proxies[0].server;

    manager.reportFailure(proxyServer);
    manager.reportFailure(proxyServer);
    expect(manager['proxyHealth'].get(proxyServer)?.consecutiveFails).toBe(2);

    manager.reportSuccess(proxyServer);
    expect(manager['proxyHealth'].get(proxyServer)?.consecutiveFails).toBe(0);
  });

  it('should return null if all proxies are unhealthy', () => {
    const manager = new AdvancedProxyManager(proxies, 1);
    for (const proxy of proxies) {
      manager.reportFailure(proxy.server);
    }
    expect(manager.getNextProxy()).toBeNull();
  });

  it('should revive a proxy after the cooldown period', async () => {
    const cooldown = 100; // 100 ms
    const manager = new AdvancedProxyManager(proxies, 1, cooldown);
    const proxyToFail = manager['proxies'][0];

    manager.reportFailure(proxyToFail.server);
    expect(manager['proxyHealth'].get(proxyToFail.server)?.isHealthy).toBe(false);

    // Wait for cooldown to pass
    await new Promise(resolve => setTimeout(resolve, cooldown + 50));
    
    // Attempt to get a proxy, which should trigger the revival check
    manager.getNextProxy(); 
    
    expect(manager['proxyHealth'].get(proxyToFail.server)?.isHealthy).toBe(true);
    expect(manager['proxyHealth'].get(proxyToFail.server)?.consecutiveFails).toBe(0);
  });
}); 