const Stripe = require("stripe");
const { put } = require("@vercel/blob");

const LABELS = {
  essentiel: "Essentiel",
  reservation: "Réservation",
  complet: "Complet",
};

function buffer(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

async function sendEmail(apiKey, to, subject, html) {
  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Porphyre Studio <contact@ninoporphyre.fr>",
      to,
      subject,
      html,
    }),
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
    const { brief_id, brief_url, offre } = session.metadata;

    // Fetch brief
    const briefRes = await fetch(brief_url);
    const brief = await briefRes.json();

    if (brief.webhook_processed) {
      return res.status(200).json({ received: true, already_processed: true });
    }

    // Enrich brief with payment data
    brief.status = "paid";
    brief.paid_at = new Date().toISOString();
    brief.stripe_payment_intent = session.payment_intent;
    brief.stripe_amount = session.amount_total;
    brief.stripe_customer_email =
      session.customer_details?.email || session.customer_email;
    brief.webhook_processed = true;

    // Save enriched brief
    await put(`briefs/${brief_id}.json`, JSON.stringify(brief), {
      access: "public",
      contentType: "application/json",
      token: process.env.BLOB_READ_WRITE_TOKEN,
      addRandomSuffix: false,
    });

    const offreLabel = LABELS[offre] || offre;
    const amount = (session.amount_total / 100).toFixed(0);
    const resendKey = process.env.RESEND_API_KEY;

    // Email 1: Client confirmation
    await sendEmail(
      resendKey,
      brief.email,
      `Confirmation de commande — Site ${offreLabel}`,
      `<div style="font-family:'Helvetica Neue',sans-serif;max-width:520px;margin:0 auto;padding:32px;background:#faf8f4;border-radius:16px">
        <h1 style="color:#2B2622;font-size:22px;margin-bottom:8px">Merci ${brief.nom} !</h1>
        <p style="color:#6b6560;line-height:1.6">Votre commande <strong>Site ${offreLabel}</strong> (${amount}€) est confirmée.</p>
        <hr style="border:none;border-top:1px solid #e0dbd4;margin:24px 0">
        <p style="color:#6b6560;font-weight:600">Prochaines étapes :</p>
        <ol style="color:#6b6560;line-height:1.8">
          <li>Je prépare votre site sous 48h</li>
          <li>Vous recevrez un lien de prévisualisation</li>
          <li>On ajuste ensemble si besoin</li>
          <li>Mise en ligne !</li>
        </ol>
        <hr style="border:none;border-top:1px solid #e0dbd4;margin:24px 0">
        <p style="color:#6b6560">Une question ? Répondez à cet email ou WhatsApp : <a href="https://wa.me/262693120918" style="color:#4ECDC4;text-decoration:none;font-weight:600">+262 693 12 09 18</a></p>
        <p style="color:#9a938b;font-size:12px;margin-top:32px">Porphyre Studio — Sites web pour locations saisonnières</p>
      </div>`,
    );

    // Email 2: Nino notification
    await sendEmail(
      resendKey,
      process.env.CONTACT_EMAIL || "contact@ninoporphyre.fr",
      `NOUVELLE COMMANDE — ${brief.bien} (${offreLabel} ${amount}€)`,
      `<div style="font-family:monospace;padding:16px">
        <h2 style="color:#4ECDC4">Nouvelle commande !</h2>
        <table style="border-collapse:collapse;width:100%">
          <tr><td style="padding:6px 16px 6px 0;color:#999">Nom</td><td style="font-weight:bold">${brief.nom}</td></tr>
          <tr><td style="padding:6px 16px 6px 0;color:#999">Email</td><td>${brief.email}</td></tr>
          <tr><td style="padding:6px 16px 6px 0;color:#999">Téléphone</td><td>${brief.telephone || "—"}</td></tr>
          <tr><td style="padding:6px 16px 6px 0;color:#999">Bien</td><td style="font-weight:bold">${brief.bien}</td></tr>
          <tr><td style="padding:6px 16px 6px 0;color:#999">Lieu</td><td>${brief.localisation}</td></tr>
          <tr><td style="padding:6px 16px 6px 0;color:#999">Type</td><td>${brief.type_bien || "—"}</td></tr>
          <tr><td style="padding:6px 16px 6px 0;color:#999">Offre</td><td style="font-weight:bold">${offreLabel} (${amount}€)</td></tr>
          <tr><td style="padding:6px 16px 6px 0;color:#999">Domaine</td><td>${brief.domaine || "À définir"}</td></tr>
          <tr><td style="padding:6px 16px 6px 0;color:#999">Airbnb</td><td>${brief.lien_airbnb ? '<a href="' + brief.lien_airbnb + '">' + brief.lien_airbnb + "</a>" : "—"}</td></tr>
          <tr><td style="padding:6px 16px 6px 0;color:#999">iCal</td><td>${brief.ical || "—"}</td></tr>
          <tr><td style="padding:6px 16px 6px 0;color:#999">Style</td><td>${brief.style || "—"}</td></tr>
          <tr><td style="padding:6px 16px 6px 0;color:#999">Stripe</td><td>${brief.stripe_account || "—"}</td></tr>
        </table>
        ${brief.description ? "<h3>Description</h3><p>" + brief.description + "</p>" : ""}
        ${brief.notes ? "<h3>Notes</h3><p>" + brief.notes + "</p>" : ""}
        <hr>
        <p><a href="${brief_url}">Brief JSON</a></p>
      </div>`,
    );
  }

  return res.status(200).json({ received: true });
};

module.exports.config = { api: { bodyParser: false } };
