// TEMP endpoint — debug what lib/emails.js actually generates in prod
// Remove after verification.
const emails = require("../lib/emails");

module.exports = async (req, res) => {
  // Monkey-patch sendEmail to capture HTML instead of sending
  let captured = null;
  const origFetch = global.fetch;
  global.fetch = async (url, opts) => {
    if (String(url).includes("resend.com")) {
      const body = JSON.parse(opts.body);
      captured = body;
      return {
        ok: true,
        status: 200,
        text: async () => "",
        json: async () => ({}),
      };
    }
    return origFetch(url, opts);
  };

  // Force the module to "send"
  process.env.RESEND_API_KEY = process.env.RESEND_API_KEY || "debug";

  const brief = {
    id: "debug-marker-UNIQUE-12345",
    nom: "DEBUG",
    email: "debug@example.com",
    telephone: "+262 000",
    bien: "DEBUG-BIEN",
    localisation: "DEBUG-LOC",
    type_bien: "Villa",
    offre: "reservation",
    preset: "vitrine",
    description: "DEBUG-DESC",
  };

  const which = req.query.t || "client";
  try {
    if (which === "nino") {
      await emails.sendNinoNotification(brief, "https://debug/brief/x", 89700);
    } else {
      await emails.sendClientConfirmation(brief);
    }
  } finally {
    global.fetch = origFetch;
  }

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.status(200).send(captured ? captured.html : "NO_HTML_CAPTURED");
};
