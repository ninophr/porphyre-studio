/* Generates HTML previews of all transactional emails into .email-previews/.
   Run: node scripts/preview-emails.js */
const fs = require("fs");
const path = require("path");

const emails = require("../lib/emails");

const outDir = path.join(__dirname, "..", ".email-previews");
fs.mkdirSync(outDir, { recursive: true });

const captured = [];
const realFetch = global.fetch;
global.fetch = async (_url, opts) => {
  const body = JSON.parse(opts.body);
  captured.push({ subject: body.subject, html: body.html });
  return { ok: true, json: async () => ({ id: "preview" }) };
};
process.env.RESEND_API_KEY = "preview";
process.env.CONTACT_EMAIL = "contact@ninoporphyre.fr";

const fakeBrief = {
  nom: "Marie Dupont",
  email: "marie@example.com",
  telephone: "+33 6 12 34 56 78",
  bien: "Villa des Palmes",
  localisation: "Saint-Gilles-les-Bains, La Réunion",
  type_bien: "Villa avec piscine",
  offre: "complet",
  preset: "tropical",
  brief_id: "brf_abc123",
  description:
    "Villa contemporaine avec vue mer, piscine chauffée, jardin tropical.\nIdéale pour familles et groupes jusqu'à 8 personnes.",
  lien_airbnb: "https://airbnb.com/rooms/12345",
  domaine: "villa-des-palmes.fr",
  photos: [],
};

async function run() {
  const jobs = [
    [
      "1-client-confirmation.html",
      () => emails.sendClientConfirmation(fakeBrief),
    ],
    [
      "2-nino-notification.html",
      () =>
        emails.sendNinoNotification(
          fakeBrief,
          "https://porphyre.studio/brief/brf_abc123",
          79000,
        ),
    ],
    [
      "3-delivery.html",
      () => emails.sendDeliveryEmail(fakeBrief, "https://villa-des-palmes.fr"),
    ],
    [
      "4-brief-completion.html",
      () =>
        emails.sendBriefCompletionRequest(fakeBrief, [
          "Photos du bien",
          "Description complète",
          "Lien iCal Airbnb",
        ]),
    ],
  ];

  for (const [filename, fn] of jobs) {
    captured.length = 0;
    await fn();
    const { html, subject } = captured[0];
    fs.writeFileSync(path.join(outDir, filename), html);
    console.log(`✓ ${filename}  —  ${subject}`);
  }

  global.fetch = realFetch;
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
