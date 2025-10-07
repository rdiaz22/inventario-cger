import { supabase } from "../supabaseClient";

export async function getSignedUrlIfNeeded(pathOrUrl, options = {}) {
  const { bucket = "activos", expiresIn = 900 } = options;
  if (!pathOrUrl) return "";

  // If it's already an absolute URL, return as-is
  if (/^https?:\/\//i.test(pathOrUrl) || pathOrUrl.startsWith("data:")) {
    return pathOrUrl;
  }

  // Normalize when the value includes the bucket prefix (e.g. "activos/...")
  // or comes with a leading slash
  let objectPath = String(pathOrUrl).replace(/^\/+/, "");
  const bucketPrefix = `${bucket}/`;
  if (objectPath.startsWith(bucketPrefix)) {
    objectPath = objectPath.slice(bucketPrefix.length);
  }

  // Try signed URL first (for private buckets)
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(objectPath, expiresIn);

  if (error) {
    // Fallback to public URL (in case the bucket is public or objectPath mismatch)
    const { data: pub } = supabase.storage.from(bucket).getPublicUrl(objectPath);
    return pub?.publicUrl || "";
  }

  return data?.signedUrl || "";
}

export function isStoragePath(value) {
  return !!value && !/^https?:\/\//i.test(value) && !value.startsWith("data:");
}


