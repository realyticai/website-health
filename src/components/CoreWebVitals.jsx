import { Gauge, MousePointerClick, Move } from 'lucide-react';
import { CWV_THRESHOLDS } from '../config';

const ratingColors = {
  good: { bg: 'var(--score-good-bg)', color: 'var(--score-good)' },
  'needs-improvement': { bg: 'var(--score-avg-bg)', color: 'var(--score-avg)' },
  poor: { bg: 'var(--score-poor-bg)', color: 'var(--score-poor)' },
  unknown: { bg: 'var(--severity-info-bg)', color: 'var(--severity-info)' },
};

const icons = {
  lcp: <Gauge size={22} />,
  inp: <MousePointerClick size={22} />,
  cls: <Move size={22} />,
};

export default function CoreWebVitals({ vitals }) {
  if (!vitals) return null;

  const metrics = ['lcp', 'inp', 'cls'];

  return (
    <div className="cwv-cards">
      {metrics.map((key) => {
        const data = vitals[key];
        if (!data || data.value === 0) return null;

        const threshold = CWV_THRESHOLDS[key];
        const rating = data.category || 'unknown';
        const colors = ratingColors[rating] || ratingColors.unknown;
        const formatted = threshold.format(data.value);

        return (
          <div key={key} className="cwv-card">
            <div className="cwv-icon" style={{ background: colors.bg, color: colors.color }}>
              {icons[key]}
            </div>
            <div className="cwv-info">
              <div className="cwv-label">{threshold.label}</div>
              <div className="cwv-value" style={{ color: colors.color }}>{formatted}</div>
              <div className="cwv-rating" style={{ background: colors.bg, color: colors.color }}>
                {rating === 'needs-improvement' ? 'Needs Work' : rating}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
