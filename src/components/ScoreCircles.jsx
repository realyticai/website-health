import ScoreGauge from './ScoreGauge';

const CATEGORIES = [
  { key: 'performance', label: 'Performance' },
  { key: 'accessibility', label: 'Accessibility' },
  { key: 'bestPractices', label: 'Best Practices' },
  { key: 'seo', label: 'SEO' },
];

export default function ScoreCircles({ scores, categorizedIssues, activeCategory, onCategoryClick }) {
  // Compute fallback scores from our audit issues if PageSpeed scores unavailable
  const displayScores = {};
  for (const { key } of CATEGORIES) {
    if (scores?.[key] != null) {
      displayScores[key] = scores[key];
    } else if (categorizedIssues) {
      // Estimate: start at 100, deduct per issue found
      const issues = categorizedIssues[key] || [];
      const penalty = issues.reduce((sum, i) => {
        if (i.severity === 'critical') return sum + 15;
        if (i.severity === 'high') return sum + 8;
        if (i.severity === 'medium') return sum + 3;
        return sum + 1;
      }, 0);
      displayScores[key] = Math.max(0, Math.min(100, 100 - penalty));
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
