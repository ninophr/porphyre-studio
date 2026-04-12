const { OFFRES } = require("./offres");

const FROM = "Porphyre Studio <contact@ninoporphyre.fr>";

/* ---------- Design tokens (site palette) ---------- */
const C = {
  bg: "#f5f1e8", // cream
  sand: "#ebe5d8",
  dark: "#1a1715",
  warm: "#4a4540",
  accent: "#4ecdc4", // teal brand
  white: "#ffffff",
};
const FONT =
  "'Plus Jakarta Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif";

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

/* ---------- Wrapper ---------- */

function wrap(inner) {
  return `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');</style>
</head><body style="margin:0;padding:0;background:${C.bg};font-family:${FONT};color:${C.warm};-webkit-font-smoothing:antialiased">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${C.bg};padding:40px 16px">
<tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%">
${inner}
</table>
</td></tr></table></body></html>`;
}

/* ---------- Client confirmation ---------- */

async function sendClientConfirmation(brief) {
  const offre = OFFRES[brief.offre];
  const offreName = offre ? offre.name : brief.offre;
  const prix = offre ? offre.price : "";

  const subject = `Confirmation de commande — Site ${offreName}`;

  const inner = `
<tr><td>
  <div style="background:${C.dark};padding:32px;border-radius:16px">
    <h1 style="color:${C.accent};font-size:24px;margin:0 0 8px;font-family:${FONT};font-weight:800;letter-spacing:-0.01em">Merci ${h(brief.nom)} !</h1>
    <p style="color:${C.white};opacity:.7;margin:0;font-size:14px;font-family:${FONT}">Votre commande a bien été enregistrée.</p>
  </div>
</td></tr>
<tr><td style="padding:24px 0">
  <h2 style="font-size:18px;color:${C.dark};font-family:${FONT};font-weight:700;margin:0 0 12px">Récapitulatif</h2>
  <table style="width:100%;border-collapse:collapse;font-family:${FONT}">
    <tr><td style="padding:10px 0;color:${C.warm};opacity:.55;font-size:14px;width:38%">Offre</td><td style="padding:10px 0;font-weight:700;color:${C.dark};font-size:14px">${h(offreName)} — ${h(prix)}</td></tr>
    <tr><td style="padding:10px 0;color:${C.warm};opacity:.55;font-size:14px">Bien</td><td style="padding:10px 0;color:${C.dark};font-size:14px">${h(brief.bien)}</td></tr>
    <tr><td style="padding:10px 0;color:${C.warm};opacity:.55;font-size:14px">Localisation</td><td style="padding:10px 0;color:${C.dark};font-size:14px">${h(brief.localisation)}</td></tr>
  </table>
  <h2 style="font-size:18px;color:${C.dark};margin:28px 0 12px;font-family:${FONT};font-weight:700">Prochaines étapes</h2>
  <ol style="color:${C.warm};line-height:1.8;font-family:${FONT};font-size:14px;margin:0;padding-left:20px">
    <li style="margin-bottom:4px">Je démarre la création de votre site sous 24h</li>
    <li style="margin-bottom:4px">Vous recevrez un lien de prévisualisation</li>
    <li>Livraison de votre site sous 48h</li>
  </ol>
  <p style="color:${C.warm};opacity:.6;margin-top:28px;font-size:13px;font-family:${FONT};line-height:1.6">
    Une question ? Répondez directement à cet email ou contactez-moi sur
    <a href="https://wa.me/262693120918" style="color:${C.dark};font-weight:600;text-decoration:none;border-bottom:1px solid ${C.accent}">WhatsApp</a>.
  </p>
</td></tr>`;

  await sendEmail(brief.email, subject, wrap(inner));
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
  const now = new Date().toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const subject = `NOUVELLE COMMANDE — ${brief.bien} (${offreName} ${prix})`;

  const row = (k, v) =>
    `<tr><td style="padding:6px 12px 6px 0;color:${C.warm};opacity:.55;font-size:13px;width:130px;vertical-align:top">${k}</td><td style="padding:6px 0;color:${C.dark};font-size:13px;vertical-align:top">${v}</td></tr>`;

  const inner = `
<tr><td>
  <div style="background:${C.dark};padding:28px 32px;border-radius:16px">
    <h1 style="color:${C.accent};font-size:20px;margin:0 0 6px;font-family:${FONT};font-weight:800;letter-spacing:-0.01em">Nouvelle commande ${h(offreName)}</h1>
    <p style="margin:0;color:${C.white};opacity:.5;font-size:13px;font-family:${FONT};font-feature-settings:'tnum'">${h(now)}</p>
  </div>
</td></tr>

<tr><td style="padding:22px 0 0">
  <h2 style="margin:0 0 10px;font-size:15px;font-family:${FONT};color:${C.dark};font-weight:700">Client</h2>
  <table style="width:100%;border-collapse:collapse;font-family:${FONT}">
    ${row("Nom", h(brief.nom))}
    ${row("Email", `<a href="mailto:${h(brief.email)}" style="color:${C.dark};text-decoration:none;border-bottom:1px solid ${C.accent}">${h(brief.email)}</a>`)}
    ${row("Téléphone", h(brief.telephone || "—"))}
    ${row("Bien", h(brief.bien))}
    ${row("Localisation", h(brief.localisation))}
    ${row("Type", h(brief.type_bien || "—"))}
    ${row("Offre", `<strong style="color:${C.dark}">${h(offreName)} — ${h(prix)}</strong>`)}
    ${row("Preset", h(brief.preset || "—"))}
    ${brief.lien_airbnb ? row("Airbnb", `<a href="${h(brief.lien_airbnb)}" style="color:${C.dark};text-decoration:none;border-bottom:1px solid ${C.accent}">${h(brief.lien_airbnb)}</a>`) : ""}
    ${brief.domaine ? row("Domaine", h(brief.domaine)) : ""}
  </table>
</td></tr>

${
  brief.description
    ? `
<tr><td style="padding:18px 0 0">
  <h2 style="margin:0 0 8px;font-size:15px;font-family:${FONT};color:${C.dark};font-weight:700">Description</h2>
  <p style="font-family:${FONT};font-size:13px;color:${C.warm};white-space:pre-wrap;margin:0;line-height:1.6">${h(brief.description)}</p>
</td></tr>`
    : ""
}

${
  missing.length > 0
    ? `
<tr><td style="padding:18px 0 0">
  <div style="background:${C.sand};border:1px solid rgba(26,23,21,0.08);padding:16px 18px;border-radius:12px">
    <p style="margin:0 0 8px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.15em;color:${C.warm};font-family:${FONT}">Infos manquantes</p>
    <ul style="margin:0;padding-left:18px;font-family:${FONT};font-size:13px;color:${C.dark};line-height:1.7">
      ${missing.map((m) => `<li>${h(m)}</li>`).join("")}
    </ul>
  </div>
</td></tr>`
    : ""
}

<tr><td style="padding:18px 0 0">
  <div style="background:${C.dark};padding:18px 20px;border-radius:12px">
    <p style="margin:0 0 10px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.15em;color:${C.accent};font-family:${FONT}">Commande Claude Code</p>
    <pre style="margin:0;font-family:'SF Mono','Monaco','Menlo',monospace;font-size:12px;color:${C.accent};background:transparent;white-space:pre-wrap;word-break:break-all;line-height:1.5">${h(command)}</pre>
  </div>
</td></tr>

<tr><td style="padding:16px 0 0">
  <p style="font-family:${FONT};font-size:12px;color:${C.warm};opacity:.5;margin:0">
    <a href="${h(briefUrl)}" style="color:${C.warm};text-decoration:none;border-bottom:1px solid rgba(26,23,21,0.15)">Brief JSON ↗</a>
  </p>
</td></tr>`;

  await sendEmail(nino, subject, wrap(inner));
}

/* ---------- Delivery ---------- */

async function sendDeliveryEmail(brief, siteUrl) {
  const subject = `Votre site est en ligne — ${brief.bien}`;

  const inner = `
<tr><td>
  <div style="background:${C.dark};padding:32px;border-radius:16px">
    <h1 style="color:${C.accent};font-size:24px;margin:0 0 8px;font-family:${FONT};font-weight:800;letter-spacing:-0.01em">Votre site est prêt !</h1>
    <p style="color:${C.white};opacity:.7;margin:0;font-size:14px;font-family:${FONT}">${h(brief.bien)} — ${h(brief.localisation)}</p>
  </div>
</td></tr>
<tr><td style="padding:24px 0">
  <p style="color:${C.warm};font-size:14px;font-family:${FONT};line-height:1.7;margin:0 0 12px">Bonjour ${h(brief.nom)},</p>
  <p style="color:${C.warm};font-size:14px;font-family:${FONT};line-height:1.7;margin:0">Votre site de réservation directe est maintenant en ligne et prêt à recevoir vos premiers visiteurs.</p>
  <div style="text-align:center;margin:32px 0">
    <a href="${h(siteUrl)}" style="display:inline-block;background:${C.dark};color:${C.bg};font-weight:700;padding:15px 34px;border-radius:999px;text-decoration:none;font-size:14px;font-family:${FONT}">Voir mon site &nbsp;<span style="color:${C.accent}">→</span></a>
  </div>
  <h2 style="font-size:16px;color:${C.dark};font-family:${FONT};font-weight:700;margin:0 0 10px">Ce qui est inclus</h2>
  <ul style="color:${C.warm};line-height:1.8;font-family:${FONT};font-size:14px;margin:0;padding-left:20px">
    <li>Design sur-mesure adapté à votre bien</li>
    <li>Réservation directe sans commission</li>
    <li>Optimisé mobile et tablette</li>
    <li>Référencement Google (SEO)</li>
  </ul>
  <p style="color:${C.warm};margin-top:20px;font-size:14px;font-family:${FONT};line-height:1.6">N'hésitez pas à partager ce lien sur vos réseaux sociaux pour recevoir des réservations en direct.</p>
  <p style="color:${C.warm};opacity:.6;margin-top:24px;font-size:13px;font-family:${FONT};line-height:1.6">
    Une question ? Répondez directement à cet email ou contactez-moi sur
    <a href="https://wa.me/262693120918" style="color:${C.dark};font-weight:600;text-decoration:none;border-bottom:1px solid ${C.accent}">WhatsApp</a>.
  </p>
</td></tr>`;

  await sendEmail(brief.email, subject, wrap(inner));
}

/* ---------- Brief completion request ---------- */

async function sendBriefCompletionRequest(brief, missingLabels) {
  const briefLink = `https://porphyre.studio/brief/${brief.brief_id}`;
  const subject = `Complétez votre brief — ${brief.bien}`;

  const inner = `
<tr><td>
  <div style="background:${C.dark};padding:32px;border-radius:16px">
    <h1 style="color:${C.accent};font-size:24px;margin:0 0 8px;font-family:${FONT};font-weight:800;letter-spacing:-0.01em">Bonjour ${h(brief.nom)},</h1>
    <p style="color:${C.white};opacity:.7;margin:0;font-size:14px;font-family:${FONT}">Il manque quelques informations pour créer votre site.</p>
  </div>
</td></tr>
<tr><td style="padding:24px 0">
  <p style="color:${C.warm};font-size:14px;font-family:${FONT};line-height:1.7;margin:0 0 14px">
    Pour que je puisse démarrer la création de votre site <strong style="color:${C.dark}">${h(brief.bien)}</strong>, j'ai besoin de :
  </p>
  <ul style="color:${C.warm};line-height:1.8;font-family:${FONT};font-size:14px;margin:0 0 8px;padding-left:20px">
    ${missingLabels.map((m) => `<li>${h(m)}</li>`).join("")}
  </ul>
  <div style="text-align:center;margin:32px 0">
    <a href="${h(briefLink)}" style="display:inline-block;background:${C.dark};color:${C.bg};font-weight:700;padding:15px 34px;border-radius:999px;text-decoration:none;font-size:14px;font-family:${FONT}">Compléter mon brief &nbsp;<span style="color:${C.accent}">→</span></a>
  </div>
  <p style="color:${C.warm};opacity:.5;font-size:13px;text-align:center;font-family:${FONT};margin:0">Ça prend 2 minutes. Votre site sera lancé dès réception.</p>
  <p style="color:${C.warm};opacity:.6;margin-top:24px;font-size:13px;font-family:${FONT};line-height:1.6">
    Une question ? Répondez directement à cet email ou contactez-moi sur
    <a href="https://wa.me/262693120918" style="color:${C.dark};font-weight:600;text-decoration:none;border-bottom:1px solid ${C.accent}">WhatsApp</a>.
  </p>
</td></tr>`;

  await sendEmail(brief.email, subject, wrap(inner));
}

module.exports = {
  sendEmail,
  sendClientConfirmation,
  sendNinoNotification,
  sendDeliveryEmail,
  sendBriefCompletionRequest,
};
