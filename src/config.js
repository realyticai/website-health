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
export const MAX_CRAWL_DEPTH = 100;
export const LINKS_PER_BATCH = 50;
