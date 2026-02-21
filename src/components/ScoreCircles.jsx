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
      // Use pre-computed or PageSpeed API scores
      displayScores[key] = scores[key];
    } else if (categorizedIssues) {
      // Fallback: score by % of check types that passed
      const checks = CATEGORY_CHECKS[key] || [];
      if (checks.length === 0) {
        displayScores[key] = 100;
      } else {
        const issues = categorizedIssues[key] || [];
        const failedTypes = new Set(issues.map((i) => i.type));
        const passed = checks.filter((c) => !failedTypes.has(c.type)).length;
        displayScores[key] = Math.round((passed / checks.length) * 100);
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
