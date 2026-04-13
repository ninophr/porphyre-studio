// Local test: create a fake brief, then send a signed Stripe webhook event
// to /api/stripe-webhook to trigger the real email flow end-to-end.
const crypto = require("crypto");

const PROD = "https://porphyre.studio";
const cleanEnv = (v) => (v || "").replace(/\\n/g, "").trim();
const WEBHOOK_SECRET = cleanEnv(process.env.STRIPE_WEBHOOK_SECRET);
const STRIPE_KEY = cleanEnv(process.env.STRIPE_SECRET_KEY);
const TEST_EMAIL = process.argv[2] || "nino.porphyre@icloud.com";

if (!WEBHOOK_SECRET) throw new Error("STRIPE_WEBHOOK_SECRET missing");
if (!STRIPE_KEY) throw new Error("STRIPE_SECRET_KEY missing");

async function main() {
  // 1. Create a real brief + Stripe session via /api/checkout
  console.log(`[1/3] Creating brief + checkout session via /api/checkout...`);
  const checkoutRes = await fetch(`${PROD}/api/checkout`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      offre: "reservation",
      nom: "Test Webhook Rename",
      email: TEST_EMAIL,
      telephone: "+262 692 12 34 56",
      bien: "Villa Test Rename",
      localisation: "Saint-Denis, La Réunion",
      type_bien: "Villa",
      description: "Test automatique du webhook post-rename",
    }),
  });
  if (!checkoutRes.ok) {
    console.error(
      "Checkout failed:",
      checkoutRes.status,
      await checkoutRes.text(),
    );
    process.exit(1);
  }
  const { url: sessionUrl } = await checkoutRes.json();
  const sessionId = sessionUrl.match(/cs_[a-zA-Z0-9_]+/)?.[0];
  console.log("   stripe session id:", sessionId);

  // Fetch session from Stripe to extract metadata
  const sessRes = await fetch(
    `https://api.stripe.com/v1/checkout/sessions/${sessionId}`,
    { headers: { Authorization: `Bearer ${STRIPE_KEY}` } },
  );
  const session = await sessRes.json();
  const briefId = session.metadata?.brief_id;
  const briefUrl = session.metadata?.brief_url;
  console.log("   brief_id:", briefId);
  console.log("   brief_url:", briefUrl);

  // 2. Build a fake Stripe checkout.session.completed event
  const event = {
    id: `evt_test_${Date.now()}`,
    object: "event",
    type: "checkout.session.completed",
    data: {
      object: {
        id: `cs_test_${Date.now()}`,
        object: "checkout.session",
        payment_intent: `pi_test_${Date.now()}`,
        amount_total: 0,
        customer_email: TEST_EMAIL,
        customer_details: { email: TEST_EMAIL },
        metadata: { brief_id: briefId, brief_url: briefUrl },
      },
    },
  };

  const payload = JSON.stringify(event);
  const timestamp = Math.floor(Date.now() / 1000);
  const signedPayload = `${timestamp}.${payload}`;
  const signature = crypto
    .createHmac("sha256", WEBHOOK_SECRET)
    .update(signedPayload)
    .digest("hex");
  const stripeSignature = `t=${timestamp},v1=${signature}`;

  console.log(`[2/3] POSTing signed event to /api/stripe-webhook...`);
  const webhookRes = await fetch(`${PROD}/api/stripe-webhook`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Stripe-Signature": stripeSignature,
    },
    body: payload,
  });

  console.log("   webhook status:", webhookRes.status);
  const text = await webhookRes.text();
  console.log("   webhook body:", text);

  // 3. Check the brief was updated by the webhook
  console.log(`[3/3] Checking brief state post-webhook...`);
  const postRes = await fetch(briefUrl);
  const postBrief = await postRes.json();
  console.log("   status:", postBrief.status);
  console.log("   webhook_processed:", postBrief.webhook_processed);
  console.log("   client_email_sent:", postBrief.client_email_sent);
  console.log("   nino_email_sent:", postBrief.nino_email_sent);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
