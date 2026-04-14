const { put } = require("@vercel/blob");
const crypto = require("crypto");

module.exports = async (req, res) => {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  const adminKey = process.env.ADMIN_API_KEY;
  if (!adminKey) return res.status(503).json({ error: "Not configured" });
  if (req.headers.authorization !== `Bearer ${adminKey}`)
    return res.status(401).json({ error: "Unauthorized" });

  try {
    const contentType = req.headers["content-type"] || "";

    if (!contentType.startsWith("multipart/form-data")) {
      return res
        .status(400)
        .json({ error: "Content-Type must be multipart/form-data" });
    }

    // Parse multipart manually — collect raw body
    const chunks = [];
    await new Promise((resolve, reject) => {
      req.on("data", (chunk) => chunks.push(chunk));
      req.on("end", resolve);
      req.on("error", reject);
    });
    const body = Buffer.concat(chunks);

    const boundary = contentType.split("boundary=")[1];
    if (!boundary) return res.status(400).json({ error: "No boundary" });

    const parts = parseMultipart(body, boundary);
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    const maxSize = 5 * 1024 * 1024;
    const urls = [];

    for (const part of parts) {
      if (!allowed.includes(part.type))
        return res
          .status(400)
          .json({ error: `Type non supporté: ${part.type}` });
      if (part.data.length > maxSize)
        return res.status(400).json({ error: "Fichier trop lourd (max 5MB)" });

      const ext =
        part.type.split("/")[1] === "jpeg" ? "jpg" : part.type.split("/")[1];
      const name = `uploads/${crypto.randomUUID()}.${ext}`;

      const blob = await put(name, part.data, {
        access: "public",
        contentType: part.type,
        addRandomSuffix: false,
      });
      urls.push(blob.url);
    }

    return res.status(200).json({ urls });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

module.exports.config = { api: { bodyParser: false } };

function parseMultipart(body, boundary) {
  const parts = [];
  const sep = Buffer.from(`--${boundary}`);
  let start = body.indexOf(sep) + sep.length;

  while (true) {
    const next = body.indexOf(sep, start);
    if (next === -1) break;
    const part = body.slice(start, next);
    start = next + sep.length;

    const headerEnd = part.indexOf("\r\n\r\n");
    if (headerEnd === -1) continue;
    const headerStr = part.slice(0, headerEnd).toString();
    const data = part.slice(headerEnd + 4, part.length - 2); // strip trailing \r\n

    const typeMatch = headerStr.match(/Content-Type:\s*(.+)/i);
    const nameMatch = headerStr.match(/filename="([^"]+)"/);
    if (typeMatch && nameMatch) {
      parts.push({
        filename: nameMatch[1],
        type: typeMatch[1].trim(),
        data,
      });
    }
  }
  return parts;
}
