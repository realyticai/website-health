import { Zap } from 'lucide-react';

export default function OpportunitiesCard({ opportunities }) {
  if (!opportunities || !opportunities.length) return null;

  return (
    <div className="opportunities">
      <h3 className="opportunities-title">
        <Zap size={16} style={{ marginRight: 8, color: 'var(--amber)' }} />
        Optimization Opportunities
      </h3>
      {opportunities.slice(0, 10).map((opp, i) => (
        <div key={i} className="opportunity-item">
          {opp.savings && <span className="opportunity-savings">{opp.savings}</span>}
          <div className="opportunity-info">
            <h4>{opp.title}</h4>
            {opp.description && <p>{opp.description}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}
