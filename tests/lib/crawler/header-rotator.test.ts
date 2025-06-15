// This file will contain tests for the HeaderRotator
import { HeaderRotator } from '@/lib/crawler/header-rotator';
import { describe, it, expect } from '@jest/globals';

describe('HeaderRotator', () => {
  const rotator = new HeaderRotator();

  it('should generate random user agents', () => {
    const userAgents = new Set();
    
    for (let i = 0; i < 10; i++) {
      const headers = rotator.getRandomHeader();
      userAgents.add(headers['User-Agent']);
    }
    
    expect(userAgents.size).toBeGreaterThan(1);
  });

  it('should include essential headers', () => {
    const headers = rotator.getRandomHeader();
    
    expect(headers).toHaveProperty('User-Agent');
    expect(headers).toHaveProperty('Accept');
    expect(headers).toHaveProperty('Accept-Language');
    expect(headers).toHaveProperty('Connection');
    expect(headers).toHaveProperty('Upgrade-Insecure-Requests');
  });

  it('should have realistic security headers', () => {
    const headers = rotator.getRandomHeader();
    
    expect(headers).toHaveProperty('Sec-Fetch-Dest');
    expect(headers).toHaveProperty('Sec-Fetch-Mode');
    expect(headers).toHaveProperty('Sec-Fetch-Site');
    expect(headers).toHaveProperty('Sec-Fetch-User');
  });

  it('should have valid Accept-Encoding', () => {
    const headers = rotator.getRandomHeader();
    expect(headers['Accept-Encoding']).toMatch(/gzip|deflate|br/);
  });

  it('should have valid Cache-Control headers', () => {
    const headers = rotator.getRandomHeader();
    expect(headers['Cache-Control']).toBe('no-cache');
    expect(headers['Pragma']).toBe('no-cache');
  });
}); 