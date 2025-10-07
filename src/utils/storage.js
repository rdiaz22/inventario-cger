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
  const bucketPrefix = `${bucket}/`;
  let objectPath = raw.startsWith(bucketPrefix) ? raw.slice(bucketPrefix.length) : raw;

  // Try signed URL first (for private buckets)
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(objectPath, expiresIn);

  if (error) {
    // Fallbacks to public URL (in case the bucket is public or path mismatch)
    const { data: pub1 } = supabase.storage.from(bucket).getPublicUrl(objectPath);
    if (pub1?.publicUrl) return pub1.publicUrl;
    // Try original raw (might include bucket prefix)
    const { data: pub2 } = supabase.storage.from(bucket).getPublicUrl(raw.startsWith(bucketPrefix) ? raw.slice(bucketPrefix.length) : raw);
    if (pub2?.publicUrl) return pub2.publicUrl;
    if (import.meta?.env?.DEV) {
      // eslint-disable-next-line no-console
      console.warn('[Storage] No se pudo resolver URL para', pathOrUrl, '->', objectPath);
    }
    return "";
  }

  return data?.signedUrl || "";
}

export function isStoragePath(value) {
  return !!value && !/^https?:\/\//i.test(value) && !value.startsWith("data:");
}


