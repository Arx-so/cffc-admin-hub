// Script-based (no AI/ML) checks run against a newly uploaded video row.
// Each rule returns zero or more Flags; any flag keeps the video in the admin queue.

export interface Flag {
  code: string;
  message: string;
}

export interface MediaRecord {
  id: string;
  athlete_user_id: string;
  type: string;
  url: string;
  title: string | null;
  thumb_url: string | null;
  created_at: string;
}

export interface StorageObjectInfo {
  found: boolean;
  size: number | null;
  mimetype: string | null;
}

// -- Metadata sanity ---------------------------------------------------------

const MIN_VIDEO_BYTES = 100 * 1024; // 100 KB: anything smaller is almost certainly empty/broken
const MAX_VIDEO_BYTES = 500 * 1024 * 1024; // 500 MB

export function checkMetadata(record: MediaRecord, storage: StorageObjectInfo): Flag[] {
  const flags: Flag[] = [];

  if (!storage.found) {
    flags.push({ code: "file_not_found", message: "Arquivo não encontrado no storage" });
    return flags; // nothing else to check without the file
  }

  if (storage.size === null || storage.size === 0) {
    flags.push({ code: "file_empty", message: "Arquivo vazio ou tamanho desconhecido" });
  } else if (storage.size < MIN_VIDEO_BYTES) {
    flags.push({ code: "file_too_small", message: `Arquivo muito pequeno (${storage.size} bytes)` });
  } else if (storage.size > MAX_VIDEO_BYTES) {
    flags.push({ code: "file_too_large", message: `Arquivo maior que ${MAX_VIDEO_BYTES / (1024 * 1024)}MB` });
  }

  if (storage.mimetype && !storage.mimetype.startsWith("video/")) {
    flags.push({ code: "invalid_mime_type", message: `Tipo de arquivo inesperado: ${storage.mimetype}` });
  }

  if (!record.thumb_url) {
    flags.push({ code: "missing_thumbnail", message: "Vídeo sem thumbnail" });
  }

  return flags;
}

// -- Title / description text screening -------------------------------------

const URL_PATTERN = /https?:\/\/|www\.\S+/i;
const PHONE_PATTERN = /\(?\d{2}\)?\s?9?\d{4}-?\d{4}/;
const REPEATED_CHAR_PATTERN = /(.)\1{4,}/; // e.g. "!!!!!" or "aaaaa"
const SPAM_TERMS = [
  "clique aqui",
  "compre agora",
  "whatsapp",
  "chamar no zap",
  "promoção imperdível",
  "ganhe dinheiro",
  "renda extra",
  "inscreva-se no meu canal",
];
// Minimal starter blocklist; extend with a proper profanity/slur list before relying on this in prod.
const PROFANITY_TERMS: string[] = [];

function capsRatio(text: string): number {
  const letters = text.replace(/[^a-zA-Z]/g, "");
  if (letters.length < 8) return 0; // too short to judge
  const caps = letters.replace(/[^A-Z]/g, "");
  return caps.length / letters.length;
}

export function checkText(title: string | null): Flag[] {
  const flags: Flag[] = [];
  const trimmed = (title ?? "").trim();

  if (trimmed.length === 0) {
    flags.push({ code: "missing_title", message: "Vídeo sem título" });
    return flags;
  }
  if (trimmed.length < 3) {
    flags.push({ code: "title_too_short", message: "Título muito curto" });
  }
  if (trimmed.length > 150) {
    flags.push({ code: "title_too_long", message: "Título muito longo" });
  }
  if (URL_PATTERN.test(trimmed)) {
    flags.push({ code: "title_has_url", message: "Título contém link" });
  }
  if (PHONE_PATTERN.test(trimmed)) {
    flags.push({ code: "title_has_phone", message: "Título contém número de telefone" });
  }
  if (REPEATED_CHAR_PATTERN.test(trimmed)) {
    flags.push({ code: "title_repeated_chars", message: "Título com caracteres repetidos em excesso" });
  }
  if (capsRatio(trimmed) > 0.7) {
    flags.push({ code: "title_excessive_caps", message: "Título em caixa alta excessiva" });
  }
  const lower = trimmed.toLowerCase();
  for (const term of [...SPAM_TERMS, ...PROFANITY_TERMS]) {
    if (lower.includes(term)) {
      flags.push({ code: "title_suspicious_term", message: `Título contém termo suspeito: "${term}"` });
      break; // one hit is enough to flag
    }
  }

  return flags;
}

// -- Upload behavior (rate limiting / duplicates) ----------------------------

export const RATE_LIMIT_WINDOW_HOURS = 24;
export const RATE_LIMIT_MAX_UPLOADS = 5;
export const DUPLICATE_WINDOW_DAYS = 30;

export interface UploadHistoryInfo {
  uploadsInWindow: number;
  duplicateTitleFound: boolean;
  duplicateSizeFound: boolean;
}

export function checkUploadBehavior(history: UploadHistoryInfo): Flag[] {
  const flags: Flag[] = [];

  if (history.uploadsInWindow > RATE_LIMIT_MAX_UPLOADS) {
    flags.push({
      code: "upload_rate_exceeded",
      message: `Mais de ${RATE_LIMIT_MAX_UPLOADS} vídeos enviados nas últimas ${RATE_LIMIT_WINDOW_HOURS}h`,
    });
  }
  if (history.duplicateTitleFound) {
    flags.push({ code: "duplicate_title", message: "Já existe outro vídeo com o mesmo título deste atleta" });
  }
  if (history.duplicateSizeFound) {
    flags.push({ code: "duplicate_file_size", message: "Já existe outro vídeo com o mesmo tamanho de arquivo deste atleta" });
  }

  return flags;
}

export function evaluate(
  record: MediaRecord,
  storage: StorageObjectInfo,
  history: UploadHistoryInfo
): Flag[] {
  return [
    ...checkMetadata(record, storage),
    ...checkText(record.title),
    ...checkUploadBehavior(history),
  ];
}
