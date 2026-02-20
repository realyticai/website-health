import { SEVERITY_LEVELS } from '../config';

export default function IssueSummary({ counts, activeFilter, onFilterChange }) {
  const total = counts.all || 1;

  const segments = SEVERITY_LEVELS.filter((s) => s.key !== 'all').map((s) => ({
    ...s,
    count: counts[s.key] || 0,
  }));

  const getActiveStyle = (level) => {
    if (activeFilter !== level.key) return {};
    return { backgroundColor: level.color, borderColor: level.color, color: '#fff' };
  };

  return (
    <div className="issue-summary">
      <div className="issue-summary-header">
        <h3 className="issue-summary-title">Issues Found</h3>
        <span className="issue-summary-total">{counts.all} total issues</span>
      </div>

      <div className="filter-pills">
        {SEVERITY_LEVELS.map((level) => (
          <button
            key={level.key}
            className={`pill ${activeFilter === level.key ? 'active' : ''}`}
            onClick={() => onFilterChange(level.key)}
            style={getActiveStyle(level)}
          >
            <span className="pill-label">{level.label}</span>
            <span className="pill-count">{counts[level.key] ?? counts.all}</span>
          </button>
        ))}
      </div>

      <div className="distribution-bar">
        {segments.map((seg) =>
          seg.count > 0 ? (
            <div
              key={seg.key}
              className="distribution-segment"
              style={{
                width: `${(seg.count / total) * 100}%`,
                backgroundColor: seg.color,
              }}
              title={`${seg.label}: ${seg.count}`}
            />
          ) : null
        )}
      </div>
    </div>
  );
}
