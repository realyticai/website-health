import { useState } from 'react';
import { ChevronDown, ChevronRight, CheckCircle2, XCircle, AlertTriangle, Info } from 'lucide-react';
import { CATEGORY_CHECKS } from '../config';
import CoreWebVitals from './CoreWebVitals';
import OpportunitiesCard from './OpportunitiesCard';
import BrokenLinksTable from './BrokenLinksTable';

export default function CategoryDrilldown({
  category,
  score,
  issues,
  pagespeedResults,
  brokenLinks,
  redirectLinks,
  auditResults,
  defaultOpen = false,
}) {
  const [open, setOpen] = useState(defaultOpen);
  const [showPassed, setShowPassed] = useState(false);

  const checks = CATEGORY_CHECKS[category] || [];

  // Group issues by type
  const issuesByType = {};
  for (const issue of issues) {
    if (!issuesByType[issue.type]) {
      issuesByType[issue.type] = [];
    }
    issuesByType[issue.type].push(issue);
  }

  // Build failed and passed lists
  const failedChecks = [];
  const passedChecks = [];

  for (const check of checks) {
    const matchingIssues = issuesByType[check.type] || [];
    if (matchingIssues.length > 0) {
      failedChecks.push({ ...check, issues: matchingIssues, count: matchingIssues.length });
    } else {
      passedChecks.push(check);
    }
  }

  const failedCount = failedChecks.length;
  const totalIssues = issues.length;
  const label = getCategoryLabel(category);

  return (
    <div className={`drilldown ${open ? 'drilldown-open' : ''}`}>
      <button className="drilldown-header" onClick={() => setOpen(!open)}>
        <div className="drilldown-header-left">
          {open ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
          <span className="drilldown-title">{label}</span>
          {score != null && (
            <span className={`drilldown-score ${getScoreClass(score)}`}>{score}</span>
          )}
        </div>
        <div className="drilldown-header-right">
          {totalIssues > 0 ? (
            <span className="drilldown-issue-count">{totalIssues} issue{totalIssues !== 1 ? 's' : ''}</span>
          ) : (
            <span className="drilldown-pass-count">All passed</span>
          )}
        </div>
      </button>

      {open && (
        <div className="drilldown-body">
          {/* Special sections for Performance */}
          {category === 'performance' && pagespeedResults?.coreWebVitals && (
            <CoreWebVitals vitals={pagespeedResults.coreWebVitals} />
          )}

          {/* Failed audits */}
          {failedChecks.map((check) => (
            <div key={check.type} className="audit-item audit-item-fail">
              <div className="audit-item-header">
                <XCircle size={16} className="audit-icon-fail" />
                <span className="audit-item-title">{check.label}</span>
                <span className={`severity-badge severity-${check.issues[0]?.severity || 'medium'}`}>
                  {check.issues[0]?.severity}
                </span>
                <span className="audit-item-count">
                  {check.count} {check.count === 1 ? 'instance' : 'instances'}
                </span>
              </div>
              <div className="audit-item-details">
                {check.issues.slice(0, 10).map((issue, i) => (
                  <div key={i} className="audit-detail-row">
                    <span className="audit-detail-url">
                      {(issue.pageUrl || '').replace(/^https?:\/\//, '')}
                    </span>
                    <span className="audit-detail-msg">{issue.message}</span>
                    {issue.element && (
                      <code className="audit-detail-element">{issue.element}</code>
                    )}
                  </div>
                ))}
                {check.count > 10 && (
                  <div className="audit-detail-more">
                    +{check.count - 10} more
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* SEO: Show broken links table */}
          {category === 'seo' && (brokenLinks?.length > 0 || redirectLinks?.length > 0) && (
            <BrokenLinksTable brokenLinks={brokenLinks} redirectLinks={redirectLinks} />
          )}

          {/* Performance: Show opportunities */}
          {category === 'performance' && pagespeedResults?.opportunities && (
            <OpportunitiesCard opportunities={pagespeedResults.opportunities} />
          )}

          {/* Passed audits (collapsed) */}
          {passedChecks.length > 0 && (
            <div className="passed-section">
              <button className="passed-toggle" onClick={() => setShowPassed(!showPassed)}>
                <CheckCircle2 size={16} className="audit-icon-pass" />
                <span>Passed audits ({passedChecks.length})</span>
                {showPassed ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </button>
              {showPassed && (
                <div className="passed-list">
                  {passedChecks.map((check) => (
                    <div key={check.type} className="audit-item audit-item-pass">
                      <CheckCircle2 size={14} className="audit-icon-pass" />
                      <span className="audit-item-title">{check.label}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function getCategoryLabel(category) {
  const labels = {
    performance: 'Performance',
    accessibility: 'Accessibility',
    bestPractices: 'Best Practices',
    seo: 'SEO',
  };
  return labels[category] || category;
}

function getScoreClass(score) {
  if (score >= 90) return 'score-good';
  if (score >= 50) return 'score-avg';
  return 'score-poor';
}
