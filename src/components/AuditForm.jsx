import { Globe, Search } from 'lucide-react';
import { DEFAULT_CRAWL_DEPTH, MAX_CRAWL_DEPTH } from '../config';

const PRESETS = [1, 10, 50, 100, 500, 1000];

export default function AuditForm({ url, onUrlChange, depth, onDepthChange, onStart }) {
  const handleSubmit = (e) => {
    e.preventDefault();
    if (url.trim()) onStart(url, depth);
  };

  return (
    <div className="audit-form-wrapper">
      <form className="audit-form" onSubmit={handleSubmit}>
        <h1 className="audit-form-title">Audit Your Website</h1>
        <p className="audit-form-subtitle">
          Check for broken links, missing alt tags, H1 issues, meta problems, and more.
        </p>

        <div className="url-input-group">
          <div className="url-input-wrapper">
            <Globe size={18} className="input-icon" />
            <input
              type="text"
              className="url-input"
              placeholder="Enter website URL (e.g., example.com)"
              value={url}
              onChange={(e) => onUrlChange(e.target.value)}
              autoFocus
            />
          </div>
        </div>

        <div className="depth-control">
          <div className="depth-label">
            <span>Crawl Depth</span>
            <span className="depth-value">{depth} page{depth !== 1 ? 's' : ''}</span>
          </div>
          <input
            type="range"
            className="depth-slider"
            min={1}
            max={MAX_CRAWL_DEPTH}
            value={depth}
            onChange={(e) => onDepthChange(parseInt(e.target.value))}
          />
          <div className="depth-presets">
            {PRESETS.map((p) => (
              <button
                type="button"
                key={p}
                className={`depth-preset ${depth === p ? 'active' : ''}`}
                onClick={() => onDepthChange(p)}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <button type="submit" className="btn-audit" disabled={!url.trim()}>
          <Search size={18} />
          Run Audit
        </button>
      </form>
    </div>
  );
}
