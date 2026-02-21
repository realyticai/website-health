import ScoreGauge from './ScoreGauge';
import { CATEGORY_CHECKS } from '../config';

const CATEGORIES = [
  { key: 'performance', label: 'Performance' },
  { key: 'accessibility', label: 'Accessibility' },
  { key: 'bestPractices', label: 'Best Practices' },
  { key: 'seo', label: 'SEO' },
];

export default function ScoreCircles({ scores, categorizedIssues, activeCategory, onCategoryClick }) {
  const displayScores = {};

  for (const { key } of CATEGORIES) {
    if (scores?.[key] != null) {
      // Use actual PageSpeed scores when available
      displayScores[key] = scores[key];
    } else if (categorizedIssues) {
      // Fallback: score by % of check types that PASSED
      // This matches how PageSpeed works — it counts audits, not instances
      const checks = CATEGORY_CHECKS[key] || [];
      if (checks.length === 0) {
        // No custom checks for this category (e.g., Best Practices) — show 100
        displayScores[key] = 100;
      } else {
        const issues = categorizedIssues[key] || [];
        const failedTypes = new Set(issues.map((i) => i.type));

        // Weight: critical/high failures count more than medium/low
        let totalWeight = 0;
        let passedWeight = 0;
        for (const check of checks) {
          const severity = issues.find((i) => i.type === check.type)?.severity;
          const weight = severity === 'critical' ? 3 : severity === 'high' ? 2 : 1;
          totalWeight += weight;
          if (!failedTypes.has(check.type)) {
            passedWeight += weight;
          }
        }

        displayScores[key] = totalWeight > 0
          ? Math.round((passedWeight / totalWeight) * 100)
          : 100;
      }
    } else {
      displayScores[key] = 0;
    }
  }

  return (
    <div className="score-circles">
      {CATEGORIES.map(({ key, label }) => {
        const score = displayScores[key];
        const isActive = activeCategory === key;
        return (
          <button
            key={key}
            className={`score-circle-item ${isActive ? 'active' : ''}`}
            onClick={() => onCategoryClick(key)}
          >
            <ScoreGauge score={score} size={100} />
            <span className="score-circle-label">{label}</span>
          </button>
        );
      })}
    </div>
  );
}
