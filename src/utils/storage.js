import { supabase } from "../supabaseClient";

export function normalizeStoragePath(pathOrUrl, bucket = "activos") {
  if (!pathOrUrl) return "";
  // Absolute non-supabase or data URLs are left as-is for display, but for DB we store relative
  if (/^data:/i.test(pathOrUrl)) return pathOrUrl;
  try {
    if (/^https?:\/\//i.test(pathOrUrl)) {
      const u = new URL(pathOrUrl);
      const isSupabase = /\.supabase\.co$/i.test(u.hostname) && u.pathname.includes('/storage/v1/object/');
      if (!isSupabase) return pathOrUrl;
      const parts = u.pathname.split('/');
      const idx = parts.findIndex(p => p === 'object');
      const bucketFromUrl = parts[idx + 2] || '';
      const objectFromUrl = parts.slice(idx + 3).join('/');
      // If bucket matches or not, always store object path relative to bucket
      return objectFromUrl.replace(/^\/+/, '');
    }
  } catch (_) { /* ignore parse errors */ }

  // Relative forms: strip bucket/public prefixes
  let raw = String(pathOrUrl).trim();
  raw = raw.replace(/^\/+/, "");
  if (raw.startsWith("public/")) raw = raw.slice("public/".length);
  if (raw.startsWith("storage/v1/object/public/")) raw = raw.slice("storage/v1/object/public/".length);
  if (raw.startsWith(`${bucket}/`)) raw = raw.slice(`${bucket}/`.length);
  return raw;
}

export async function getSignedUrlIfNeeded(pathOrUrl, options = {}) {
  const { bucket = "activos", expiresIn = 900, transform } = options;
  if (!pathOrUrl) return "";

  // If it's an absolute URL but it's a Supabase Storage URL, parse it and try to
  // resolve again (esto permite migraciones de bucket p.ej. 'assets' -> 'activos').
  // Para cualquier otra URL externa o data:, devolver tal cual.
  if (/^https?:\/\//i.test(pathOrUrl)) {
    try {
      const u = new URL(pathOrUrl);
      const isSupabase = /\.supabase\.co$/i.test(u.hostname) && u.pathname.includes('/storage/v1/object/');
      if (isSupabase) {
        // Extraer bucket y objeto del path: /storage/v1/object/(public|sign)/<bucket>/<obj>
        const parts = u.pathname.split('/');
        const idx = parts.findIndex(p => p === 'object');
        const bucketFromUrl = parts[idx + 2] || '';
        const objectFromUrl = parts.slice(idx + 3).join('/');
        // Reintentar resolución usando nuestra lógica de candidatos (debajo)
        pathOrUrl = `${bucketFromUrl}/${objectFromUrl}`;
      } else {
        return pathOrUrl;
      }
    } catch (_) {
      return pathOrUrl;
    }
  }
  if (String(pathOrUrl).startsWith("data:")) return pathOrUrl;

  // Normalize various storage path shapes to objectPath inside the bucket
  // Accept examples:
  //  - "activos/foto.png"
  //  - "/activos/foto.png"
  //  - "public/activos/foto.png"
  //  - "/public/activos/foto.png"
  let raw = String(pathOrUrl).trim();
  raw = raw.replace(/^\/+/, ""); // remove leading '/'
  if (raw.startsWith("public/")) raw = raw.slice("public/".length);
  if (raw.startsWith("storage/v1/object/public/")) {
    raw = raw.slice("storage/v1/object/public/".length);
  }
  if (raw.startsWith("/storage/v1/object/public/")) {
    raw = raw.slice("/storage/v1/object/public/".length);
  }
  // Helper to try resolving against a concrete bucket + path
  const tryResolve = async (bkt, objPath) => {
    try {
      const { data: sData, error: sErr } = await supabase.storage
        .from(bkt)
        .createSignedUrl(objPath, expiresIn, transform ? { transform } : undefined);
      if (!sErr && sData?.signedUrl) return sData.signedUrl;
      const { data: pData } = supabase.storage.from(bkt).getPublicUrl(objPath, transform ? { transform } : undefined);
      if (pData?.publicUrl) return pData.publicUrl;
    } catch (_) { /* ignore */ }
    return "";
  };

  // Candidate buckets and paths to try
  const candidates = [];
  const defaultBucketPrefix = `${bucket}/`;
  const objInDefault = raw.startsWith(defaultBucketPrefix) ? raw.slice(defaultBucketPrefix.length) : raw;
  candidates.push([bucket, objInDefault]);

  // If the first segment looks like a bucket name, try it too
  const firstSeg = raw.split('/')[0] || '';
  if (firstSeg && firstSeg !== 'public' && firstSeg !== 'storage' && firstSeg !== bucket) {
    candidates.push([firstSeg, raw.slice(firstSeg.length + 1)]);
  }

  // If the raw came as storage public path: storage/v1/object/public/<b>/<obj>
  const storagePublicMatch = raw.match(/^storage\/v1\/object\/public\/([^/]+)\/(.+)$/);
  if (storagePublicMatch) {
    candidates.unshift([storagePublicMatch[1], storagePublicMatch[2]]);
  }

  for (const [bkt, objPath] of candidates) {
    const url = await tryResolve(bkt, objPath);
    if (url) return url;
  }

  if (import.meta?.env?.DEV) {
    // eslint-disable-next-line no-console
    console.warn('[Storage] No se pudo resolver URL para', pathOrUrl, 'candidatos:', candidates);
  }
  return "";
}

export function isStoragePath(value) {
  return !!value && !/^https?:\/\//i.test(value) && !value.startsWith("data:");
}

// Devuelve una URL pública transformada (thumbnail servido por el CDN de Supabase)
// No hace round-trip de firma y reduce drásticamente el peso para listas
export function getThumbnailPublicUrl(pathOrUrl, { bucket = "activos", width = 240, quality = 70, resize = "cover" } = {}) {
  if (!pathOrUrl) return "";
  try {
    // Normalizar como objeto dentro del bucket
    let raw = String(pathOrUrl).trim();
    raw = raw.replace(/^\/+/, "");
    if (raw.startsWith("public/")) raw = raw.slice("public/".length);
    if (raw.startsWith(`storage/v1/object/public/`)) raw = raw.slice(`storage/v1/object/public/`.length);
    if (raw.startsWith(`${bucket}/`)) raw = raw.slice(`${bucket}/`.length);

    const { data } = supabase.storage.from(bucket).getPublicUrl(raw, {
      transform: { width, quality, resize }
    });
    return data?.publicUrl || "";
  } catch (_) {
    return "";
  }
}


