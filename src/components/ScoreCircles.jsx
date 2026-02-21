import ScoreGauge from './ScoreGauge';

const CATEGORIES = [
  { key: 'performance', label: 'Performance' },
  { key: 'accessibility', label: 'Accessibility' },
  { key: 'bestPractices', label: 'Best Practices' },
  { key: 'seo', label: 'SEO' },
];

export default function ScoreCircles({ scores, activeCategory, onCategoryClick }) {
  if (!scores) return null;

  return (
    <div className="score-circles">
      {CATEGORIES.map(({ key, label }) => {
        const score = scores[key];
        const isActive = activeCategory === key;
        return (
          <button
            key={key}
            className={`score-circle-item ${isActive ? 'active' : ''}`}
            onClick={() => onCategoryClick(key)}
          >
            <ScoreGauge score={score ?? 0} size={100} />
            <span className="score-circle-label">{label}</span>
          </button>
        );
      })}
    </div>
  );
}
