import { parse } from 'node-html-parser';

export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  try {
    const { url } = JSON.parse(event.body);
    if (!url) return { statusCode: 400, body: JSON.stringify({ error: 'URL required' }) };

    const baseUrl = new URL(url);
    const origin = baseUrl.origin;

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

    // Extract all internal links
    const links = new Set();
    links.add(url); // always include the target URL

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
        links.add(normalized);
      } catch {
        // Invalid URL, skip
      }
    }

    // Also check sitemap
    const sitemapLinks = await discoverFromSitemap(origin);
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

async function discoverFromSitemap(origin) {
  const links = [];
  try {
    const res = await fetch(`${origin}/sitemap.xml`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; VisibilityEngine/1.0)' },
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return links;
    const xml = await res.text();
    const locMatches = xml.matchAll(/<loc>\s*(.*?)\s*<\/loc>/gi);
    for (const match of locMatches) {
      const url = match[1].trim();
      if (url.startsWith(origin) && !url.endsWith('.xml')) {
        links.push(url);
      }
    }
  } catch {
    // Sitemap not available
  }
  return links.slice(0, 1500); // Cap at 1500
}
