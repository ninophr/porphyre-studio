const crypto = require("crypto");

const SECRET = process.env.STRIPE_WEBHOOK_SECRET.replace(/\s/g, "");
const BRIEF_ID = "de8be672-b65b-4a91-bdde-9d438636233f";
const BRIEF_URL =
  "https://ravwgrsesk3utvcy.public.blob.vercel-storage.com/briefs/de8be672-b65b-4a91-bdde-9d438636233f.json";

const event = {
  id: "evt_sim_" + Date.now(),
  object: "event",
  type: "checkout.session.completed",
  api_version: "2024-06-20",
  created: Math.floor(Date.now() / 1000),
  data: {
    object: {
      id: "cs_sim_" + Date.now(),
      object: "checkout.session",
      amount_total: 89700,
      payment_intent: "pi_sim_" + Date.now(),
      customer_email: "nino.porphyre@icloud.com",
      customer_details: { email: "nino.porphyre@icloud.com" },
      metadata: {
        brief_id: BRIEF_ID,
        brief_url: BRIEF_URL,
        offre: "reservation",
      },
    },
  },
};

const payload = JSON.stringify(event);
const timestamp = Math.floor(Date.now() / 1000);
const signed = `${timestamp}.${payload}`;
const sig = crypto.createHmac("sha256", SECRET).update(signed).digest("hex");
const header = `t=${timestamp},v1=${sig}`;

(async () => {
  const res = await fetch("https://porphyre.studio/api/stripe-webhook", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "stripe-signature": header,
    },
    body: payload,
  });
  console.log("status:", res.status);
  console.log("body:", await res.text());
})();
