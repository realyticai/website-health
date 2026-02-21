import { parse } from 'node-html-parser';

export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  try {
    const { url, followUrls } = JSON.parse(event.body);
    if (!url) return { statusCode: 400, body: JSON.stringify({ error: 'URL required' }) };

    const baseUrl = new URL(url);
    const origin = baseUrl.origin;

    // If followUrls is provided, this is a recursive discovery call —
    // crawl those pages for more internal links
    if (followUrls && Array.isArray(followUrls)) {
      const found = new Set();
      const fetches = followUrls.slice(0, 10).map(async (pageUrl) => {
        try {
          const res = await fetch(pageUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0 (compatible; VisibilityEngine/1.0; +https://rcdigitalconsultancy.com)' },
            signal: AbortSignal.timeout(5000),
          });
          if (!res.ok) return;
          const html = await res.text();
          const root = parse(html);
          extractInternalLinks(root, origin, found);
        } catch {
          // Skip failed pages
        }
      });
      await Promise.all(fetches);

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pages: [...found].sort() }),
      };
    }

    // Standard discovery: crawl the target page + sitemaps
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; VisibilityEngine/1.0; +https://rcdigitalconsultancy.com)' },
      signal: AbortSignal.timeout(7000),
    });

    if (!res.ok) {
      return { statusCode: 200, body: JSON.stringify({ error: `HTTP ${res.status}`, pages: [], siteName: '', baseUrl: origin }) };
    }

    const html = await res.text();
    const root = parse(html);

    const titleEl = root.querySelector('title');
    const siteName = titleEl ? titleEl.text.trim() : baseUrl.hostname;

    // Extract all internal links from the page
    const links = new Set();
    links.add(url); // always include the target URL
    extractInternalLinks(root, origin, links);

    // Check multiple sitemap paths
    const sitemapLinks = await discoverFromSitemaps(origin);
    for (const link of sitemapLinks) {
      links.add(link);
    }

    const pages = [...links].sort();

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        siteName,
        baseUrl: origin,
        pages,
        totalFound: pages.length,
      }),
    };
  } catch (err) {
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: err.message, pages: [], siteName: '', baseUrl: '' }),
    };
  }
}

function extractInternalLinks(root, origin, linkSet) {
  const anchors = root.querySelectorAll('a[href]');
  for (const a of anchors) {
    let href = a.getAttribute('href');
    if (!href) continue;

    // Skip non-page links
    if (href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('javascript:')) continue;

    try {
      const resolved = new URL(href, origin);
      // Only internal links
      if (resolved.origin !== origin) continue;

      // Skip common non-page extensions
      const path = resolved.pathname.toLowerCase();
      if (/\.(jpg|jpeg|png|gif|svg|webp|pdf|zip|mp4|mp3|css|js|woff|woff2|ttf|eot)$/i.test(path)) continue;

      // Normalize: strip hash, keep path
      resolved.hash = '';
      const normalized = resolved.origin + resolved.pathname + resolved.search;
      linkSet.add(normalized);
    } catch {
      // Invalid URL, skip
    }
  }
}

async function discoverFromSitemaps(origin) {
  const allLinks = new Set();

  // Try multiple common sitemap paths
  const sitemapPaths = [
    '/sitemap.xml',
    '/wp-sitemap.xml',
    '/sitemap_index.xml',
    '/sitemap1.xml',
    '/post-sitemap.xml',
    '/page-sitemap.xml',
  ];

  for (const path of sitemapPaths) {
    try {
      const res = await fetch(`${origin}${path}`, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; VisibilityEngine/1.0)' },
        signal: AbortSignal.timeout(3000),
      });
      if (!res.ok) continue;
      const xml = await res.text();

      // Check if this is a sitemap index (contains sub-sitemaps)
      if (xml.includes('<sitemapindex') || xml.includes('<sitemap>')) {
        const sitemapMatches = xml.matchAll(/<loc>\s*(.*?)\s*<\/loc>/gi);
        const subSitemapUrls = [];
        for (const match of sitemapMatches) {
          const loc = match[1].trim();
          if (loc.endsWith('.xml')) {
            subSitemapUrls.push(loc);
          } else if (loc.startsWith(origin)) {
            allLinks.add(loc);
          }
        }

        // Fetch sub-sitemaps in parallel (up to 10)
        const subFetches = subSitemapUrls.slice(0, 10).map(async (subUrl) => {
          try {
            const subRes = await fetch(subUrl, {
              headers: { 'User-Agent': 'Mozilla/5.0 (compatible; VisibilityEngine/1.0)' },
              signal: AbortSignal.timeout(3000),
            });
            if (!subRes.ok) return;
            const subXml = await subRes.text();
            const locMatches = subXml.matchAll(/<loc>\s*(.*?)\s*<\/loc>/gi);
            for (const m of locMatches) {
              const url = m[1].trim();
              if (url.startsWith(origin) && !url.endsWith('.xml')) {
                allLinks.add(url);
              }
            }
          } catch {
            // Sub-sitemap failed
          }
        });
        await Promise.all(subFetches);
      } else {
        // Regular sitemap — extract <loc> entries
        const locMatches = xml.matchAll(/<loc>\s*(.*?)\s*<\/loc>/gi);
        for (const match of locMatches) {
          const url = match[1].trim();
          if (url.startsWith(origin) && !url.endsWith('.xml')) {
            allLinks.add(url);
          }
        }
      }

      // If we found pages, no need to try more sitemap paths
      if (allLinks.size > 0) break;
    } catch {
      // Sitemap not available at this path
    }
  }

  // Cap at 1500
  return [...allLinks].slice(0, 1500);
}
