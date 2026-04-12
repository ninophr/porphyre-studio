const { list, head, put } = require("@vercel/blob");
const { getMissingFields, FIELD_LABELS } = require("../../lib/missing-fields");

async function fetchBrief(id) {
  const result = await list({ prefix: `briefs/${id}`, limit: 1 });
  const blob = result.blobs[0];
  if (!blob) return null;
  const meta = await head(blob.url);
  const res = await fetch(meta.downloadUrl);
  if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
  const brief = await res.json();
  return { brief, blobUrl: blob.url };
}

module.exports = async (req, res) => {
  const id = req.query.id;

  if (req.method === "GET") {
    try {
      const data = await fetchBrief(id);
      if (!data) return res.status(404).json({ error: "Brief introuvable" });
      const { brief } = data;
      const missing = getMissingFields(brief);
      return res.status(200).json({
        brief_id: brief.brief_id,
        nom: brief.nom,
        bien: brief.bien,
        offre: brief.offre,
        localisation: brief.localisation,
        missing,
        missing_labels: missing.map((f) => FIELD_LABELS[f]),
        already_complete: missing.length === 0,
      });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  if (req.method === "POST") {
    try {
      const data = await fetchBrief(id);
      if (!data) return res.status(404).json({ error: "Brief introuvable" });
      const { brief } = data;
      const updates = req.body;
      const allowed = [
        "photos",
        "description",
        "lien_airbnb",
        "lien_ical",
        "stripe_pk",
        "stripe_sk",
        "domaine",
        "pas_de_domaine",
      ];
      for (const key of allowed) {
        if (updates[key] !== undefined) brief[key] = updates[key];
      }
      brief.brief_updated_by_client_at = new Date().toISOString();
      brief.updated_at = new Date().toISOString();

      await put(`briefs/${id}.json`, JSON.stringify(brief), {
        access: "public",
        contentType: "application/json",
        addRandomSuffix: false,
      });
      return res.status(200).json({ success: true });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
};
