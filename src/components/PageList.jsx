import { FileText } from 'lucide-react';

export default function PageList({ auditResults }) {
  if (!auditResults.length) return null;

  // Sort by issue count (worst first)
  const sorted = [...auditResults].sort(
    (a, b) => (b.issues?.length || 0) - (a.issues?.length || 0)
  );

  return (
    <div className="page-list">
      <div className="page-list-header">
        <h3 className="page-list-title">
          <FileText size={16} style={{ marginRight: 8 }} />
          Pages Audited ({auditResults.length})
        </h3>
      </div>
      <div className="page-list-items">
        {sorted.map((page) => {
          const issues = page.issues || [];
          const critical = issues.filter((i) => i.severity === 'critical').length;
          const high = issues.filter((i) => i.severity === 'high').length;
          const medium = issues.filter((i) => i.severity === 'medium').length;
          const low = issues.filter((i) => i.severity === 'low').length;

          return (
            <div key={page.url} className="page-item">
              <span className="page-item-url" title={page.url}>
                {page.url.replace(/^https?:\/\//, '')}
              </span>
              <div className="page-item-badges">
                {critical > 0 && (
                  <span className="mini-badge severity-critical">{critical}</span>
                )}
                {high > 0 && (
                  <span className="mini-badge severity-high">{high}</span>
                )}
                {medium > 0 && (
                  <span className="mini-badge severity-medium">{medium}</span>
                )}
                {low > 0 && (
                  <span className="mini-badge severity-low">{low}</span>
                )}
                {issues.length === 0 && (
                  <span className="mini-badge" style={{ background: 'var(--score-good-bg)', color: 'var(--score-good)' }}>
                    Clean
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
