const { OFFRES } = require("./offres");

const FROM = "Porphyre Studio <contact@ninoporphyre.fr>";

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

async function sendClientConfirmation(brief) {
  const offre = OFFRES[brief.offre];
  const offreName = offre ? offre.name : brief.offre;
  const prix = offre ? offre.price : "";

  const subject = `Confirmation de commande — Site ${offreName}`;
  const html = `
<div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;color:#333">
  <div style="background:#121010;padding:32px;border-radius:12px">
    <h1 style="color:#c4956a;font-size:24px;margin:0 0 8px">Merci ${brief.nom} !</h1>
    <p style="color:#fff;opacity:.7;margin:0">Votre commande a bien été enregistrée.</p>
  </div>
  <div style="padding:24px 0">
    <h2 style="font-size:18px;color:#121010">Récapitulatif</h2>
    <table style="width:100%;border-collapse:collapse">
      <tr><td style="padding:8px 0;color:#666">Offre</td><td style="padding:8px 0;font-weight:600">${offreName} — ${prix}</td></tr>
      <tr><td style="padding:8px 0;color:#666">Bien</td><td style="padding:8px 0">${brief.bien}</td></tr>
      <tr><td style="padding:8px 0;color:#666">Localisation</td><td style="padding:8px 0">${brief.localisation}</td></tr>
    </table>
    <h2 style="font-size:18px;color:#121010;margin-top:24px">Prochaines étapes</h2>
    <ol style="color:#555;line-height:1.8">
      <li>Je démarre la création de votre site sous 24h</li>
      <li>Vous recevrez un lien de prévisualisation</li>
      <li>Livraison de votre site sous 48h</li>
    </ol>
    <p style="color:#666;margin-top:24px;font-size:14px">
      Une question ? Répondez directement à cet email ou contactez-moi sur
      <a href="https://wa.me/262693120918" style="color:#c4956a">WhatsApp</a>.
    </p>
  </div>
</div>`;

  await sendEmail(brief.email, subject, html);
}

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
  const html = `
<div style="font-family:monospace;max-width:700px;margin:0 auto;color:#333">
  <div style="background:#121010;padding:24px;border-radius:12px">
    <h1 style="color:#c4956a;font-size:20px;margin:0">Nouvelle commande ${offreName}</h1>
  </div>
  <h2 style="margin-top:20px">Client</h2>
  <table style="width:100%;border-collapse:collapse;font-size:14px">
    <tr><td style="padding:4px 8px;color:#666;width:140px">Nom</td><td>${brief.nom}</td></tr>
    <tr><td style="padding:4px 8px;color:#666">Email</td><td><a href="mailto:${brief.email}">${brief.email}</a></td></tr>
    <tr><td style="padding:4px 8px;color:#666">Téléphone</td><td>${brief.telephone || "—"}</td></tr>
    <tr><td style="padding:4px 8px;color:#666">Bien</td><td>${brief.bien}</td></tr>
    <tr><td style="padding:4px 8px;color:#666">Localisation</td><td>${brief.localisation}</td></tr>
    <tr><td style="padding:4px 8px;color:#666">Type</td><td>${brief.type_bien || "—"}</td></tr>
    <tr><td style="padding:4px 8px;color:#666">Offre</td><td><strong>${offreName} — ${prix}</strong></td></tr>
    ${brief.lien_airbnb ? `<tr><td style="padding:4px 8px;color:#666">Airbnb</td><td><a href="${brief.lien_airbnb}">${brief.lien_airbnb}</a></td></tr>` : ""}
    ${brief.domaine ? `<tr><td style="padding:4px 8px;color:#666">Domaine</td><td>${brief.domaine}</td></tr>` : ""}
  </table>
  ${brief.description ? `<h2>Description</h2><p style="font-size:14px;white-space:pre-wrap">${brief.description}</p>` : ""}
  ${missing.length > 0 ? `<div style="background:#fff3cd;border:1px solid #ffc107;padding:12px;border-radius:8px;margin:16px 0"><strong>Infos manquantes:</strong><ul style="margin:4px 0 0;padding-left:20px">${missing.map((m) => `<li>${m}</li>`).join("")}</ul></div>` : ""}
  <div style="background:#f0f0f0;padding:16px;border-radius:8px;margin:16px 0">
    <strong>Commande Claude Code:</strong>
    <pre style="background:#121010;color:#c4956a;padding:12px;border-radius:6px;overflow-x:auto;margin:8px 0 0">${command}</pre>
  </div>
  <p style="font-size:12px;color:#999"><a href="${briefUrl}">Brief JSON</a></p>
</div>`;

  await sendEmail(nino, subject, html);
}

async function sendDeliveryEmail(brief, siteUrl) {
  const subject = `Votre site est en ligne — ${brief.bien}`;
  const html = `
<div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;color:#333">
  <div style="background:#121010;padding:32px;border-radius:12px">
    <h1 style="color:#c4956a;font-size:24px;margin:0 0 8px">Votre site est prêt !</h1>
    <p style="color:#fff;opacity:.7;margin:0">${brief.bien} — ${brief.localisation}</p>
  </div>
  <div style="padding:24px 0">
    <p style="color:#555">Bonjour ${brief.nom},</p>
    <p style="color:#555">Votre site de réservation directe est maintenant en ligne et prêt à recevoir vos premiers visiteurs.</p>
    <div style="text-align:center;margin:32px 0">
      <a href="${siteUrl}" style="display:inline-block;background:#c4956a;color:#121010;font-weight:600;padding:14px 32px;border-radius:10px;text-decoration:none;font-size:16px">Voir mon site</a>
    </div>
    <h2 style="font-size:16px;color:#121010">Ce qui est inclus</h2>
    <ul style="color:#555;line-height:1.8">
      <li>Design sur-mesure adapté à votre bien</li>
      <li>Réservation directe sans commission</li>
      <li>Optimisé mobile et tablette</li>
      <li>Référencement Google (SEO)</li>
    </ul>
    <p style="color:#555;margin-top:16px">N'hésitez pas à partager ce lien sur vos réseaux sociaux pour recevoir des réservations en direct.</p>
    <p style="color:#666;margin-top:24px;font-size:14px">
      Une question ? Répondez directement à cet email ou contactez-moi sur
      <a href="https://wa.me/262693120918" style="color:#c4956a">WhatsApp</a>.
    </p>
  </div>
</div>`;

  await sendEmail(brief.email, subject, html);
}

async function sendBriefCompletionRequest(brief, missingLabels) {
  const briefLink = `https://porphyre.studio/brief/${brief.brief_id}`;
  const subject = `Complétez votre brief — ${brief.bien}`;
  const html = `
<div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;color:#333">
  <div style="background:#121010;padding:32px;border-radius:12px">
    <h1 style="color:#c4956a;font-size:24px;margin:0 0 8px">Bonjour ${brief.nom},</h1>
    <p style="color:#fff;opacity:.7;margin:0">Il manque quelques informations pour créer votre site.</p>
  </div>
  <div style="padding:24px 0">
    <p style="color:#555">Pour que je puisse démarrer la création de votre site <strong>${brief.bien}</strong>, j'ai besoin de :</p>
    <ul style="color:#555;line-height:1.8">
      ${missingLabels.map((m) => `<li>${m}</li>`).join("")}
    </ul>
    <div style="text-align:center;margin:32px 0">
      <a href="${briefLink}" style="display:inline-block;background:#c4956a;color:#121010;font-weight:600;padding:14px 32px;border-radius:10px;text-decoration:none;font-size:16px">Compléter mon brief</a>
    </div>
    <p style="color:#999;font-size:13px;text-align:center">Ça prend 2 minutes. Votre site sera lancé dès réception.</p>
    <p style="color:#666;margin-top:24px;font-size:14px">
      Une question ? Répondez directement à cet email ou contactez-moi sur
      <a href="https://wa.me/262693120918" style="color:#c4956a">WhatsApp</a>.
    </p>
  </div>
</div>`;

  await sendEmail(brief.email, subject, html);
}

module.exports = {
  sendEmail,
  sendClientConfirmation,
  sendNinoNotification,
  sendDeliveryEmail,
  sendBriefCompletionRequest,
};
