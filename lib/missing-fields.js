const { OFFRES } = require("./offres");

function getMissingFields(brief) {
  const missing = [];
  const offre = OFFRES[brief.offre];

  if (!brief.photos || !brief.photos.length) missing.push("photos");
  if (!brief.description) missing.push("description");
  if (!brief.lien_airbnb) missing.push("lien_airbnb");

  if (offre && offre.hasTechnique) {
    if (!brief.lien_ical && !brief.ical) missing.push("lien_ical");
    if (!brief.stripe_pk && !brief.stripe_sk && !brief.stripe_account)
      missing.push("stripe_keys");
    if (!brief.domaine && !brief.pas_de_domaine) missing.push("domaine");
  }

  return missing;
}

const FIELD_LABELS = {
  photos: "Photos du bien",
  description: "Description du bien",
  lien_airbnb: "Lien Airbnb",
  lien_ical: "Lien calendrier iCal",
  stripe_keys: "Clés Stripe",
  domaine: "Nom de domaine",
};

module.exports = { getMissingFields, FIELD_LABELS };
