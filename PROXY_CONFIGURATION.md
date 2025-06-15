# Proxy Configuration Guide

## Setting Up Proxies
1. Add proxies to your `.env` file:
```env
PROXY_LIST=http://user:pass@proxy1.example.com:8080,http://user:pass@proxy2.example.com:8080
```

2. Supported proxy formats:
   - HTTP: `http://user:pass@host:port`
   - HTTPS: `https://user:pass@host:port`
   - SOCKS5: `socks5://user:pass@host:port`

## Best Practices
1. **Residential Proxies**: Use residential proxies for high-risk sites
2. **Proxy Rotation**: Maintain at least 5 proxies in rotation
3. **Health Monitoring**: The system automatically removes failing proxies
4. **Geolocation**: Use country-specific proxies for localized content

## Troubleshooting
```bash
# Test proxy connectivity
curl -x http://user:pass@proxy:port https://api.ipify.org
```

## Proxy Services
1. [Bright Data](https://brightdata.com/) - Recommended for residential proxies
2. [Oxylabs](https://oxylabs.io/) - Good for high-volume scraping
3. [Smartproxy](https://smartproxy.com/) - Budget-friendly option 

### Final System Architecture
```mermaid
graph TD
    A[run-crawler.ts] -->|Parses ENV| B[PROXY_LIST]
    B --> C[BaseCrawler]
    C --> D[HeaderRotator]
    C --> E[AdvancedProxyManager]
    C --> F[HumanLikeDelays]
    D --> G[Random User-Agents]
    E --> H[Proxy Rotation]
    F --> I[Behavior Simulation]
    C --> J[MagyarKozlonyCrawler]
    C --> K[BHTCrawler]
    C --> L[CURIACrawler]
    C --> M[JogtarCrawler]
```

### Next Steps
1. **Testing Framework**:
```python
# Proxy rotation test
def test_proxy_rotation():
    proxies = ["proxy1", "proxy2", "proxy3"]
    manager = AdvancedProxyManager(proxies)
    used_proxies = set()
    for _ in range(10):
        used_proxies.add(manager.get_next_proxy()['server'])
    assert len(used_proxies) > 1  # Ensure rotation occurs
```

2. **Performance Monitoring**:
```python
# In BaseCrawler
self.metrics = {
    "requests": 0,
    "success_rate": 0.0,
    "proxy_failures": 0,
    "captchas_encountered": 0
}
```

3. **Auto-Scaling Proxy Pool**:
```python
# In AdvancedProxyManager
def auto_scale_proxies(self, min_pool_size=5):
    if len(self.proxies) < min_pool_size:
        new_proxies = fetch_proxies_from_api()
        self.proxies.extend(new_proxies)
```

### Final Checklist
- [x] Header rotation implemented
- [x] Proxy management integrated
- [x] All crawlers updated
- [x] Documentation created
- [ ] Performance testing
- [ ] Long-term reliability monitoring

The system now has a robust anti-detection foundation. Would you like me to:
1. Help design test cases for the new system?
2. Implement performance monitoring?
3. Enhance the documentation further?
4. Proceed to the next phase of anti-detection measures? 