// Severity levels and colors
export const SEVERITY_LEVELS = [
  { key: 'all', label: 'All', color: '#374151' },
  { key: 'critical', label: 'Critical', color: '#dc2626' },
  { key: 'high', label: 'High', color: '#f97316' },
  { key: 'medium', label: 'Medium', color: '#f59e0b' },
  { key: 'low', label: 'Low', color: '#3b82f6' },
  { key: 'info', label: 'Info', color: '#6b7280' },
];

// Issue categories
export const ISSUE_CATEGORIES = {
  meta: { label: 'Meta Tags', icon: 'FileText' },
  headings: { label: 'Headings', icon: 'Type' },
  images: { label: 'Images', icon: 'Image' },
  links: { label: 'Links', icon: 'Link2' },
  performance: { label: 'Performance', icon: 'Zap' },
  accessibility: { label: 'Accessibility', icon: 'Eye' },
  seo: { label: 'SEO', icon: 'Search' },
};

// PageSpeed score thresholds
export const SCORE_THRESHOLDS = {
  good: 90,
  average: 50,
};

// Core Web Vitals thresholds (Google's official)
export const CWV_THRESHOLDS = {
  lcp: { good: 2500, poor: 4000, unit: 'ms', label: 'Largest Contentful Paint', format: (v) => (v / 1000).toFixed(1) + 's' },
  inp: { good: 200, poor: 500, unit: 'ms', label: 'Interaction to Next Paint', format: (v) => v + 'ms' },
  cls: { good: 0.1, poor: 0.25, unit: '', label: 'Cumulative Layout Shift', format: (v) => v.toFixed(2) },
};

// Crawl settings
export const DEFAULT_CRAWL_DEPTH = 10;
export const MAX_CRAWL_DEPTH = 1500;
export const LINKS_PER_BATCH = 50;

// Map audit-page issue types into the 4 PageSpeed categories
// Each check has: type (matches issue.type from audit-page.js), label (display name)
export const CATEGORY_CHECKS = {
  performance: [
    { type: 'render_blocking_css', label: 'Render-blocking stylesheets' },
    { type: 'render_blocking_js', label: 'Render-blocking JavaScript' },
    { type: 'font_display_swap', label: 'Font display: swap missing' },
    { type: 'img_missing_dimensions', label: 'Images missing width/height' },
  ],
  accessibility: [
    { type: 'img_missing_alt', label: 'Images missing alt text' },
    { type: 'img_empty_alt', label: 'Images with empty alt attribute' },
    { type: 'missing_lang', label: 'Missing lang attribute on <html>' },
    { type: 'missing_viewport', label: 'Missing viewport meta tag' },
    { type: 'heading_skip', label: 'Heading hierarchy skipped levels' },
  ],
  bestPractices: [
    // Best Practices score comes from PageSpeed API — no custom checks yet
  ],
  seo: [
    { type: 'title_missing', label: 'Missing page title' },
    { type: 'title_empty', label: 'Empty page title' },
    { type: 'title_too_short', label: 'Page title too short' },
    { type: 'title_too_long', label: 'Page title too long' },
    { type: 'meta_desc_missing', label: 'Missing meta description' },
    { type: 'meta_desc_empty', label: 'Empty meta description' },
    { type: 'meta_desc_too_short', label: 'Meta description too short' },
    { type: 'meta_desc_too_long', label: 'Meta description too long' },
    { type: 'h1_missing', label: 'Missing H1 heading' },
    { type: 'h1_empty', label: 'Empty H1 heading' },
    { type: 'h1_multiple', label: 'Multiple H1 headings' },
    { type: 'missing_canonical', label: 'Missing canonical tag' },
    { type: 'missing_og_title', label: 'Missing Open Graph title' },
    { type: 'missing_og_description', label: 'Missing Open Graph description' },
    { type: 'missing_og_image', label: 'Missing Open Graph image' },
  ],
};

// Map issue categories from audit-page.js to our 4 PageSpeed categories
export const ISSUE_TO_CATEGORY = {
  // Performance
  render_blocking_css: 'performance',
  render_blocking_js: 'performance',
  font_display_swap: 'performance',
  img_missing_dimensions: 'performance',
  // Accessibility
  img_missing_alt: 'accessibility',
  img_empty_alt: 'accessibility',
  missing_lang: 'accessibility',
  missing_viewport: 'accessibility',
  heading_skip: 'accessibility',
  // SEO (everything else)
  title_missing: 'seo',
  title_empty: 'seo',
  title_too_short: 'seo',
  title_too_long: 'seo',
  meta_desc_missing: 'seo',
  meta_desc_empty: 'seo',
  meta_desc_too_short: 'seo',
  meta_desc_too_long: 'seo',
  h1_missing: 'seo',
  h1_empty: 'seo',
  h1_multiple: 'seo',
  missing_canonical: 'seo',
  missing_og_title: 'seo',
  missing_og_description: 'seo',
  missing_og_image: 'seo',
};
