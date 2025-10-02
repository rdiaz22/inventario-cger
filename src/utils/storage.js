import { supabase } from "../supabaseClient";

export async function getSignedUrlIfNeeded(pathOrUrl, options = {}) {
  const { bucket = "activos", expiresIn = 900 } = options;
  if (!pathOrUrl) return "";

  // If it's already an absolute URL, return as-is
  if (/^https?:\/\//i.test(pathOrUrl) || pathOrUrl.startsWith("data:")) {
    return pathOrUrl;
  }

  // Assume it's a storage path inside the bucket
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(pathOrUrl, expiresIn);

  if (error) {
    // Fallback to public URL (in case bucket still public during migration)
    const { data: pub } = supabase.storage.from(bucket).getPublicUrl(pathOrUrl);
    return pub?.publicUrl || "";
  }

  return data?.signedUrl || "";
}

export function isStoragePath(value) {
  return !!value && !/^https?:\/\//i.test(value) && !value.startsWith("data:");
}


