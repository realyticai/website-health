import { Globe, RefreshCw, Eye, Trash2, Plus } from 'lucide-react';
import ScoreGauge from './ScoreGauge';

export default function SiteDashboard({ sites, onSelectSite, onAddSite, onRemoveSite, onRerunSite }) {
  return (
    <div className="site-dashboard">
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Website Health Dashboard</h1>
          <p className="dashboard-subtitle">
            {sites.length} site{sites.length !== 1 ? 's' : ''} monitored
          </p>
        </div>
        <button className="btn btn-primary" onClick={onAddSite}>
          <Plus size={16} /> Add Site
        </button>
      </div>

      {sites.length === 0 ? (
        <div className="empty-dashboard">
          <Globe size={48} className="empty-icon" />
          <h2>No sites yet</h2>
          <p>Add a website to start monitoring its health.</p>
          <button className="btn btn-primary" onClick={onAddSite} style={{ marginTop: 16 }}>
            <Plus size={16} /> Add Your First Site
          </button>
        </div>
      ) : (
        <div className="site-grid">
          {sites.map((site) => (
            <SiteCard
              key={site.id}
              site={site}
              onSelect={() => onSelectSite(site.id)}
              onRemove={() => onRemoveSite(site.id)}
              onRerun={() => onRerunSite(site.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function SiteCard({ site, onSelect, onRemove, onRerun }) {
  const scores = site.scores || {};
  const hasScores = Object.values(scores).some((v) => v != null);
  const lastAudit = site.lastAudit
    ? new Date(site.lastAudit).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : 'Never';

  return (
    <div className="site-card">
      <div className="site-card-header">
        <div className="site-card-info">
          <Globe size={18} className="site-card-icon" />
          <div>
            <h3 className="site-card-name">{site.name}</h3>
            <span className="site-card-url">{site.url.replace(/^https?:\/\//, '')}</span>
          </div>
        </div>
        <button className="btn-icon btn-icon-danger" onClick={onRemove} title="Remove site">
          <Trash2 size={14} />
        </button>
      </div>

      {hasScores ? (
        <div className="site-card-scores">
          <div className="mini-score">
            <ScoreGauge score={scores.performance} size={52} />
            <span className="mini-score-label">Perf</span>
          </div>
          <div className="mini-score">
            <ScoreGauge score={scores.accessibility} size={52} />
            <span className="mini-score-label">A11y</span>
          </div>
          <div className="mini-score">
            <ScoreGauge score={scores.bestPractices} size={52} />
            <span className="mini-score-label">BP</span>
          </div>
          <div className="mini-score">
            <ScoreGauge score={scores.seo} size={52} />
            <span className="mini-score-label">SEO</span>
          </div>
        </div>
      ) : (
        <div className="site-card-no-scores">
          <span>No audit data yet</span>
        </div>
      )}

      <div className="site-card-footer">
        <span className="site-card-date">Last: {lastAudit}</span>
        <div className="site-card-actions">
          <button className="btn btn-ghost btn-sm" onClick={onRerun} title="Re-run audit">
            <RefreshCw size={14} /> Re-run
          </button>
          <button className="btn btn-primary btn-sm" onClick={onSelect}>
            <Eye size={14} /> View
          </button>
        </div>
      </div>
    </div>
  );
}
