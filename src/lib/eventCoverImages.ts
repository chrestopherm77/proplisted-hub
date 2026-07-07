import { supabase } from '@/integrations/supabase/client';

const PUBLIC_OBJECT_MARKER = '/storage/v1/object/public/';

type StorageUrlParts = {
  bucket: string;
  path: string;
};

export const getStorageUrlParts = (url: string | null | undefined): StorageUrlParts | null => {
  if (!url) return null;

  try {
    const parsed = new URL(url);
    const markerIndex = parsed.pathname.indexOf(PUBLIC_OBJECT_MARKER);
    if (markerIndex === -1) return null;

    const objectPath = parsed.pathname.slice(markerIndex + PUBLIC_OBJECT_MARKER.length);
    const [bucket, ...pathParts] = objectPath.split('/');
    if (!bucket || pathParts.length === 0) return null;

    return {
      bucket,
      path: decodeURIComponent(pathParts.join('/')),
    };
  } catch {
    return null;
  }
};

export const isPrivateEventCoverUrl = (url: string | null | undefined) => {
  return getStorageUrlParts(url)?.bucket === 'event-covers';
};

export const resolveEventCoverUrl = async (url: string | null | undefined) => {
  if (!url) return '';

  const parts = getStorageUrlParts(url);
  if (parts?.bucket !== 'event-covers') return url;

  const { data, error } = await supabase.storage
    .from(parts.bucket)
    .createSignedUrl(parts.path, 60 * 60 * 24 * 7);

  if (error || !data?.signedUrl) return url;
  return data.signedUrl;
};