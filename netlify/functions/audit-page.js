import { parse } from 'node-html-parser';

export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  try {
    const { url } = JSON.parse(event.body);
    if (!url) return { statusCode: 400, body: JSON.stringify({ error: 'URL required' }) };

    const start = Date.now();
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; VisibilityEngine/1.0; +https://rcdigitalconsultancy.com)' },
      signal: AbortSignal.timeout(7000),
      redirect: 'follow',
    });

    const statusCode = res.status;
    const html = await res.text();
    const root = parse(html);
    const issues = [];

    // --- H1 Checks ---
    const h1s = root.querySelectorAll('h1');
    if (h1s.length === 0) {
      issues.push({ type: 'h1_missing', severity: 'critical', category: 'headings', message: 'Missing H1 tag', element: null });
    } else if (h1s.length > 1) {
      issues.push({ type: 'h1_multiple', severity: 'high', category: 'headings', message: `Multiple H1 tags (${h1s.length} found)`, element: h1s.map(h => h.text.trim().slice(0, 60)).join(' | ') });
    }
    for (const h1 of h1s) {
      if (!h1.text.trim()) {
        issues.push({ type: 'h1_empty', severity: 'high', category: 'headings', message: 'Empty H1 tag', element: h1.toString().slice(0, 100) });
      }
    }

    // --- Title Checks ---
    const titleEl = root.querySelector('title');
    if (!titleEl) {
      issues.push({ type: 'title_missing', severity: 'critical', category: 'meta', message: 'Missing title tag', element: null });
    } else {
      const titleText = titleEl.text.trim();
      if (!titleText) {
        issues.push({ type: 'title_empty', severity: 'critical', category: 'meta', message: 'Empty title tag', element: null });
      } else if (titleText.length < 30) {
        issues.push({ type: 'title_too_short', severity: 'medium', category: 'meta', message: `Title too short (${titleText.length} chars, recommended 30-60)`, element: titleText });
      } else if (titleText.length > 60) {
        issues.push({ type: 'title_too_long', severity: 'medium', category: 'meta', message: `Title too long (${titleText.length} chars, recommended 30-60)`, element: titleText.slice(0, 80) + '...' });
      }
    }

    // --- Meta Description ---
    const metaDesc = root.querySelector('meta[name="description"]');
    if (!metaDesc) {
      issues.push({ type: 'meta_desc_missing', severity: 'high', category: 'meta', message: 'Missing meta description', element: null });
    } else {
      const desc = metaDesc.getAttribute('content') || '';
      if (!desc.trim()) {
        issues.push({ type: 'meta_desc_empty', severity: 'high', category: 'meta', message: 'Empty meta description', element: null });
      } else if (desc.length < 70) {
        issues.push({ type: 'meta_desc_too_short', severity: 'medium', category: 'meta', message: `Meta description too short (${desc.length} chars, recommended 70-160)`, element: desc });
      } else if (desc.length > 160) {
        issues.push({ type: 'meta_desc_too_long', severity: 'medium', category: 'meta', message: `Meta description too long (${desc.length} chars, recommended 70-160)`, element: desc.slice(0, 100) + '...' });
      }
    }

    // --- Image Checks ---
    const images = root.querySelectorAll('img');
    let imgMissingAlt = 0;
    let imgEmptyAlt = 0;
    let imgMissingDimensions = 0;
    for (const img of images) {
      const alt = img.getAttribute('alt');
      const src = img.getAttribute('src') || img.getAttribute('data-src') || '';
      const srcShort = src.slice(0, 100);

      if (alt === null || alt === undefined) {
        imgMissingAlt++;
        if (imgMissingAlt <= 5) {
          issues.push({ type: 'img_missing_alt', severity: 'high', category: 'images', message: 'Image missing alt attribute', element: srcShort });
        }
      } else if (alt.trim() === '') {
        imgEmptyAlt++;
      }

      if (!img.getAttribute('width') && !img.getAttribute('height')) {
        imgMissingDimensions++;
      }
    }
    if (imgMissingAlt > 5) {
      issues.push({ type: 'img_missing_alt_summary', severity: 'high', category: 'images', message: `${imgMissingAlt} images missing alt text (showing first 5)`, element: null });
    }
    if (imgMissingDimensions > 0) {
      issues.push({ type: 'img_missing_dimensions', severity: 'medium', category: 'images', message: `${imgMissingDimensions} images missing width/height attributes (CLS risk)`, element: null });
    }

    // --- Heading Hierarchy ---
    const headings = root.querySelectorAll('h1, h2, h3, h4, h5, h6');
    let prevLevel = 0;
    for (const h of headings) {
      const level = parseInt(h.tagName.replace('H', ''));
      if (prevLevel > 0 && level > prevLevel + 1) {
        issues.push({ type: 'heading_skip', severity: 'medium', category: 'headings', message: `Heading hierarchy skips from H${prevLevel} to H${level}`, element: h.text.trim().slice(0, 60) });
        break; // Only report first skip
      }
      prevLevel = level;
    }

    // --- Canonical ---
    const canonical = root.querySelector('link[rel="canonical"]');
    if (!canonical) {
      issues.push({ type: 'canonical_missing', severity: 'medium', category: 'seo', message: 'Missing canonical tag', element: null });
    }

    // --- Open Graph ---
    const ogTitle = root.querySelector('meta[property="og:title"]');
    const ogDesc = root.querySelector('meta[property="og:description"]');
    const ogImage = root.querySelector('meta[property="og:image"]');
    const ogMissing = [];
    if (!ogTitle) ogMissing.push('og:title');
    if (!ogDesc) ogMissing.push('og:description');
    if (!ogImage) ogMissing.push('og:image');
    if (ogMissing.length > 0) {
      issues.push({ type: 'og_missing', severity: 'low', category: 'seo', message: `Missing Open Graph tags: ${ogMissing.join(', ')}`, element: null });
    }

    // --- Language Attribute ---
    const htmlTag = root.querySelector('html');
    if (htmlTag && !htmlTag.getAttribute('lang')) {
      issues.push({ type: 'lang_missing', severity: 'medium', category: 'accessibility', message: 'Missing lang attribute on <html>', element: null });
    }

    // --- Viewport ---
    const viewport = root.querySelector('meta[name="viewport"]');
    if (!viewport) {
      issues.push({ type: 'viewport_missing', severity: 'high', category: 'accessibility', message: 'Missing viewport meta tag', element: null });
    }

    // --- Font Display ---
    const fontLinks = root.querySelectorAll('link[href*="fonts.googleapis.com"]');
    for (const link of fontLinks) {
      const href = link.getAttribute('href') || '';
      if (!href.includes('display=swap') && !href.includes('display=optional')) {
        issues.push({ type: 'font_no_swap', severity: 'medium', category: 'performance', message: 'Google Font loaded without display=swap', element: href.slice(0, 100) });
        break;
      }
    }

    // --- Render Blocking ---
    const head = root.querySelector('head');
    if (head) {
      const headScripts = head.querySelectorAll('script[src]');
      let blockingJs = 0;
      for (const s of headScripts) {
        if (!s.getAttribute('async') && !s.getAttribute('defer') && !s.getAttribute('type')?.includes('module')) {
          blockingJs++;
        }
      }
      if (blockingJs > 0) {
        issues.push({ type: 'render_blocking_js', severity: 'medium', category: 'performance', message: `${blockingJs} render-blocking JavaScript file${blockingJs > 1 ? 's' : ''} in <head>`, element: null });
      }

      const headStyles = head.querySelectorAll('link[rel="stylesheet"]');
      let blockingCss = 0;
      for (const s of headStyles) {
        if (!s.getAttribute('media') || s.getAttribute('media') === 'all') {
          blockingCss++;
        }
      }
      if (blockingCss > 2) {
        issues.push({ type: 'render_blocking_css', severity: 'medium', category: 'performance', message: `${blockingCss} render-blocking CSS files in <head>`, element: null });
      }
    }

    // --- Extract Links ---
    const baseOrigin = new URL(url).origin;
    const links = [];
    const anchors = root.querySelectorAll('a[href]');
    for (const a of anchors) {
      let href = a.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('javascript:')) continue;
      try {
        const resolved = new URL(href, url).href;
        links.push(resolved);
      } catch {
        // skip invalid
      }
    }

    const uniqueLinks = [...new Set(links)];
    const internalLinks = uniqueLinks.filter(l => l.startsWith(baseOrigin));
    const externalLinks = uniqueLinks.filter(l => !l.startsWith(baseOrigin));

    // Word count (approximate)
    const body = root.querySelector('body');
    const textContent = body ? body.text.replace(/\s+/g, ' ').trim() : '';
    const wordCount = textContent.split(/\s+/).filter(Boolean).length;

    const timing = Date.now() - start;

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url,
        title: titleEl ? titleEl.text.trim() : '',
        statusCode,
        issues,
        links: uniqueLinks,
        stats: {
          h1Count: h1s.length,
          imgCount: images.length,
          imgMissingAlt,
          imgEmptyAlt,
          imgMissingDimensions,
          linkCount: uniqueLinks.length,
          internalLinks: internalLinks.length,
          externalLinks: externalLinks.length,
          wordCount,
          headingCount: headings.length,
        },
        timing,
      }),
    };
  } catch (err) {
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: '', error: err.message, issues: [], links: [], stats: {} }),
    };
  }
}
