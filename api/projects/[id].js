const { list, head, put, del } = require("@vercel/blob");
const { sendDeliveryEmail } = require("../../lib/emails");

function checkAuth(req) {
  const adminKey = process.env.ADMIN_API_KEY;
  if (!adminKey) return false;
  return req.headers.authorization === `Bearer ${adminKey}`;
}

async function fetchBrief(id) {
  const result = await list({ prefix: `briefs/${id}`, limit: 1 });
  const blob = result.blobs[0];
  if (!blob) return null;
  const meta = await head(blob.url);
  const r = await fetch(meta.downloadUrl);
  if (!r.ok) throw new Error(`Fetch failed: ${r.status}`);
  const brief = await r.json();
  return { brief, blobUrl: blob.url };
}

module.exports = async (req, res) => {
  if (!checkAuth(req)) return res.status(401).json({ error: "Unauthorized" });

  const id = req.query.id;

  if (req.method === "GET") {
    try {
      const data = await fetchBrief(id);
      if (!data) return res.status(404).json({ error: "Not found" });
      return res
        .status(200)
        .json({ project: data.brief, brief_url: data.blobUrl });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  if (req.method === "PATCH") {
    try {
      const data = await fetchBrief(id);
      if (!data) return res.status(404).json({ error: "Not found" });
      const { brief } = data;
      const updates = req.body;
      const allowed = ["status", "notes", "site_url"];
      const filtered = {};
      for (const key of allowed) {
        if (key in updates) filtered[key] = updates[key];
      }
      if (Object.keys(filtered).length === 0)
        return res.status(400).json({ error: "No valid fields" });

      Object.assign(brief, filtered);
      brief.updated_at = new Date().toISOString();

      if (filtered.status === "paid" && !brief.paid_at)
        brief.paid_at = new Date().toISOString();

      await put(`briefs/${id}.json`, JSON.stringify(brief), {
        access: "public",
        contentType: "application/json",
        token: process.env.BLOB_READ_WRITE_TOKEN,
        addRandomSuffix: false,
      });

      // Send delivery email when status = delivered
      if (
        filtered.status === "delivered" &&
        brief.email &&
        !brief.delivery_email_sent
      ) {
        try {
          await sendDeliveryEmail(brief, brief.site_url || "#");
          brief.delivery_email_sent = true;
          await put(`briefs/${id}.json`, JSON.stringify(brief), {
            access: "public",
            contentType: "application/json",
            token: process.env.BLOB_READ_WRITE_TOKEN,
            addRandomSuffix: false,
          });
        } catch (emailErr) {
          console.error("[PATCH] Delivery email failed:", emailErr);
        }
      }

      return res.status(200).json({ project: brief });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  if (req.method === "DELETE") {
    try {
      const result = await list({ prefix: `briefs/${id}`, limit: 1 });
      const blob = result.blobs[0];
      if (!blob) return res.status(404).json({ error: "Not found" });
      await del(blob.url);
      return res.status(200).json({ deleted: true });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
};
