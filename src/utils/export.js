export function exportIssuesCSV(auditResults, linkResults, siteName) {
  const rows = [];
  rows.push(['Page URL', 'Issue Type', 'Severity', 'Category', 'Message', 'Element'].join(','));

  for (const page of auditResults) {
    for (const issue of page.issues || []) {
      rows.push([
        `"${page.url}"`,
        `"${issue.type}"`,
        `"${issue.severity}"`,
        `"${issue.category}"`,
        `"${issue.message}"`,
        `"${(issue.element || '').replace(/"/g, '""')}"`,
      ].join(','));
    }
  }

  // Add broken links section
  const brokenLinks = linkResults.filter((l) => !l.ok);
  if (brokenLinks.length) {
    rows.push('');
    rows.push('Broken Links');
    rows.push(['URL', 'Status', 'Error'].join(','));
    for (const link of brokenLinks) {
      rows.push([
        `"${link.url}"`,
        `"${link.status || 'N/A'}"`,
        `"${link.error || ''}"`,
      ].join(','));
    }
  }

  const csv = rows.join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${siteName || 'website'}_health_audit.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
