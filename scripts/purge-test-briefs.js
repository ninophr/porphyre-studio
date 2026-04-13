/* Deletes every brief blob in production. Use only when there are no real
   customers yet. Requires BLOB_READ_WRITE_TOKEN. */
const { list, del } = require("@vercel/blob");

(async () => {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    console.error("BLOB_READ_WRITE_TOKEN missing");
    process.exit(1);
  }
  const { blobs } = await list({ prefix: "briefs/", limit: 1000, token });
  console.log(`found ${blobs.length} brief blobs`);
  let ok = 0;
  for (const b of blobs) {
    try {
      await del(b.url, { token });
      console.log("  deleted", b.pathname);
      ok++;
    } catch (e) {
      console.error("  FAILED", b.pathname, e.message);
    }
  }
  console.log(`done — ${ok}/${blobs.length} deleted`);
})();
