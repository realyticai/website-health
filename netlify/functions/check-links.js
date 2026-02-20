export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  try {
    const { links } = JSON.parse(event.body);
    if (!links || !links.length) {
      return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ results: [] }) };
    }

    // Cap at 50 links per call
    const batch = links.slice(0, 50);

    const results = await Promise.allSettled(
      batch.map(async (url) => {
        try {
          // Try HEAD first (faster)
          const headRes = await fetch(url, {
            method: 'HEAD',
            headers: { 'User-Agent': 'Mozilla/5.0 (compatible; VisibilityEngine/1.0)' },
            signal: AbortSignal.timeout(5000),
            redirect: 'follow',
          });

          return {
            url,
            status: headRes.status,
            ok: headRes.ok,
            redirect: headRes.redirected ? headRes.url : null,
            error: null,
          };
        } catch (headErr) {
          // HEAD failed, try GET
          try {
            const getRes = await fetch(url, {
              method: 'GET',
              headers: { 'User-Agent': 'Mozilla/5.0 (compatible; VisibilityEngine/1.0)' },
              signal: AbortSignal.timeout(5000),
              redirect: 'follow',
            });

            return {
              url,
              status: getRes.status,
              ok: getRes.ok,
              redirect: getRes.redirected ? getRes.url : null,
              error: null,
            };
          } catch (getErr) {
            return {
              url,
              status: null,
              ok: false,
              redirect: null,
              error: getErr.name === 'TimeoutError' ? 'timeout' : getErr.message,
            };
          }
        }
      })
    );

    const formatted = results.map((r) => {
      if (r.status === 'fulfilled') return r.value;
      return { url: '', status: null, ok: false, redirect: null, error: r.reason?.message || 'Unknown error' };
    });

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ results: formatted }),
    };
  } catch (err) {
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: err.message, results: [] }),
    };
  }
}
