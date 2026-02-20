export function computeHealthScore(auditResults, linkResults, pagespeedScores) {
  // PageSpeed component (30% weight)
  const psAvg = pagespeedScores
    ? (pagespeedScores.performance + pagespeedScores.accessibility + pagespeedScores.seo + pagespeedScores.bestPractices) / 4
    : 50;

  // Issues component (50% weight) — penalty-based
  const totalPages = auditResults.length || 1;
  const allIssues = auditResults.flatMap((r) => r.issues || []);
  const criticalCount = allIssues.filter((i) => i.severity === 'critical').length;
  const highCount = allIssues.filter((i) => i.severity === 'high').length;
  const mediumCount = allIssues.filter((i) => i.severity === 'medium').length;
  const lowCount = allIssues.filter((i) => i.severity === 'low').length;

  const penalty = ((criticalCount * 10) + (highCount * 5) + (mediumCount * 2) + (lowCount * 0.5)) / totalPages;
  const issueScore = Math.max(0, 100 - penalty);

  // Links component (20% weight)
  const totalLinks = linkResults.length || 1;
  const brokenCount = linkResults.filter((l) => !l.ok && !l.redirect).length;
  const linkScore = Math.max(0, 100 - (brokenCount / totalLinks) * 500);

  return Math.round(psAvg * 0.3 + issueScore * 0.5 + linkScore * 0.2);
}

export function getScoreGrade(score) {
  if (score >= 90) return { label: 'Excellent', color: 'var(--score-good)', bg: 'var(--score-good-bg)' };
  if (score >= 70) return { label: 'Good', color: 'var(--score-avg)', bg: 'var(--score-avg-bg)' };
  if (score >= 50) return { label: 'Needs Work', color: 'var(--score-avg)', bg: 'var(--score-avg-bg)' };
  return { label: 'Poor', color: 'var(--score-poor)', bg: 'var(--score-poor-bg)' };
}

export function getScoreColor(score) {
  if (score >= 90) return 'var(--score-good)';
  if (score >= 50) return 'var(--score-avg)';
  return 'var(--score-poor)';
}

export function getCWVRating(metric, value) {
  const thresholds = {
    lcp: { good: 2500, poor: 4000 },
    inp: { good: 200, poor: 500 },
    cls: { good: 0.1, poor: 0.25 },
  };
  const t = thresholds[metric];
  if (!t) return 'unknown';
  if (value <= t.good) return 'good';
  if (value <= t.poor) return 'needs-improvement';
  return 'poor';
}
