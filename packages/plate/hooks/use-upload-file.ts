import * as React from 'react';

import { toast } from 'sonner';
import { z } from 'zod';

export type UploadedFile = {
  appUrl?: string;
  key: string;
  name: string;
  size: number;
  type: string;
  url: string;
};

interface UseUploadFileProps {
  onUploadComplete?: (file: UploadedFile) => void;
  onUploadError?: (error: unknown) => void;
}

export function useUploadFile({
  onUploadComplete,
  onUploadError,
}: UseUploadFileProps = {}) {
  const [uploadedFile, setUploadedFile] = React.useState<UploadedFile>();
  const [uploadingFile, setUploadingFile] = React.useState<File>();
  const [progress, setProgress] = React.useState<number>(0);
  const [isUploading, setIsUploading] = React.useState(false);

  async function uploadToPlone(file: File) {
    setIsUploading(true);
    setUploadingFile(file);
    setProgress(10);

    try {
      const uploaded = await uploadFileToPlone(file, setProgress);

      setUploadedFile(uploaded);
      onUploadComplete?.(uploaded);
      setProgress(100);

      return uploaded;
    } catch (error) {
      showErrorToast(error);

      onUploadError?.(error);
      return undefined;
    } finally {
      setProgress(0);
      setIsUploading(false);
      setUploadingFile(undefined);
    }
  }

  return {
    isUploading,
    progress,
    uploadedFile,
    uploadFile: uploadToPlone,
    uploadingFile,
  };
}

/**
 * Creates an Image (or File) content item from `file` in the content being
 * edited, and returns its URLs. Throws when the upload fails.
 */
export async function uploadFileToPlone(
  file: File,
  onProgress?: (progress: number) => void,
): Promise<UploadedFile> {
  const contentPath = getCurrentContentPath();
  const endpoint =
    contentPath === '/' ? '/@createContent' : `/@createContent${contentPath}`;

  onProgress?.(40);

  const response = await fetch(endpoint, {
    method: 'POST',
    credentials: 'include',
    body: buildCreateContentFormData(file),
  });

  if (!response.ok) {
    const errorPayload = await parseJsonSafe(response);
    throw new Error(
      getServerErrorMessage(errorPayload) ??
        `Upload failed with status ${response.status}`,
    );
  }

  const createdItem = await response.json();

  onProgress?.(90);

  return createUploadedFile(file, createdItem);
}

// The file is sent as a multipart/form-data part named after its field,
// next to a `data` part with the JSON payload.
function buildCreateContentFormData(file: File) {
  const binaryFieldName = isImageFile(file) ? 'image' : 'file';
  const contentType = binaryFieldName === 'image' ? 'Image' : 'File';

  const formData = new FormData();
  formData.append(
    'data',
    JSON.stringify({ '@type': contentType, title: file.name }),
  );
  formData.append(binaryFieldName, file);

  return formData;
}

function createUploadedFile(
  file: File,
  createdItem: Record<string, unknown>,
): UploadedFile {
  const id = String(createdItem?.['@id'] ?? '');
  const baseId = id.replace(/\/$/, '');
  const isImage = isImageFile(file);
  const url = isImage
    ? `${baseId}/@@images/image`
    : `${baseId}/@@download/file`;

  return {
    appUrl: baseId,
    key: String(createdItem?.UID ?? baseId ?? file.name),
    name: String(createdItem?.title ?? file.name),
    size: file.size,
    type: file.type,
    url,
  };
}

export function isImageFile(file: File) {
  if (file.type?.startsWith('image/')) return true;

  const lowerName = file.name.toLowerCase();
  return /\.(png|jpe?g|gif|webp|bmp|svg|avif|tiff?)$/.test(lowerName);
}

async function parseJsonSafe(response: Response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function getServerErrorMessage(errorPayload: any) {
  if (!errorPayload) return null;

  const message = errorPayload?.message ?? errorPayload?.data?.message;
  if (typeof message === 'string') return message;

  const nested = errorPayload?.error?.message;
  if (typeof nested === 'string') return nested;

  return null;
}

function getCurrentContentPath() {
  if (typeof window === 'undefined') return '/';

  let path = window.location.pathname || '/';

  path = path.replace(/^\/@@edit(\/|$)/, '/');
  path = path.replace(/\/@@edit(?:\/.*)?$/, '');

  if (!path.startsWith('/')) {
    path = `/${path}`;
  }

  if (path.length > 1 && path.endsWith('/')) {
    path = path.slice(0, -1);
  }

  return path || '/';
}

export function getErrorMessage(err: unknown) {
  const unknownError = 'Something went wrong, please try again later.';

  if (err instanceof z.ZodError) {
    const errors = err.issues.map((issue) => {
      return issue.message;
    });

    return errors.join('\n');
  } else if (err instanceof Error) {
    return err.message;
  } else {
    return unknownError;
  }
}

export function showErrorToast(err: unknown) {
  const errorMessage = getErrorMessage(err);

  return toast.error(
    errorMessage.length > 0
      ? errorMessage
      : 'Something went wrong, please try again later.',
  );
}
