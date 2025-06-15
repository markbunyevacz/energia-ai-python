# Proxy Configuration Guide

This guide explains how to configure and use proxies with the crawler system to enhance anonymity and reduce the risk of being blocked.

## 1. Setting Up Proxies

To use proxies, you need to add them to your `.env` file. The crawler system expects a comma-separated list of proxy URLs.

**Example `.env` configuration:**
```env
PROXY_LIST=http://user:pass@proxy1.example.com:8080,http://user:pass@proxy2.example.com:8080
```

### Supported Proxy Formats
The system supports the following proxy formats:
-   **HTTP**: `http://user:pass@host:port`
-   **HTTPS**: `https://user:pass@host:port`
-   **SOCKS5**: `socks5://user:pass@host:port` (Note: SOCKS5 support depends on the underlying Playwright capabilities)

If your proxies do not require authentication, you can omit the `user:pass@` part.

## 2. Best Practices

-   **Use Residential Proxies**: For high-risk or well-protected websites like `Jogtar`, residential proxies are strongly recommended as they are less likely to be detected and blocked.
-   **Maintain a Healthy Rotation**: It's best to use a pool of at least 5-10 proxies to ensure a good rotation and minimize the impact of any single proxy failing.
-   **Geolocation**: If you are targeting content specific to a certain country, use proxies from that region to ensure you get the correct localized content.

## 3. How It Works

-   **Automatic Rotation**: The `AdvancedProxyManager` automatically rotates through the proxy list for each new browser session.
-   **Health Monitoring**: The system tracks the health of each proxy. If a proxy fails more than 3 consecutive times, it is temporarily deactivated for 5 minutes.
-   **Failure Recovery**: If a browser fails to launch due to a bad proxy, the failure is logged, and the crawler will attempt to use a different proxy on the next run.

## 4. Recommended Proxy Services

Here are a few well-known proxy providers that are compatible with this system:

1.  [Bright Data](https://brightdata.com/) - Industry leader, great for high-quality residential proxies.
2.  [Oxylabs](https://oxylabs.io/) - Another excellent option for large-scale and reliable scraping.
3.  [Smartproxy](https://smartproxy.com/) - A more budget-friendly choice that still offers good performance.

## 5. Troubleshooting

If you suspect issues with your proxy configuration, you can test the connectivity of a single proxy from your terminal using a tool like `curl`:

```bash
# Replace with your actual proxy details
curl -x "http://user:pass@your_proxy_host:port" https://api.ipify.org
```
If the command returns your proxy's IP address, the connection is working. If it times out or returns an error, there may be an issue with the proxy credentials or network access. 