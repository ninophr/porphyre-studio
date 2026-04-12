const { OFFRES } = require("./offres");

const FROM = "Porphyre Studio <contact@ninoporphyre.fr>";

function h(s) {
  if (!s) return "";
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function sendEmail(to, subject, html, text) {
  if (!process.env.RESEND_API_KEY) {
    console.log(`[Email skip] No RESEND_API_KEY — to: ${to}`);
    return;
  }
  const body = { from: FROM, to, subject, html };
  if (text) body.text = text;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const b = await res.text();
    throw new Error(`Resend error ${res.status}: ${b}`);
  }
}

/* ---------- Shared layout ---------- */

function shell({ preheader, heading, subheading, body }) {
  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${h(heading)}</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
</style>
</head>
<body style="margin:0;padding:0;background:#f5f1e8;font-family:'Plus Jakarta Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#4a4540;-webkit-font-smoothing:antialiased">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;font-size:1px;line-height:1px;color:#f5f1e8">${h(preheader || "")}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f5f1e8;padding:40px 16px">
  <tr><td align="center">
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%">

      <!-- Wordmark -->
      <tr><td style="padding:0 8px 24px">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="vertical-align:middle;padding-right:10px">
              <div style="width:28px;height:28px;background:#4ecdc4;border-radius:50%;line-height:28px;text-align:center;color:#1a1715;font-weight:800;font-size:14px">*</div>
            </td>
            <td style="vertical-align:middle;font-size:15px;font-weight:800;color:#1a1715;letter-spacing:-0.01em">
              Porphyre Studio
            </td>
          </tr>
        </table>
      </td></tr>

      <!-- Hero card -->
      <tr><td>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#1a1715;border-radius:24px;overflow:hidden">
          <tr><td style="padding:44px 40px 46px">
            <div style="display:inline-block;background:rgba(78,205,196,0.12);color:#4ecdc4;font-size:10px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;padding:6px 12px;border-radius:999px;margin-bottom:20px">
              ${h(subheading || "Porphyre Studio")}
            </div>
            <h1 style="margin:0;font-family:'Plus Jakarta Sans',sans-serif;font-size:30px;line-height:1.15;font-weight:800;color:#ffffff;letter-spacing:-0.02em">
              ${h(heading)}
            </h1>
          </td></tr>
        </table>
      </td></tr>

      <!-- Body -->
      <tr><td style="padding:24px 0 0">
        ${body}
      </td></tr>

      <!-- Footer -->
      <tr><td style="padding:32px 8px 0">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr><td style="border-top:1px solid rgba(26,23,21,0.08);padding-top:24px">
            <p style="margin:0 0 6px;font-size:12px;color:#4a4540;opacity:0.6;line-height:1.6">
              Une question&nbsp;? Réponds directement à cet email ou écris sur
              <a href="https://wa.me/262693120918" style="color:#1a1715;font-weight:600;text-decoration:none;border-bottom:1px solid #4ecdc4">WhatsApp</a>.
            </p>
            <p style="margin:0;font-size:11px;color:#4a4540;opacity:0.4">
              Porphyre Studio — Sites web pour locations de vacances
            </p>
          </td></tr>
        </table>
      </td></tr>

    </table>
  </td></tr>
</table>
</body>
</html>`;
}

function card(inner, { tone = "cream" } = {}) {
  const bg = tone === "white" ? "#ffffff" : "#ebe5d8";
  const outer = tone === "white" ? "#ebe5d8" : "rgba(26,23,21,0.05)";
  return `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${outer};border-radius:22px;padding:5px;margin-bottom:14px">
  <tr><td>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${bg};border-radius:18px">
      <tr><td style="padding:26px 28px">${inner}</td></tr>
    </table>
  </td></tr>
</table>`;
}

function kv(rows) {
  return `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="font-size:14px">
${rows
  .map(
    ([k, v]) => `
  <tr>
    <td style="padding:8px 0;color:#4a4540;opacity:0.55;width:38%;vertical-align:top">${h(k)}</td>
    <td style="padding:8px 0;color:#1a1715;font-weight:600;vertical-align:top">${v}</td>
  </tr>`,
  )
  .join("")}
</table>`;
}

function ctaButton(href, label) {
  return `
<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px auto 0">
  <tr><td style="background:#1a1715;border-radius:999px">
    <a href="${href}" style="display:inline-block;padding:15px 30px 15px 34px;font-size:14px;font-weight:700;color:#f5f1e8;text-decoration:none;letter-spacing:0.01em">
      ${h(label)} &nbsp;<span style="color:#4ecdc4">→</span>
    </a>
  </td></tr>
</table>`;
}

/* ---------- Client confirmation ---------- */

async function sendClientConfirmation(brief) {
  const offre = OFFRES[brief.offre];
  const offreName = offre ? offre.name : brief.offre;
  const prix = offre ? offre.price : "";

  const subject = `Confirmation de commande — Site ${offreName}`;

  const body = `
${card(
  `
  <p style="margin:0 0 14px;font-size:15px;color:#1a1715;font-weight:600">Merci ${h(brief.nom)} !</p>
  <p style="margin:0;font-size:14px;color:#4a4540;line-height:1.7">
    Ta commande est bien reçue. Je démarre la création de ton site et je reviens vers toi très vite avec un premier aperçu.
  </p>`,
)}

${card(
  `
  <p style="margin:0 0 14px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.18em;color:#4a4540;opacity:0.5">Récapitulatif</p>
  ${kv([
    ["Offre", `${h(offreName)} — ${h(prix)}`],
    ["Bien", h(brief.bien)],
    ["Localisation", h(brief.localisation)],
  ])}`,
  { tone: "white" },
)}

${card(
  `
  <p style="margin:0 0 16px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.18em;color:#4a4540;opacity:0.5">Prochaines étapes</p>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr><td style="padding-bottom:14px">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="width:28px;vertical-align:top">
            <div style="width:22px;height:22px;line-height:22px;text-align:center;background:#4ecdc4;color:#1a1715;border-radius:999px;font-size:11px;font-weight:800">1</div>
          </td>
          <td style="padding-left:12px;font-size:14px;color:#1a1715;font-weight:600;line-height:1.5">
            Création de ton site
            <div style="font-size:13px;color:#4a4540;opacity:0.6;font-weight:400;margin-top:2px">Je commence immédiatement, livraison sous 48h.</div>
          </td>
        </tr>
      </table>
    </td></tr>
    <tr><td style="padding-bottom:14px">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="width:28px;vertical-align:top">
            <div style="width:22px;height:22px;line-height:22px;text-align:center;background:rgba(78,205,196,0.15);color:#1a1715;border-radius:999px;font-size:11px;font-weight:800">2</div>
          </td>
          <td style="padding-left:12px;font-size:14px;color:#1a1715;font-weight:600;line-height:1.5">
            Prévisualisation
            <div style="font-size:13px;color:#4a4540;opacity:0.6;font-weight:400;margin-top:2px">Tu reçois un lien pour voir ton site avant la mise en ligne.</div>
          </td>
        </tr>
      </table>
    </td></tr>
    <tr><td>
      <table role="presentation" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="width:28px;vertical-align:top">
            <div style="width:22px;height:22px;line-height:22px;text-align:center;background:rgba(78,205,196,0.15);color:#1a1715;border-radius:999px;font-size:11px;font-weight:800">3</div>
          </td>
          <td style="padding-left:12px;font-size:14px;color:#1a1715;font-weight:600;line-height:1.5">
            Ajustements &amp; mise en ligne
            <div style="font-size:13px;color:#4a4540;opacity:0.6;font-weight:400;margin-top:2px">On ajuste ensemble si besoin, puis déploiement final.</div>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>`,
)}`;

  const html = shell({
    preheader: `Ta commande ${offreName} est confirmée — livraison sous 48h`,
    subheading: "Commande confirmée",
    heading: `Merci ${brief.nom}, ton site arrive.`,
    body,
  });

  await sendEmail(brief.email, subject, html);
}

/* ---------- Nino notification ---------- */

async function sendNinoNotification(brief, briefUrl, stripeAmount) {
  const offre = OFFRES[brief.offre];
  const offreName = offre ? offre.name : brief.offre;
  const prix = offre ? offre.price : `${stripeAmount / 100}€`;
  const nino = process.env.CONTACT_EMAIL || "contact@ninoporphyre.fr";

  const missing = [];
  if (!brief.photos || !brief.photos.length) missing.push("Photos");
  if (!brief.description) missing.push("Description");
  if (offre && offre.hasTechnique) {
    if (!brief.lien_ical && !brief.ical) missing.push("Lien iCal");
    if (!brief.stripe_pk && !brief.stripe_sk && !brief.stripe_account)
      missing.push("Clés Stripe client");
    if (!brief.domaine && !brief.pas_de_domaine) missing.push("Domaine");
  }
  if (!brief.lien_airbnb) missing.push("Lien Airbnb");

  const command = `/location ${briefUrl}`;
  const subject = `NOUVELLE COMMANDE — ${brief.bien} (${offreName} ${prix})`;

  const missingBlock = missing.length
    ? card(
        `
  <p style="margin:0 0 10px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.18em;color:#c05a2a">Infos manquantes</p>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="font-size:14px">
    ${missing
      .map(
        (m) => `
    <tr><td style="padding:4px 0;color:#1a1715;font-weight:500">
      <span style="display:inline-block;width:5px;height:5px;border-radius:50%;background:#c05a2a;vertical-align:middle;margin-right:10px"></span>${h(m)}
    </td></tr>`,
      )
      .join("")}
  </table>`,
      )
    : "";

  const descBlock = brief.description
    ? card(
        `
  <p style="margin:0 0 10px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.18em;color:#4a4540;opacity:0.5">Description</p>
  <p style="margin:0;font-size:14px;color:#1a1715;line-height:1.6;white-space:pre-wrap">${h(brief.description)}</p>`,
        { tone: "white" },
      )
    : "";

  const body = `
${card(
  `
  <p style="margin:0 0 14px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.18em;color:#4a4540;opacity:0.5">Client</p>
  ${kv([
    ["Nom", h(brief.nom)],
    [
      "Email",
      `<a href="mailto:${h(brief.email)}" style="color:#1a1715;text-decoration:none;border-bottom:1px solid #4ecdc4">${h(brief.email)}</a>`,
    ],
    ["Téléphone", h(brief.telephone || "—")],
    ["Bien", h(brief.bien)],
    ["Localisation", h(brief.localisation)],
    ["Type", h(brief.type_bien || "—")],
    [
      "Offre",
      `<span style="color:#1a1715;font-weight:700">${h(offreName)} — ${h(prix)}</span>`,
    ],
    ...(brief.lien_airbnb
      ? [
          [
            "Airbnb",
            `<a href="${h(brief.lien_airbnb)}" style="color:#1a1715;text-decoration:none;border-bottom:1px solid #4ecdc4">Voir l'annonce</a>`,
          ],
        ]
      : []),
    ...(brief.domaine ? [["Domaine", h(brief.domaine)]] : []),
  ])}`,
  { tone: "white" },
)}

${descBlock}
${missingBlock}

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#1a1715;border-radius:22px;padding:5px;margin-bottom:14px">
  <tr><td>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#0f0d0c;border-radius:18px">
      <tr><td style="padding:22px 26px">
        <p style="margin:0 0 12px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.18em;color:#4ecdc4">Commande Claude Code</p>
        <pre style="margin:0;font-family:'SF Mono','Monaco','Menlo',monospace;font-size:12px;color:#4ecdc4;background:transparent;white-space:pre-wrap;word-break:break-all;line-height:1.5">${h(command)}</pre>
      </td></tr>
    </table>
  </td></tr>
</table>

<p style="margin:18px 0 0;font-size:12px;color:#4a4540;opacity:0.5;text-align:center">
  <a href="${h(briefUrl)}" style="color:#4a4540;text-decoration:none;border-bottom:1px solid rgba(26,23,21,0.15)">Brief JSON brut ↗</a>
</p>`;

  const html = shell({
    preheader: `${brief.bien} — ${offreName} ${prix}`,
    subheading: `Nouvelle commande`,
    heading: `${offreName} ${prix}`,
    body,
  });

  await sendEmail(nino, subject, html);
}

/* ---------- Delivery ---------- */

async function sendDeliveryEmail(brief, siteUrl) {
  const subject = `Votre site est en ligne — ${brief.bien}`;

  const body = `
${card(
  `
  <p style="margin:0 0 14px;font-size:15px;color:#1a1715;font-weight:600">Bonjour ${h(brief.nom)},</p>
  <p style="margin:0 0 18px;font-size:14px;color:#4a4540;line-height:1.7">
    Ton site de réservation directe est maintenant en ligne et prêt à recevoir tes premiers visiteurs. Partage-le sur tes réseaux sociaux pour commencer à recevoir des réservations sans commission.
  </p>
  <div style="text-align:center;margin-top:8px">
    ${ctaButton(siteUrl, "Voir mon site")}
  </div>`,
)}

${card(
  `
  <p style="margin:0 0 14px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.18em;color:#4a4540;opacity:0.5">Ce qui est inclus</p>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="font-size:14px;color:#1a1715">
    ${[
      "Design sur-mesure adapté à ton bien",
      "Réservation directe sans commission",
      "Optimisé mobile et tablette",
      "Référencement Google (SEO)",
    ]
      .map(
        (item) => `
    <tr><td style="padding:6px 0">
      <span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:#4ecdc4;vertical-align:middle;margin-right:12px"></span>${h(item)}
    </td></tr>`,
      )
      .join("")}
  </table>`,
  { tone: "white" },
)}`;

  const html = shell({
    preheader: `${brief.bien} — ton site est prêt`,
    subheading: "Livraison",
    heading: `Ton site est en ligne.`,
    body,
  });

  await sendEmail(brief.email, subject, html);
}

/* ---------- Brief completion request ---------- */

async function sendBriefCompletionRequest(brief, missingLabels) {
  const briefLink = `https://porphyre.studio/brief/${brief.brief_id}`;
  const subject = `Complétez votre brief — ${brief.bien}`;

  const body = `
${card(
  `
  <p style="margin:0 0 14px;font-size:15px;color:#1a1715;font-weight:600">Bonjour ${h(brief.nom)},</p>
  <p style="margin:0 0 18px;font-size:14px;color:#4a4540;line-height:1.7">
    Pour démarrer la création de ton site <strong style="color:#1a1715">${h(brief.bien)}</strong>, il me manque quelques informations. Ça prend 2 minutes et ton site sera lancé dès réception.
  </p>
  <div style="text-align:center;margin-top:8px">
    ${ctaButton(briefLink, "Compléter mon brief")}
  </div>`,
)}

${card(
  `
  <p style="margin:0 0 14px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.18em;color:#4a4540;opacity:0.5">Ce qu'il me faut</p>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="font-size:14px;color:#1a1715">
    ${missingLabels
      .map(
        (m) => `
    <tr><td style="padding:6px 0">
      <span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:#4ecdc4;vertical-align:middle;margin-right:12px"></span>${h(m)}
    </td></tr>`,
      )
      .join("")}
  </table>`,
  { tone: "white" },
)}`;

  const html = shell({
    preheader: `Quelques infos pour démarrer ton site ${brief.bien}`,
    subheading: "Brief à compléter",
    heading: `Il me manque 2-3 infos`,
    body,
  });

  await sendEmail(brief.email, subject, html);
}

module.exports = {
  sendEmail,
  sendClientConfirmation,
  sendNinoNotification,
  sendDeliveryEmail,
  sendBriefCompletionRequest,
};
