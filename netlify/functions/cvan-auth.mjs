import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

const SESSION_COOKIE = "cvan_teacher_session";
const SESSION_MAX_AGE = 2 * 60 * 60 * 1000;

function json(body, status = 200, headers = {}) {
  return Response.json(body, {
    status,
    headers: { "Cache-Control": "no-store, max-age=0", Pragma: "no-cache", ...headers },
  });
}

function equalSecret(candidate, expected) {
  const a = Buffer.from(String(candidate || ""), "utf8");
  const b = Buffer.from(String(expected || ""), "utf8");
  return a.length > 0 && a.length === b.length && timingSafeEqual(a, b);
}

function sameOrigin(request) {
  const origin = request.headers.get("origin");
  if (!origin || origin !== new URL(request.url).origin) return false;
  return request.headers.get("sec-fetch-site") !== "cross-site";
}

function cookie(request, maxAge) {
  const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAge}${secure}`;
}

function createSession(secret) {
  const expires = String(Date.now() + SESSION_MAX_AGE);
  const nonce = randomBytes(24).toString("base64url");
  const payload = `${expires}.${nonce}`;
  const signature = createHmac("sha256", secret).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

export default async function cvanAuth(request) {
  if (request.method !== "POST") return json({ error: "Méthode non autorisée." }, 405);
  if (!sameOrigin(request)) return json({ error: "Requête refusée." }, 403);

  try {
    const raw = await request.text();
    if (raw.length > 4_000) return json({ error: "Requête invalide." }, 413);
    const body = JSON.parse(raw || "{}");

    if (body.action === "logout") {
      return json({ authenticated: false }, 200, { "Set-Cookie": cookie(request, 0) });
    }

    if (body.action !== "login") return json({ error: "Action inconnue." }, 404);
    const expected = process.env.CVAN_TEACHER_PASSWORD;
    if (!expected) return json({ error: "Configurez CVAN_TEACHER_PASSWORD dans les variables Netlify." }, 503);
    if (!equalSecret(body.password, expected)) return json({ error: "Mot de passe incorrect." }, 401);

    const session = createSession(expected);
    const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";
    const setCookie = `${SESSION_COOKIE}=${session}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${Math.floor(SESSION_MAX_AGE / 1000)}${secure}`;
    return json({ authenticated: true }, 200, { "Set-Cookie": setCookie });
  } catch {
    return json({ error: "Requête invalide." }, 400);
  }
}

export const config = {
  path: "/.netlify/functions/cvan-auth",
  rateLimit: {
    windowLimit: 5,
    windowSize: 60,
    aggregateBy: ["ip", "domain"],
  },
};
