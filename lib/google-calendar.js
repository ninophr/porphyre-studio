const crypto = require("crypto");

function base64url(input) {
  const buf = typeof input === "string" ? Buffer.from(input) : input;
  return buf
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

async function getServiceAccountToken() {
  const now = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payload = base64url(
    JSON.stringify({
      iss: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      scope: "https://www.googleapis.com/auth/calendar",
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
    }),
  );
  const key = (process.env.GOOGLE_PRIVATE_KEY || "").replace(/\\n/g, "\n");
  const signature = crypto.sign(
    "SHA256",
    Buffer.from(`${header}.${payload}`),
    key,
  );
  const jwt = `${header}.${payload}.${base64url(signature)}`;
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });
  const json = await res.json();
  if (!json.access_token)
    throw new Error(`Token error: ${JSON.stringify(json)}`);
  return json.access_token;
}

async function createCalendarEvent({
  summary,
  description,
  date,
  time,
  durationMinutes,
}) {
  const accessToken = await getServiceAccountToken();
  const calendarId = process.env.GOOGLE_CALENDAR_ID || "primary";
  const duration = durationMinutes || 30;
  const [h, m] = time.split(":").map(Number);
  const endMin = m + duration;
  const endH = h + Math.floor(endMin / 60);
  const endM = endMin % 60;
  const event = {
    summary,
    description,
    start: {
      dateTime: `${date}T${time}:00`,
      timeZone: "Indian/Reunion",
    },
    end: {
      dateTime: `${date}T${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}:00`,
      timeZone: "Indian/Reunion",
    },
    reminders: {
      useDefault: false,
      overrides: [{ method: "popup", minutes: 30 }],
    },
  };
  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(event),
    },
  );
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Calendar API ${res.status}: ${body}`);
  }
}

module.exports = { createCalendarEvent };
