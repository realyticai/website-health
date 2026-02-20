import ScoreGauge from './ScoreGauge';

export default function KPICards({ scores }) {
  if (!scores) return null;

  const cards = [
    { label: 'Performance', score: scores.performance },
    { label: 'Accessibility', score: scores.accessibility },
    { label: 'SEO', score: scores.seo },
    { label: 'Best Practices', score: scores.bestPractices },
  ];

  return (
    <div className="kpi-cards">
      {cards.map((card) => (
        <div key={card.label} className="kpi-card">
          <ScoreGauge score={card.score} size={90} />
          <div className="kpi-label">{card.label}</div>
        </div>
      ))}
    </div>
  );
}
