import { useState } from 'react';
import { LinkIcon, AlertTriangle, ArrowRight } from 'lucide-react';

export default function BrokenLinksTable({ brokenLinks, redirectLinks }) {
  const [tab, setTab] = useState('broken');

  const links = tab === 'broken' ? brokenLinks : redirectLinks;
  const total = brokenLinks.length + redirectLinks.length;

  if (total === 0) return null;

  return (
    <div className="table-wrapper">
      <div className="table-header">
        <h3 className="table-title">
          <LinkIcon size={16} style={{ marginRight: 8 }} />
          Link Issues ({total})
        </h3>
        <div className="tab-toggle">
          <button
            className={`tab-btn ${tab === 'broken' ? 'active' : ''}`}
            onClick={() => setTab('broken')}
          >
            Broken ({brokenLinks.length})
          </button>
          <button
            className={`tab-btn ${tab === 'redirects' ? 'active' : ''}`}
            onClick={() => setTab('redirects')}
          >
            Redirects ({redirectLinks.length})
          </button>
        </div>
      </div>

      <div className="table-scroll">
        <table className="data-table">
          <thead>
            <tr>
              <th>URL</th>
              <th>Status</th>
              {tab === 'redirects' && <th>Redirects To</th>}
              {tab === 'broken' && <th>Error</th>}
            </tr>
          </thead>
          <tbody>
            {links.slice(0, 50).map((link, i) => (
              <tr key={`${link.url}-${i}`}>
                <td className="url-cell" title={link.url}>
                  {link.url.replace(/^https?:\/\//, '')}
                </td>
                <td>
                  <span className={`status-badge ${getStatusClass(link)}`}>
                    {link.status || 'N/A'}
                  </span>
                </td>
                {tab === 'redirects' && (
                  <td className="url-cell" title={link.redirect}>
                    <ArrowRight size={12} style={{ marginRight: 4, color: 'var(--amber)' }} />
                    {(link.redirect || '').replace(/^https?:\/\//, '')}
                  </td>
                )}
                {tab === 'broken' && (
                  <td style={{ fontSize: '0.8rem', color: 'var(--gray-500)' }}>
                    {link.error || `HTTP ${link.status}`}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {links.length > 50 && (
        <div className="table-pagination">
          <span className="pagination-info">Showing 50 of {links.length} links</span>
        </div>
      )}
    </div>
  );
}

function getStatusClass(link) {
  if (link.error === 'timeout') return 'status-timeout';
  if (link.status >= 400) return 'status-broken';
  if (link.status >= 300) return 'status-redirect';
  if (link.ok) return 'status-ok';
  return 'status-broken';
}
