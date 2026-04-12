const { list, head } = require("@vercel/blob");
const {
  getMissingFields,
  FIELD_LABELS,
} = require("../../../lib/missing-fields");
const { sendBriefCompletionRequest } = require("../../../lib/emails");

module.exports = async (req, res) => {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  const adminKey = process.env.ADMIN_API_KEY;
  if (!adminKey) return res.status(503).json({ error: "Not configured" });
  if (req.headers.authorization !== `Bearer ${adminKey}`)
    return res.status(401).json({ error: "Unauthorized" });

  const id = req.query.id;

  try {
    const result = await list({ prefix: `briefs/${id}`, limit: 1 });
    const blob = result.blobs[0];
    if (!blob) return res.status(404).json({ error: "Brief introuvable" });

    const meta = await head(blob.url);
    const r = await fetch(meta.downloadUrl);
    if (!r.ok) throw new Error(`Fetch failed: ${r.status}`);
    const brief = await r.json();

    const missing = getMissingFields(brief);
    if (missing.length === 0)
      return res.status(400).json({ error: "Aucune info manquante" });

    const missingLabels = missing.map((f) => FIELD_LABELS[f]);
    await sendBriefCompletionRequest(brief, missingLabels);

    return res.status(200).json({ sent: true, missing: missingLabels });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
