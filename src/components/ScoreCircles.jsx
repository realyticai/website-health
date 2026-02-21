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
      // Fallback: use Lighthouse-style weighted scoring from CATEGORY_CHECKS
      const checks = CATEGORY_CHECKS[key] || [];
      const totalWeight = checks.reduce((sum, c) => sum + c.weight, 0);

      if (totalWeight === 0) {
        // No weighted checks (e.g., Performance is API-only, Best Practices has none)
        // Show null so the gauge displays '–' instead of a misleading number
        displayScores[key] = null;
      } else {
        const issues = categorizedIssues[key] || [];
        const failedTypes = new Set(issues.map((i) => i.type));

        let passedWeight = 0;
        for (const check of checks) {
          if (!failedTypes.has(check.type)) {
            passedWeight += check.weight;
          }
        }

        displayScores[key] = Math.round((passedWeight / totalWeight) * 100);
      }
    } else {
      displayScores[key] = null;
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
