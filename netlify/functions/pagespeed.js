export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  try {
    const { url, strategy = 'mobile' } = JSON.parse(event.body);
    if (!url) return { statusCode: 400, body: JSON.stringify({ error: 'URL required' }) };

    const apiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&strategy=${strategy}&category=PERFORMANCE&category=ACCESSIBILITY&category=SEO&category=BEST_PRACTICES`;

    const res = await fetch(apiUrl, {
      signal: AbortSignal.timeout(25000), // PageSpeed can be slow
    });

    if (!res.ok) {
      const errBody = await res.text();
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: `PageSpeed API error: ${res.status}`, scores: null, coreWebVitals: null, opportunities: [] }),
      };
    }

    const data = await res.json();
    const lr = data.lighthouseResult || {};
    const categories = lr.categories || {};
    const audits = lr.audits || {};

    // Extract scores
    const scores = {
      performance: Math.round((categories.performance?.score || 0) * 100),
      accessibility: Math.round((categories.accessibility?.score || 0) * 100),
      seo: Math.round((categories.seo?.score || 0) * 100),
      bestPractices: Math.round((categories['best-practices']?.score || 0) * 100),
    };

    // Extract Core Web Vitals from field data or lab data
    const fieldData = data.loadingExperience?.metrics || {};
    const coreWebVitals = {
      lcp: extractCWV(fieldData, 'LARGEST_CONTENTFUL_PAINT_MS', audits, 'largest-contentful-paint'),
      inp: extractCWV(fieldData, 'INTERACTION_TO_NEXT_PAINT', audits, 'interaction-to-next-paint'),
      cls: extractCWV(fieldData, 'CUMULATIVE_LAYOUT_SHIFT_SCORE', audits, 'cumulative-layout-shift'),
    };

    // Extract opportunities
    const opportunities = [];
    const oppAuditIds = [
      'render-blocking-resources',
      'uses-responsive-images',
      'offscreen-images',
      'unminified-css',
      'unminified-javascript',
      'unused-css-rules',
      'unused-javascript',
      'uses-optimized-images',
      'modern-image-formats',
      'uses-text-compression',
      'uses-rel-preconnect',
      'server-response-time',
      'redirects',
      'uses-http2',
      'efficient-animated-content',
      'duplicated-javascript',
      'legacy-javascript',
      'total-byte-weight',
      'dom-size',
      'font-display',
    ];

    for (const id of oppAuditIds) {
      const audit = audits[id];
      if (audit && audit.score !== null && audit.score < 0.9) {
        opportunities.push({
          title: audit.title,
          savings: audit.displayValue || '',
          description: (audit.description || '').replace(/\[.*?\]\(.*?\)/g, '').slice(0, 200),
          score: audit.score,
        });
      }
    }

    opportunities.sort((a, b) => (a.score || 0) - (b.score || 0));

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scores, coreWebVitals, opportunities }),
    };
  } catch (err) {
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: err.message, scores: null, coreWebVitals: null, opportunities: [] }),
    };
  }
}

function extractCWV(fieldData, fieldKey, audits, auditKey) {
  // Try field data first (real user data)
  if (fieldData[fieldKey]) {
    const metric = fieldData[fieldKey];
    return {
      value: metric.percentile,
      category: metric.category?.toLowerCase() || 'unknown',
    };
  }

  // Fallback to lab data
  const audit = audits[auditKey];
  if (audit) {
    return {
      value: audit.numericValue || 0,
      category: audit.score >= 0.9 ? 'good' : audit.score >= 0.5 ? 'needs-improvement' : 'poor',
    };
  }

  return { value: 0, category: 'unknown' };
}
