import { supabase } from "../supabaseClient";

export async function getSignedUrlIfNeeded(pathOrUrl, options = {}) {
  const { bucket = "activos", expiresIn = 900 } = options;
  if (!pathOrUrl) return "";

  // If it's already an absolute URL, return as-is
  if (/^https?:\/\//i.test(pathOrUrl) || pathOrUrl.startsWith("data:")) {
    return pathOrUrl;
  }

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
        .createSignedUrl(objPath, expiresIn);
      if (!sErr && sData?.signedUrl) return sData.signedUrl;
      const { data: pData } = supabase.storage.from(bkt).getPublicUrl(objPath);
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


