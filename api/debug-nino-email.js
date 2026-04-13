// Temp debug — returns the rendered Nino email HTML from the deployed lib
const { sendNinoNotification } = require("../lib/emails");

module.exports = async (req, res) => {
  let captured = null;
  const origFetch = global.fetch;
  global.fetch = async (url, opts) => {
    if (typeof url === "string" && url.includes("resend.com")) {
      captured = JSON.parse(opts.body);
      return { ok: true, text: async () => "captured" };
    }
    return origFetch(url, opts);
  };

  const brief = {
    nom: "DEBUG",
    email: "debug@porphyre.studio",
    telephone: "+262 000 00 00 00",
    bien: "DEBUG VILLA",
    localisation: "DEBUG LOC",
    type_bien: "Villa",
    offre: "reservation",
    description: "debug",
  };

  try {
    await sendNinoNotification(
      brief,
      "https://debug.example/brief.json",
      89700,
    );
  } catch (e) {
    global.fetch = origFetch;
    res.status(500).json({ error: e.message });
    return;
  }
  global.fetch = origFetch;

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.status(200).send(captured ? captured.html : "NO HTML CAPTURED");
};
