const { list, head } = require("@vercel/blob");

module.exports = async (req, res) => {
  if (req.method !== "GET")
    return res.status(405).json({ error: "Method not allowed" });

  const adminKey = process.env.ADMIN_API_KEY;
  if (!adminKey) return res.status(503).json({ error: "Not configured" });
  if (req.headers.authorization !== `Bearer ${adminKey}`)
    return res.status(401).json({ error: "Unauthorized" });

  try {
    const { blobs } = await list({ prefix: "briefs/", limit: 100 });

    const projects = await Promise.all(
      blobs.map(async (blob) => {
        try {
          const meta = await head(blob.url);
          const r = await fetch(meta.downloadUrl);
          if (!r.ok) return null;
          const brief = await r.json();
          return {
            ...brief,
            status: brief.status || "draft",
            paid_at: brief.paid_at || null,
            webhook_processed: brief.webhook_processed || false,
            client_email_sent: brief.client_email_sent || false,
            nino_email_sent: brief.nino_email_sent || false,
            brief_url: blob.url,
          };
        } catch {
          return null;
        }
      }),
    );

    const filtered = projects.filter(Boolean);
    filtered.sort((a, b) => {
      const da = a.paid_at || a.created_at || "";
      const db = b.paid_at || b.created_at || "";
      return db.localeCompare(da);
    });

    return res.status(200).json({ projects: filtered, total: filtered.length });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
