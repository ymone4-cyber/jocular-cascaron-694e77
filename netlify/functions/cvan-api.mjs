import { createHmac, timingSafeEqual } from "node:crypto";
import { getStore } from "@netlify/blobs";

const assessments = getStore("cvan-assessments");
const attempts = getStore("cvan-attempts");
const settings = getStore("cvan-settings");
const files = getStore("cvan-private-files");

class ApiError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

const json = (body, status = 200) => Response.json(body, {
  status,
  headers: { "Cache-Control": "no-store, max-age=0", "Pragma": "no-cache" },
});

const SESSION_COOKIE = "cvan_teacher_session";
const SESSION_MAX_AGE = 2 * 60 * 60 * 1000;

function cookieValue(request, name) {
  const cookie = request.headers.get("cookie") || "";
  for (const part of cookie.split(";")) {
    const separator = part.indexOf("=");
    if (separator < 0) continue;
    if (part.slice(0, separator).trim() === name) return part.slice(separator + 1).trim();
  }
  return "";
}

function sameOrigin(request) {
  const origin = request.headers.get("origin");
  if (!origin || origin !== new URL(request.url).origin) throw new ApiError("Requête refusée.", 403);
  if (request.headers.get("sec-fetch-site") === "cross-site") throw new ApiError("Requête refusée.", 403);
}

function validTeacherSession(request) {
  const secret = process.env.CVAN_TEACHER_PASSWORD;
  if (!secret) return false;
  const token = cookieValue(request, SESSION_COOKIE);
  const parts = token.split(".");
  if (parts.length !== 3 || !/^\d{13}$/.test(parts[0]) || !/^[A-Za-z0-9_-]{20,80}$/.test(parts[1])) return false;
  const expires = Number(parts[0]);
  if (expires <= Date.now() || expires > Date.now() + SESSION_MAX_AGE + 30_000) return false;
  const expected = createHmac("sha256", secret).update(parts[0] + "." + parts[1]).digest();
  let signature;
  try { signature = Buffer.from(parts[2], "base64url"); } catch { return false; }
  return signature.length === expected.length && timingSafeEqual(signature, expected);
}

function requireTeacher(request) {
  const expected = process.env.CVAN_TEACHER_PASSWORD;
  if (!expected) throw new ApiError("Configurez CVAN_TEACHER_PASSWORD dans les variables Netlify avec le même mot de passe enseignant.", 503);
  sameOrigin(request);
  if (!validTeacherSession(request)) throw new ApiError("Session expirée. Déverrouillez de nouveau l’espace enseignant.", 401);
}

function validId(value) {
  return typeof value === "string" && /^[a-zA-Z0-9_-]{8,80}$/.test(value);
}

function publicAssessment(record) {
  return {
    id: record.id,
    title: record.title,
    description: record.description || "",
    questions: record.questions,
    createdAt: record.createdAt,
  };
}

async function read(store, key) {
  return store.get(key, { type: "json" });
}

async function write(store, key, value) {
  await store.set(key, JSON.stringify(value));
  return value;
}

async function list(store) {
  const result = await store.list({});
  const rows = await Promise.all((result.blobs || []).map((entry) => read(store, entry.key)));
  return rows.filter(Boolean);
}

async function deleteAll(store) {
  const result = await store.list({});
  await Promise.all((result.blobs || []).map((entry) => store.delete(entry.key)));
}

function fileKey(id, kind, chunk) {
  return `${id}-${kind}-${chunk}`;
}

async function removeAssessmentFiles(record) {
  if (!record) return;
  const jobs = [];
  for (const kind of ["exercise", "correction"]) {
    const count = Math.min(16, Math.max(0, Number(record[kind + "Chunks"]) || 0));
    for (let chunk = 0; chunk < count; chunk++) jobs.push(files.delete(fileKey(record.id, kind, chunk)));
  }
  await Promise.all(jobs);
}

async function handle(request, body) {
  const action = body.action;

  if (action === "ping") return json({ shared: true });

  if (action === "active-public") {
    const id = (await settings.get("active-assessment")) || "";
    const record = id ? await read(assessments, id) : null;
    return json({ id: record ? id : "", assessment: record ? publicAssessment(record) : null });
  }

  if (action === "teacher-config") {
    requireTeacher(request);
    return json({ value: await read(settings, "teacher-auth") });
  }

  if (action === "get") {
    const { store, key } = body;
    if (store === "settings" && key === "teacher-auth") {
      const config = await read(settings, "teacher-auth");
      return json({ value: config ? { publicKey: config.publicKey } : null });
    }
    if (store === "settings" && key === "eye-theme") {
      requireTeacher(request);
      return json({ value: await read(settings, "eye-theme") });
    }
    if (store === "assessments" && validId(key)) {
      const activeId = (await settings.get("active-assessment")) || "";
      const record = await read(assessments, key);
      if (!record) return json({ value: null });
      if (validTeacherSession(request)) {
        sameOrigin(request);
        return json({ value: record });
      }
      if (key !== activeId) return json({ error: "Évaluation indisponible." }, 404);
      return json({ value: publicAssessment(record) });
    }
    requireTeacher(request);
    if (store === "attempts" && validId(key)) return json({ value: await read(attempts, key) });
    throw new ApiError("Lecture non autorisée.", 403);
  }

  if (action === "all") {
    requireTeacher(request);
    if (body.store === "assessments") return json({ values: await list(assessments) });
    if (body.store === "attempts") return json({ values: await list(attempts) });
    throw new ApiError("Collection inconnue.");
  }

  if (action === "put") {
    requireTeacher(request);
    const value = body.value;
    if (body.store === "settings" && value && value.key === "teacher-auth") {
      return json({ value: await write(settings, "teacher-auth", value) });
    }
    if (body.store === "settings" && value && value.key === "eye-theme" && ["goku", "naruto", "minato", "kyubi"].includes(value.theme)) {
      return json({ value: await write(settings, "eye-theme", value) });
    }
    if (body.store === "assessments" && value && validId(value.id) && Array.isArray(value.questions) && value.questions.length <= 300) {
      return json({ value: await write(assessments, value.id, value) });
    }
    if (body.store === "attempts" && value && validId(value.id) && validId(value.assessmentId)) {
      return json({ value: await write(attempts, value.id, value) });
    }
    throw new ApiError("Enregistrement invalide.");
  }

  if (action === "submit-attempt") {
    const record = body.record;
    if (!record || !validId(record.id) || !validId(record.assessmentId)) throw new ApiError("Copie invalide.");
    const activeId = (await settings.get("active-assessment")) || "";
    if (!activeId || record.assessmentId !== activeId) throw new ApiError("Aucune évaluation active ne correspond à cette copie.", 409);
    const size = JSON.stringify(record).length;
    if (size > 900_000 || !record.cipher || !record.wrappedKey) throw new ApiError("Copie trop volumineuse ou incomplète.", 413);
    await write(attempts, record.id, record);
    return json({ saved: true });
  }

  if (action === "set-active") {
    requireTeacher(request);
    const id = body.id || "";
    if (id && (!validId(id) || !(await read(assessments, id)))) throw new ApiError("Évaluation introuvable.", 404);
    await settings.set("active-assessment", id);
    return json({ id });
  }

  if (action === "file-put") {
    requireTeacher(request);
    const { id, kind, chunk, data } = body;
    if (!validId(id) || !["exercise", "correction"].includes(kind) || !Number.isInteger(chunk) || chunk < 0 || chunk > 15 || typeof data !== "string" || data.length > 2_900_000 || !/^[A-Za-z0-9+/]*={0,2}$/.test(data)) throw new ApiError("Fragment PDF invalide.", 413);
    await files.set(fileKey(id, kind, chunk), Buffer.from(data, "base64"));
    return json({ saved: true });
  }

  if (action === "file-get") {
    requireTeacher(request);
    const { id, kind, chunk } = body;
    if (!validId(id) || !["exercise", "correction"].includes(kind) || !Number.isInteger(chunk) || chunk < 0 || chunk > 15) throw new ApiError("Document introuvable.", 404);
    const value = await files.get(fileKey(id, kind, chunk), { type: "arrayBuffer" });
    if (!value) throw new ApiError("Fragment PDF introuvable.", 404);
    return json({ data: Buffer.from(value).toString("base64") });
  }

  if (action === "delete") {
    requireTeacher(request);
    if (body.store === "assessments" && validId(body.key)) {
      const record = await read(assessments, body.key);
      await removeAssessmentFiles(record);
      await assessments.delete(body.key);
      const copies = await list(attempts);
      await Promise.all(copies.filter((copy) => copy.assessmentId === body.key).map((copy) => attempts.delete(copy.id)));
      if ((await settings.get("active-assessment")) === body.key) await settings.set("active-assessment", "");
      return json({ deleted: true });
    }
    if (body.store === "attempts" && validId(body.key)) {
      await attempts.delete(body.key);
      return json({ deleted: true });
    }
    throw new ApiError("Suppression non autorisée.", 403);
  }

  if (action === "clear") {
    requireTeacher(request);
    await Promise.all([deleteAll(assessments), deleteAll(attempts), deleteAll(settings), deleteAll(files)]);
    return json({ cleared: true });
  }

  throw new ApiError("Action inconnue.", 404);
}

export default async function cvanApi(request) {
  if (request.method !== "POST") return json({ error: "Méthode non autorisée." }, 405);
  try {
    const raw = await request.text();
    if (raw.length > 5_500_000) throw new ApiError("Requête trop volumineuse.", 413);
    const body = JSON.parse(raw);
    return await handle(request, body);
  } catch (error) {
    const status = error instanceof ApiError ? error.status : 500;
    return json({ error: error.message || "Erreur serveur." }, status);
  }
}
