import { useState, useMemo } from 'react';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';

const PAGE_SIZE = 20;

export default function IssuesTable({ issues }) {
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState('severity');
  const [sortDir, setSortDir] = useState('asc');
  const [page, setPage] = useState(0);

  const severityOrder = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
    setPage(0);
  };

  const filtered = useMemo(() => {
    let result = issues;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (i) =>
          i.message.toLowerCase().includes(q) ||
          (i.pageUrl || '').toLowerCase().includes(q) ||
          i.category.toLowerCase().includes(q)
      );
    }
    result = [...result].sort((a, b) => {
      let av, bv;
      if (sortKey === 'severity') {
        av = severityOrder[a.severity] ?? 5;
        bv = severityOrder[b.severity] ?? 5;
      } else {
        av = a[sortKey] || '';
        bv = b[sortKey] || '';
        if (typeof av === 'string') av = av.toLowerCase();
        if (typeof bv === 'string') bv = bv.toLowerCase();
      }
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return result;
  }, [issues, search, sortKey, sortDir]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const pageData = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const SortHeader = ({ label, field, className = '' }) => (
    <th onClick={() => handleSort(field)} className={`sortable-th ${className}`}>
      {label}
      {sortKey === field && <span className="sort-icon">{sortDir === 'asc' ? '↑' : '↓'}</span>}
    </th>
  );

  if (!issues.length) return null;

  return (
    <div className="table-wrapper">
      <div className="table-header">
        <h3 className="table-title">All Issues</h3>
        <div className="search-box">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search issues..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          />
        </div>
      </div>

      <div className="table-scroll">
        <table className="data-table">
          <thead>
            <tr>
              <SortHeader label="Page" field="pageUrl" />
              <SortHeader label="Severity" field="severity" />
              <SortHeader label="Category" field="category" />
              <SortHeader label="Issue" field="message" />
              <th>Element</th>
            </tr>
          </thead>
          <tbody>
            {pageData.map((issue, i) => (
              <tr key={`${issue.pageUrl}-${issue.type}-${i}`}>
                <td className="url-cell" title={issue.pageUrl}>
                  {(issue.pageUrl || '').replace(/^https?:\/\//, '')}
                </td>
                <td>
                  <span className={`severity-badge severity-${issue.severity}`}>
                    {issue.severity}
                  </span>
                </td>
                <td style={{ fontSize: '0.8rem', color: 'var(--gray-600)' }}>{issue.category}</td>
                <td style={{ fontSize: '0.85rem' }}>{issue.message}</td>
                <td>
                  {issue.element && (
                    <span className="element-cell" title={issue.element}>{issue.element}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="table-pagination">
          <span className="pagination-info">
            Showing {page * PAGE_SIZE + 1}-{Math.min((page + 1) * PAGE_SIZE, filtered.length)} of {filtered.length} issues
          </span>
          <div className="pagination-controls">
            <button className="page-btn" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
              <ChevronLeft size={16} />
            </button>
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => (
              <button
                key={i}
                className={`page-btn ${page === i ? 'active' : ''}`}
                onClick={() => setPage(i)}
              >
                {i + 1}
              </button>
            ))}
            <button className="page-btn" disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)}>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
