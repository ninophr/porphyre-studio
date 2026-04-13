const Stripe = require("stripe");
const { put } = require("@vercel/blob");
const {
  sendClientConfirmation,
  sendNinoNotification,
} = require("../lib/emails");

function buffer(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).end();

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const buf = await buffer(req);
  const sig = req.headers["stripe-signature"];

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      buf.toString(),
      sig,
      process.env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (err) {
    console.error("Webhook signature failed:", err.message);
    return res.status(400).json({ error: "Invalid signature" });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const { brief_id, brief_url } = session.metadata;

    const briefRes = await fetch(brief_url);
    const brief = await briefRes.json();

    if (brief.webhook_processed) {
      return res.status(200).json({ received: true, already_processed: true });
    }

    brief.status = "paid";
    brief.paid_at = new Date().toISOString();
    brief.stripe_payment_intent = session.payment_intent;
    brief.stripe_amount = session.amount_total;
    brief.stripe_customer_email =
      session.customer_details?.email || session.customer_email;
    brief.webhook_processed = true;

    try {
      await sendClientConfirmation(brief);
      brief.client_email_sent = true;
    } catch (err) {
      console.error("[stripe-webhook] Client email failed:", err);
    }

    try {
      await sendNinoNotification(brief, brief_url, session.amount_total);
      brief.nino_email_sent = true;
    } catch (err) {
      console.error("[stripe-webhook] Nino email failed:", err);
    }

    await put(`briefs/${brief_id}.json`, JSON.stringify(brief), {
      access: "public",
      contentType: "application/json",
      token: process.env.BLOB_READ_WRITE_TOKEN,
      addRandomSuffix: false,
    });
  }

  return res.status(200).json({ received: true });
};

module.exports.config = { api: { bodyParser: false } };
