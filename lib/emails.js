const { OFFRES } = require("./offres");

const FROM = "Porphyre Studio <contact@ninoporphyre.fr>";

/* ---------- Design tokens (matches porphyre.studio) ---------- */
const C = {
  bg: "#f5f1e8", // page background
  bgAlt: "#ebe5d8", // gradient stop
  dark: "#1a1715", // footer / dark sections
  text: "#2b2622", // primary text
  taupe: "#7d7770", // secondary text
  accent: "#4ecdc4", // brand teal
  white: "#ffffff",
  border: "#e5e1da",
};
const FONT =
  "'Plus Jakarta Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,sans-serif";

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

/* ---------- Reusable chunks ---------- */

function wordmark() {
  return `
<table role="presentation" cellpadding="0" cellspacing="0" border="0">
  <tr>
    <td style="vertical-align:middle;padding-right:10px">
      <div style="width:30px;height:30px;background:${C.accent};border-radius:50%;line-height:30px;text-align:center;color:${C.white};font-weight:800;font-size:16px;font-family:${FONT}">✻</div>
    </td>
    <td style="vertical-align:middle;font-size:15px;font-weight:800;color:${C.text};letter-spacing:-0.01em;font-family:${FONT}">
      Porphyre Studio
    </td>
  </tr>
</table>`;
}

function pill(label, { dark = false } = {}) {
  const bg = dark ? C.dark : C.white;
  const fg = dark ? C.white : C.text;
  return `<span style="display:inline-block;background:${bg};color:${fg};font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;padding:7px 14px;border-radius:999px;font-family:${FONT};border:1px solid ${dark ? C.dark : "rgba(26,23,21,0.08)"}">${h(label)}</span>`;
}

function hero({ eyebrow, title, subtitle }) {
  return `
<tr><td style="padding:0 8px 24px">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${C.bg};background-image:linear-gradient(135deg,#f5f1e8 0%,#ebe5d8 30%,#ede8dd 60%,#f5f1e8 100%);border-radius:28px;border:1px solid rgba(255,255,255,0.8);box-shadow:0 24px 48px -12px rgba(30,25,20,0.08),inset 0 0 0 1px rgba(255,255,255,0.6)">
    <tr><td style="padding:40px 40px 44px">
      ${eyebrow ? `<div style="margin-bottom:18px">${pill(eyebrow)}</div>` : ""}
      <h1 style="margin:0;font-family:${FONT};font-size:30px;line-height:1.1;font-weight:800;color:${C.text};letter-spacing:-0.025em">
        ${title}
      </h1>
      ${subtitle ? `<p style="margin:14px 0 0;font-family:${FONT};font-size:15px;color:${C.taupe};font-weight:500;line-height:1.55">${subtitle}</p>` : ""}
    </td></tr>
  </table>
</td></tr>`;
}

function card(inner) {
  return `
<tr><td style="padding:0 8px 14px">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${C.white};border-radius:24px;border:1px solid ${C.border};box-shadow:0 4px 20px rgba(30,25,20,0.04)">
    <tr><td style="padding:28px 32px">${inner}</td></tr>
  </table>
</td></tr>`;
}

function sectionLabel(label) {
  return `<p style="margin:0 0 16px;font-family:${FONT};font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.12em;color:${C.taupe}">${h(label)}</p>`;
}

function ctaButton(href, label) {
  return `
<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:6px auto 0">
  <tr><td style="background:${C.text};border-radius:999px;box-shadow:0 10px 28px -8px rgba(30,25,20,0.35)">
    <a href="${href}" style="display:inline-block;padding:15px 30px;font-family:${FONT};font-size:14px;font-weight:700;color:${C.white};text-decoration:none;letter-spacing:-0.005em">
      ${h(label)} &nbsp;<span style="color:${C.accent}">→</span>
    </a>
  </td></tr>
</table>`;
}

function footer() {
  return `
<tr><td style="padding:24px 8px 0">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${C.dark};border-radius:22px">
    <tr><td style="padding:26px 30px">
      <p style="margin:0 0 8px;font-family:${FONT};font-size:13px;color:rgba(255,255,255,0.7);line-height:1.6">
        Une question&nbsp;? Réponds directement à cet email ou écris sur
        <a href="https://wa.me/262693120918" style="color:${C.accent};font-weight:600;text-decoration:none">WhatsApp</a>.
      </p>
      <p style="margin:0;font-family:${FONT};font-size:11px;color:rgba(255,255,255,0.35);letter-spacing:0.01em">
        Porphyre Studio — Sites web pour locations de vacances
      </p>
    </td></tr>
  </table>
</td></tr>`;
}

function wrap(inner, { preheader = "" } = {}) {
  return `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');</style>
</head><body style="margin:0;padding:0;background:${C.bg};background-image:linear-gradient(135deg,#f5f1e8 0%,#ebe5d8 30%,#ede8dd 60%,#f5f1e8 100%);font-family:${FONT};color:${C.text};-webkit-font-smoothing:antialiased">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;font-size:1px;line-height:1px;color:${C.bg}">${h(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="padding:36px 16px">
<tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%">
<tr><td style="padding:0 8px 22px">${wordmark()}</td></tr>
${inner}
${footer()}
</table>
</td></tr></table></body></html>`;
}

/* ---------- 1. Client confirmation ---------- */

async function sendClientConfirmation(brief) {
  const offre = OFFRES[brief.offre];
  const offreName = offre ? offre.name : brief.offre;
  const prix = offre ? offre.price : "";
  const subject = `Confirmation de commande — Site ${offreName}`;

  const recapRows = [
    [
      "Offre",
      `<strong style="color:${C.text};font-weight:700">${h(offreName)} — ${h(prix)}</strong>`,
    ],
    ["Bien", h(brief.bien)],
    ["Localisation", h(brief.localisation)],
  ];

  const inner = `
${hero({
  eyebrow: "Commande confirmée",
  title: `Merci ${h(brief.nom)}.`,
  subtitle:
    "Votre commande a bien été enregistrée. Je démarre la création de votre site et reviens vers vous rapidement avec un premier aperçu.",
})}

${card(`
  ${sectionLabel("Récapitulatif")}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="font-family:${FONT}">
    ${recapRows
      .map(
        ([k, v]) => `
    <tr>
      <td style="padding:9px 0;color:${C.taupe};font-size:14px;width:38%;vertical-align:top">${h(k)}</td>
      <td style="padding:9px 0;color:${C.text};font-size:14px;vertical-align:top">${v}</td>
    </tr>`,
      )
      .join("")}
  </table>
`)}

${card(`
  ${sectionLabel("Prochaines étapes")}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
    ${[
      [
        "1",
        "Création de votre site",
        "Je démarre immédiatement, livraison sous 48h.",
      ],
      [
        "2",
        "Prévisualisation",
        "Vous recevrez un lien pour voir votre site avant la mise en ligne.",
      ],
      [
        "3",
        "Ajustements & mise en ligne",
        "On ajuste ensemble si besoin, puis déploiement final.",
      ],
    ]
      .map(
        ([n, t, d]) => `
    <tr><td style="padding:0 0 14px">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="width:30px;vertical-align:top">
            <div style="width:26px;height:26px;line-height:26px;text-align:center;background:${C.accent};color:${C.white};border-radius:999px;font-family:${FONT};font-size:12px;font-weight:800">${n}</div>
          </td>
          <td style="padding-left:14px;font-family:${FONT};font-size:14px;color:${C.text};font-weight:700;line-height:1.4">
            ${t}
            <div style="font-size:13px;color:${C.taupe};font-weight:500;margin-top:3px;line-height:1.55">${d}</div>
          </td>
        </tr>
      </table>
    </td></tr>`,
      )
      .join("")}
  </table>
`)}`;

  const html = wrap(inner, {
    preheader: `Votre commande ${offreName} est confirmée — livraison sous 48h`,
  });
  await sendEmail(brief.email, subject, html);
}

/* ---------- 2. Nino notification ---------- */

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

  const row = (k, v) => `
    <tr>
      <td style="padding:9px 0;color:${C.taupe};font-family:${FONT};font-size:13px;width:140px;vertical-align:top">${h(k)}</td>
      <td style="padding:9px 0;color:${C.text};font-family:${FONT};font-size:13px;vertical-align:top">${v}</td>
    </tr>`;

  const clientRows = [
    ["Nom", h(brief.nom)],
    [
      "Email",
      `<a href="mailto:${h(brief.email)}" style="color:${C.text};text-decoration:none;border-bottom:1px solid ${C.accent}">${h(brief.email)}</a>`,
    ],
    ["Téléphone", h(brief.telephone || "—")],
    ["Bien", h(brief.bien)],
    ["Localisation", h(brief.localisation)],
    ["Type", h(brief.type_bien || "—")],
    [
      "Offre",
      `<strong style="color:${C.text};font-weight:700">${h(offreName)} — ${h(prix)}</strong>`,
    ],
    ["Preset", h(brief.preset || "—")],
  ];
  if (brief.lien_airbnb)
    clientRows.push([
      "Airbnb",
      `<a href="${h(brief.lien_airbnb)}" style="color:${C.text};text-decoration:none;border-bottom:1px solid ${C.accent}">${h(brief.lien_airbnb)}</a>`,
    ]);
  if (brief.domaine) clientRows.push(["Domaine", h(brief.domaine)]);

  const inner = `
${hero({
  eyebrow: "Nouvelle commande",
  title: `${h(offreName)} — ${h(prix)}`,
  subtitle: `${h(brief.bien)} · ${h(brief.localisation)} · ${h(now)}`,
})}

${card(`
  ${sectionLabel("Client")}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
    ${clientRows.map(([k, v]) => row(k, v)).join("")}
  </table>
`)}

${
  brief.description
    ? card(`
  ${sectionLabel("Description")}
  <p style="margin:0;font-family:${FONT};font-size:14px;color:${C.text};line-height:1.6;white-space:pre-wrap">${h(brief.description)}</p>
`)
    : ""
}

${
  missing.length > 0
    ? `
<tr><td style="padding:0 8px 14px">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#fff8e8;border-radius:24px;border:1px solid #f2d8a3;box-shadow:0 4px 20px rgba(194,146,46,0.06)">
    <tr><td style="padding:24px 30px">
      <p style="margin:0 0 12px;font-family:${FONT};font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.12em;color:#a06910">Infos manquantes</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="font-family:${FONT};font-size:14px">
        ${missing
          .map(
            (m) => `
        <tr><td style="padding:5px 0;color:${C.text};font-weight:500">
          <span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:#a06910;vertical-align:middle;margin-right:12px"></span>${h(m)}
        </td></tr>`,
          )
          .join("")}
      </table>
    </td></tr>
  </table>
</td></tr>`
    : ""
}

<tr><td style="padding:0 8px 14px">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${C.dark};border-radius:24px;box-shadow:0 8px 28px -8px rgba(30,25,20,0.25)">
    <tr><td style="padding:24px 30px">
      <p style="margin:0 0 12px;font-family:${FONT};font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.12em;color:${C.accent}">Commande Claude Code</p>
      <pre style="margin:0;font-family:'SF Mono','Monaco','Menlo','Courier New',monospace;font-size:12px;color:${C.accent};background:transparent;white-space:pre-wrap;word-break:break-all;line-height:1.55">${h(command)}</pre>
    </td></tr>
  </table>
</td></tr>

<tr><td style="padding:6px 8px 0;text-align:center">
  <a href="${h(briefUrl)}" style="font-family:${FONT};font-size:12px;color:${C.taupe};text-decoration:none;border-bottom:1px solid rgba(26,23,21,0.12)">Brief JSON brut ↗</a>
</td></tr>`;

  const html = wrap(inner, {
    preheader: `${brief.bien} — ${offreName} ${prix}`,
  });
  await sendEmail(nino, subject, html);
}

/* ---------- 3. Delivery ---------- */

async function sendDeliveryEmail(brief, siteUrl) {
  const subject = `Votre site est en ligne — ${brief.bien}`;

  const inner = `
${hero({
  eyebrow: "Livraison",
  title: "Votre site est en ligne.",
  subtitle: `${h(brief.bien)} — ${h(brief.localisation)}`,
})}

${card(`
  <p style="margin:0 0 14px;font-family:${FONT};font-size:15px;color:${C.text};font-weight:600">Bonjour ${h(brief.nom)},</p>
  <p style="margin:0 0 22px;font-family:${FONT};font-size:14px;color:${C.taupe};line-height:1.7">
    Votre site de réservation directe est maintenant en ligne et prêt à recevoir vos premiers visiteurs. Partagez-le sur vos réseaux sociaux pour commencer à recevoir des réservations sans commission.
  </p>
  <div style="text-align:center">${ctaButton(h(siteUrl), "Voir mon site")}</div>
`)}

${card(`
  ${sectionLabel("Ce qui est inclus")}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="font-family:${FONT};font-size:14px">
    ${[
      "Design sur-mesure adapté à votre bien",
      "Réservation directe sans commission",
      "Optimisé mobile et tablette",
      "Référencement Google (SEO)",
    ]
      .map(
        (item) => `
    <tr><td style="padding:7px 0;color:${C.text};font-weight:500">
      <span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:${C.accent};vertical-align:middle;margin-right:12px"></span>${h(item)}
    </td></tr>`,
      )
      .join("")}
  </table>
`)}`;

  const html = wrap(inner, {
    preheader: `${brief.bien} — votre site est prêt`,
  });
  await sendEmail(brief.email, subject, html);
}

/* ---------- 4. Brief completion request ---------- */

async function sendBriefCompletionRequest(brief, missingLabels) {
  const briefLink = `https://porphyre.studio/brief/${brief.brief_id}`;
  const subject = `Complétez votre brief — ${brief.bien}`;

  const inner = `
${hero({
  eyebrow: "Brief à compléter",
  title: "Il me manque quelques infos.",
  subtitle: `Pour démarrer la création de votre site ${h(brief.bien)}, j'ai besoin de 2-3 éléments. Ça prend 2 minutes et votre site sera lancé dès réception.`,
})}

${card(`
  ${sectionLabel("Ce qu'il me faut")}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="font-family:${FONT};font-size:14px">
    ${missingLabels
      .map(
        (m) => `
    <tr><td style="padding:7px 0;color:${C.text};font-weight:500">
      <span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:${C.accent};vertical-align:middle;margin-right:12px"></span>${h(m)}
    </td></tr>`,
      )
      .join("")}
  </table>
`)}

${card(`
  <p style="margin:0 0 18px;font-family:${FONT};font-size:14px;color:${C.taupe};line-height:1.7;text-align:center">
    Bonjour ${h(brief.nom)}, cliquez pour compléter votre brief en ligne.
  </p>
  <div style="text-align:center">${ctaButton(briefLink, "Compléter mon brief")}</div>
`)}`;

  const html = wrap(inner, {
    preheader: `Quelques infos pour démarrer votre site ${brief.bien}`,
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
