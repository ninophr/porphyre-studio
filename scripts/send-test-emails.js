/* Fires real client + nino emails for a given brief_id, using the production
   RESEND_API_KEY sourced from .env.vercel-check. */
const emails = require("../lib/emails");

const BRIEF_ID = process.argv[2];
if (!BRIEF_ID) {
  console.error("usage: node scripts/send-test-emails.js <brief_id>");
  process.exit(1);
}

const BRIEF_URL = `https://ravwgrsesk3utvcy.public.blob.vercel-storage.com/briefs/${BRIEF_ID}.json`;

(async () => {
  const briefRes = await fetch(BRIEF_URL);
  if (!briefRes.ok) {
    console.error("brief fetch failed:", briefRes.status);
    process.exit(1);
  }
  const brief = await briefRes.json();
  brief.status = "paid";
  brief.paid_at = new Date().toISOString();
  brief.stripe_amount = 0;

  console.log(">> sending client confirmation to", brief.email);
  try {
    await emails.sendClientConfirmation(brief);
    console.log("   ok");
  } catch (e) {
    console.error("   FAILED:", e.message);
  }

  console.log(">> sending nino notification to", process.env.CONTACT_EMAIL);
  try {
    await emails.sendNinoNotification(brief, BRIEF_URL, 0);
    console.log("   ok");
  } catch (e) {
    console.error("   FAILED:", e.message);
  }
})();
