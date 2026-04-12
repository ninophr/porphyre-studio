const crypto = require("crypto");
const Stripe = require("stripe");
const { put } = require("@vercel/blob");

const PRICES = { essentiel: 49700, reservation: 89700, complet: 129700 };
const LABELS = {
  essentiel: "Essentiel",
  reservation: "Réservation",
  complet: "Complet",
};

module.exports = async (req, res) => {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const {
    offre,
    nom,
    email,
    telephone,
    bien,
    localisation,
    type_bien,
    lien_airbnb,
    style,
    description,
    notes,
    domaine,
    stripe_account,
    ical,
  } = req.body;

  const price = PRICES[offre];
  if (!price) return res.status(400).json({ error: "Offre invalide" });
  if (!nom || !email || !bien || !localisation) {
    return res.status(400).json({ error: "Champs obligatoires manquants" });
  }

  const briefId = crypto.randomUUID();

  const brief = {
    brief_id: briefId,
    created_at: new Date().toISOString(),
    status: "draft",
    offre,
    nom,
    email,
    telephone: telephone || "",
    bien,
    localisation,
    type_bien: type_bien || "",
    lien_airbnb: lien_airbnb || "",
    style: style || "",
    description: description || "",
    notes: notes || "",
    domaine: domaine || "",
    stripe_account: stripe_account || "",
    ical: ical || "",
  };

  const blob = await put(`briefs/${briefId}.json`, JSON.stringify(brief), {
    access: "public",
    contentType: "application/json",
    token: process.env.BLOB_READ_WRITE_TOKEN,
    addRandomSuffix: false,
  });

  const origin =
    req.headers.origin ||
    req.headers.referer?.replace(/\/[^/]*$/, "") ||
    "https://porphyre.studio";

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "eur",
          product_data: { name: `Site ${LABELS[offre]} — Porphyre Studio` },
          unit_amount: price,
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    customer_email: email,
    success_url: `${origin}/commander/succes`,
    cancel_url: `${origin}/commander/${offre}`,
    metadata: {
      brief_id: briefId,
      brief_url: blob.url,
      offre,
    },
  });

  return res.status(200).json({ url: session.url });
};
