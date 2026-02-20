import ScoreGauge from './ScoreGauge';
import { getScoreGrade } from '../utils/scoring';

export default function HealthScore({ score, issueCounts, totalStats }) {
  if (score === null) return null;

  const grade = getScoreGrade(score);

  return (
    <div className="health-score-card">
      <ScoreGauge score={score} size={120} />
      <div className="health-score-details">
        <h2 className="health-score-title">Overall Health Score</h2>
        <span className="health-score-grade" style={{ background: grade.bg, color: grade.color }}>
          {grade.label}
        </span>
        <div className="health-score-breakdown">
          <div className="breakdown-item">
            <span className="breakdown-count">{totalStats.pages}</span>
            <span className="breakdown-label">Pages</span>
          </div>
          <div className="breakdown-item">
            <span className="breakdown-count" style={{ color: 'var(--severity-critical)' }}>
              {issueCounts.critical}
            </span>
            <span className="breakdown-label">Critical</span>
          </div>
          <div className="breakdown-item">
            <span className="breakdown-count" style={{ color: 'var(--severity-high)' }}>
              {issueCounts.high}
            </span>
            <span className="breakdown-label">High</span>
          </div>
          <div className="breakdown-item">
            <span className="breakdown-count" style={{ color: 'var(--severity-medium)' }}>
              {issueCounts.medium}
            </span>
            <span className="breakdown-label">Medium</span>
          </div>
          <div className="breakdown-item">
            <span className="breakdown-count">{totalStats.images}</span>
            <span className="breakdown-label">Images</span>
          </div>
          <div className="breakdown-item">
            <span className="breakdown-count">{totalStats.links}</span>
            <span className="breakdown-label">Links</span>
          </div>
        </div>
      </div>
    </div>
  );
}
