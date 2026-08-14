import { useCallback, useMemo, useRef, useState, type DragEvent } from 'react';
import { Button, DialogTrigger, Input } from '@plone/components/quanta';
import type { TextFieldProps as QuantaTextFieldProps } from '@plone/components/quanta';
import {
  BinIcon,
  ImageIcon,
  LinkIcon,
  NavigationIcon,
  UploadIcon,
} from '@plone/components/Icons';
import type { Brain } from '@plone/types';
import { Description, FieldError, Label } from '../Field/Field';
import { ObjectBrowserModal } from '../ObjectBrowserWidget/ObjectBrowserModal';
import {
  ObjectBrowserProvider,
  useObjectBrowserContext,
} from '../ObjectBrowserWidget/ObjectBrowserContext';
import { normalizeObjectBrowserPath } from '../ObjectBrowserWidget/utils';

type BaseFormFieldProps = Pick<
  QuantaTextFieldProps,
  'label' | 'description' | 'errorMessage' | 'placeholder'
>;

type NamedBlobImage = {
  'content-type': string;
  data: string;
  encoding: string;
  filename: string;
};

type ImageFieldValue = string | NamedBlobImage | null;

type ImageChangeExtras = {
  title?: string;
  image_field?: string;
  image_scales?: Record<string, unknown>;
};

type ImageInputChange = (
  id: string,
  value: ImageFieldValue,
  extras?: ImageChangeExtras,
) => void;

type ImageWidgetChange = (
  value: ImageFieldValue,
  extras?: ImageChangeExtras,
) => void;

type CommonImageInputProps = {
  className?: string;
  imageSize?: string;
  value?: unknown;
  defaultValue?: unknown;
  selected?: boolean;
  hideLinkPicker?: boolean;
  hideObjectBrowserPicker?: boolean;
  restrictFileUpload?: boolean;
  objectBrowserPickerType?: 'single' | 'multiple' | 'image';
  placeholderLinkInput?: string;
  onFocus?: () => void;
  uploadPath?: string;
  currentPath?: string;
  blobField?: boolean;
};

type ImageInputProps = CommonImageInputProps & {
  id: string;
  onChange: ImageInputChange;
};

type ImageWidgetProps = BaseFormFieldProps &
  CommonImageInputProps & {
    onChange?: ImageWidgetChange;
    error?: Array<unknown>;
    factory?: string;
    widget?: string;
  };

type CreateContentResponse = {
  '@id'?: string;
  title?: string;
  message?: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object';
}

function parseCreateContentResponse(value: unknown): CreateContentResponse {
  if (!isRecord(value)) return {};

  if (
    typeof value['@id'] === 'string' ||
    typeof value.title === 'string' ||
    typeof value.message === 'string'
  ) {
    return value as CreateContentResponse;
  }

  if (isRecord(value.data)) {
    return parseCreateContentResponse(value.data);
  }

  return {};
}

async function parseJsonSafe(response: Response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function blobDownloadUrl(value: Record<string, unknown>): string {
  if (typeof value['@id'] === 'string') return value['@id'];
  if (typeof value.download === 'string') return value.download;
  return '';
}

function namedBlobPreviewSrc(value: Record<string, unknown>): string {
  if (
    typeof value.data === 'string' &&
    typeof value['content-type'] === 'string'
  ) {
    return `data:${value['content-type']};base64,${value.data}`;
  }
  return blobDownloadUrl(value);
}

function normalizeImageValue(value: unknown): string {
  if (typeof value === 'string') return value;

  if (Array.isArray(value) && value[0] && isRecord(value[0])) {
    return namedBlobPreviewSrc(value[0]);
  }

  if (isRecord(value)) {
    return namedBlobPreviewSrc(value);
  }

  return '';
}

function isInternalUrl(url: string) {
  return url.startsWith('/');
}

function getPreviewSrc(url: string, imageSize: string) {
  if (!url) return '';
  if (url.startsWith('data:')) return url;
  return isInternalUrl(url) ? `${url}/@@images/image/${imageSize}` : url;
}

function getBasePath(path: string) {
  const cleanPath = path.split('?')[0].split('#')[0] || '/';
  const segments = cleanPath.split('/').filter(Boolean);

  if (segments.length <= 1) return '/';
  return `/${segments.slice(0, -1).join('/')}`;
}

function getEditPathFromUrl(pathname: string) {
  return normalizeObjectBrowserPath(pathname) || '/';
}

function readFileAsDataURL(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () =>
      reject(reader.error || new Error('File read failed'));
    reader.readAsDataURL(file);
  });
}

function parseDataUrl(dataUrl: string) {
  const match = dataUrl.match(/^data:(.*?);base64,(.*)$/);
  if (!match) return null;

  return {
    contentType: match[1],
    data: match[2],
  };
}

async function fetchExistingImageAsBlob(
  contentId: string,
  filename: string,
): Promise<NamedBlobImage | null> {
  const path = contentId.startsWith('/') ? contentId : `/${contentId}`;
  const response = await fetch(`${path}/@@download/image`, {
    credentials: 'include',
  });
  if (!response.ok) return null;

  const fileBlob = await response.blob();
  const contentType = fileBlob.type || 'image/jpeg';
  const file = new File([fileBlob], filename, { type: contentType });
  const dataUrl = await readFileAsDataURL(file);
  const parsed = parseDataUrl(dataUrl);
  if (!parsed) return null;

  return {
    data: parsed.data,
    encoding: 'base64',
    'content-type': parsed.contentType || contentType,
    filename,
  };
}

function ObjectBrowserButton({
  title,
  onBeforeOpen,
}: {
  title: string;
  onBeforeOpen?: () => void;
}) {
  const { open, setOpen } = useObjectBrowserContext();

  return (
    <DialogTrigger isOpen={open} onOpenChange={setOpen}>
      <Button
        aria-label={title}
        size="L"
        type="button"
        variant="icon"
        onPress={onBeforeOpen}
      >
        <NavigationIcon />
      </Button>
      <ObjectBrowserModal />
    </DialogTrigger>
  );
}

function ImageInputBase({
  className,
  imageSize = 'teaser',
  selected = true,
  hideLinkPicker = false,
  hideObjectBrowserPicker = false,
  restrictFileUpload = false,
  objectBrowserPickerType = 'single',
  placeholderLinkInput,
  onFocus,
  uploadPath,
  currentPath,
  value,
  defaultValue,
  blobField = false,
  onValueChange,
}: CommonImageInputProps & {
  onValueChange: (value: ImageFieldValue, extras?: ImageChangeExtras) => void;
}) {
  const resolvedValue = value !== undefined ? value : defaultValue;
  const imageValue = normalizeImageValue(resolvedValue);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string>('');
  const [linkValue, setLinkValue] = useState(
    typeof resolvedValue === 'string' ? resolvedValue : '',
  );
  const showObjectBrowser = !hideObjectBrowserPicker;
  const showLinkPicker = !hideLinkPicker && !blobField;

  const resolvedCurrentPath = useMemo(() => {
    const fallbackPath =
      typeof window !== 'undefined'
        ? getEditPathFromUrl(window.location.pathname)
        : '/';
    return currentPath || fallbackPath;
  }, [currentPath]);

  const resolvedUploadPath = useMemo(
    () => uploadPath || getBasePath(resolvedCurrentPath),
    [resolvedCurrentPath, uploadPath],
  );
  const uploadAction = useMemo(
    () =>
      resolvedUploadPath === '/'
        ? '/@createContent'
        : `/@createContent${resolvedUploadPath}`,
    [resolvedUploadPath],
  );
  const objectBrowserMode =
    objectBrowserPickerType === 'multiple' ? 'multiple' : 'single';

  const submitUpload = useCallback(
    async (file: File) => {
      if (!file || restrictFileUpload) return;
      if (!file.type.startsWith('image/')) {
        setUploadError('Please upload an image file');
        return;
      }

      setUploadError('');
      setIsUploading(true);

      try {
        const dataUrl = await readFileAsDataURL(file);
        const parsed = parseDataUrl(dataUrl);

        if (!parsed) {
          setUploadError('Could not parse the selected file');
          setIsUploading(false);
          return;
        }

        const blob: NamedBlobImage = {
          data: parsed.data,
          encoding: 'base64',
          'content-type': parsed.contentType,
          filename: file.name,
        };

        if (blobField) {
          setUploadError('');
          onValueChange(blob, { title: file.name });
          setIsUploading(false);
          return;
        }

        // Keep this as a direct fetch: this widget treats `@createContent`
        // like an API endpoint and needs its raw JSON payload to update local
        // state. `useFetcher.submit` routes the action response through React
        // Router's data transport instead of exposing that API-ish shape.
        const response = await fetch(uploadAction, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            path: resolvedUploadPath,
            data: {
              '@type': 'Image',
              title: file.name,
              image: {
                data: parsed.data,
                encoding: 'base64',
                'content-type': parsed.contentType,
                filename: file.name,
              },
            },
          }),
        });

        const responseData = await parseJsonSafe(response);
        const result = parseCreateContentResponse(responseData);

        if (response.ok && typeof result?.['@id'] === 'string') {
          setUploadError('');
          onValueChange(result['@id'], {
            title: result.title,
          });
        } else {
          setUploadError(result?.message || 'Image upload failed');
        }
        setIsUploading(false);
      } catch {
        setUploadError('Could not read the selected file');
        setIsUploading(false);
      }
    },
    [
      restrictFileUpload,
      resolvedUploadPath,
      uploadAction,
      onValueChange,
      blobField,
    ],
  );

  const onDrop = useCallback(
    async (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setIsDragging(false);

      const file = event.dataTransfer.files?.[0];
      if (file) {
        await submitUpload(file);
      }
    },
    [submitUpload],
  );

  const onDragOver = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  }, []);

  const onSelectInternalImage = useCallback(
    async (selectedItems: Partial<Brain>[]) => {
      const selectedImage = selectedItems[0];
      if (!selectedImage || typeof selectedImage['@id'] !== 'string') return;

      const title =
        typeof selectedImage.title === 'string'
          ? selectedImage.title
          : undefined;

      if (!blobField) {
        onValueChange(selectedImage['@id'], { title });
        return;
      }

      setUploadError('');
      setIsUploading(true);
      try {
        const filename = title ? `${title}` : 'image';
        const blob = await fetchExistingImageAsBlob(
          selectedImage['@id'],
          filename,
        );
        if (!blob) {
          setUploadError('Could not load the selected image');
          setIsUploading(false);
          return;
        }
        onValueChange(blob, { title });
        setIsUploading(false);
      } catch {
        setUploadError('Could not load the selected image');
        setIsUploading(false);
      }
    },
    [onValueChange, blobField],
  );

  if (imageValue) {
    return (
      <div
        className={`
          relative overflow-hidden rounded-md border border-quanta-azure bg-quanta-snow
          ${className || ''}
        `}
      >
        {selected && (
          <div className="absolute top-2 right-2 z-10">
            <Button
              aria-label="Clear image"
              size="L"
              type="button"
              variant="icon"
              onPress={() => onValueChange(null)}
            >
              <BinIcon />
            </Button>
          </div>
        )}
        <img
          className="max-h-[320px] w-full object-cover"
          src={getPreviewSrc(imageValue, imageSize)}
          alt=""
        />
      </div>
    );
  }

  return (
    <div
      className={`
        space-y-3 rounded-md border border-dashed border-quanta-azure bg-quanta-snow p-4
        ${className || ''}
      `}
      onDrop={onDrop}
      onDragOver={onDragOver}
      onDragEnter={() => !restrictFileUpload && setIsDragging(true)}
      onDragLeave={() => setIsDragging(false)}
      role="group"
    >
      <div className="flex items-center gap-2 text-quanta-pigeon">
        <ImageIcon />
        <p>
          {isDragging
            ? 'Drop an image to upload'
            : 'Browse the site, drop an image, or use a URL'}
        </p>
      </div>

      <div className="flex items-center gap-2">
        {showObjectBrowser && (
          <ObjectBrowserProvider
            config={{
              mode: objectBrowserMode,
              selectedItemAttrs: ['@id', 'title'],
              onChange: onSelectInternalImage,
              initialPath: resolvedCurrentPath,
              title: 'Pick an existing image',
              widgetOptions: {
                pattern_options: {
                  selectableTypes: ['Image'],
                },
              },
            }}
          >
            <ObjectBrowserButton
              title="Pick an existing image"
              onBeforeOpen={onFocus}
            />
          </ObjectBrowserProvider>
        )}

        {!restrictFileUpload && (
          <>
            <Button
              aria-label="Upload an image"
              size="L"
              type="button"
              variant="icon"
              onPress={() => {
                onFocus?.();
                fileInputRef.current?.click();
              }}
            >
              <UploadIcon />
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) submitUpload(file);
                event.currentTarget.value = '';
              }}
            />
          </>
        )}
      </div>

      {showLinkPicker && (
        <div className="flex items-center gap-2">
          <div className="text-quanta-pigeon">
            <LinkIcon />
          </div>
          <Input
            value={linkValue}
            onChange={(event) => {
              setLinkValue(event.target.value);
            }}
            onKeyDown={(event) => {
              if (event.key !== 'Enter') return;
              event.preventDefault();
              const nextValue = linkValue.trim();
              onValueChange(nextValue || null);
            }}
            placeholder={placeholderLinkInput || 'Enter an image URL'}
          />
        </div>
      )}

      {isUploading && (
        <p className="text-sm text-quanta-pigeon">Uploading image...</p>
      )}
      {uploadError && (
        <p className="text-sm text-quanta-candy">{uploadError}</p>
      )}
    </div>
  );
}

export function ImageInput(props: ImageInputProps) {
  const { id, onChange, ...rest } = props;

  return (
    <ImageInputBase
      {...rest}
      onValueChange={(value, extras) => onChange(id, value, extras)}
    />
  );
}

export default function ImageWidget(props: ImageWidgetProps) {
  const {
    label,
    description,
    errorMessage,
    error,
    onChange,
    className,
    factory,
    widget,
    blobField,
    ...rest
  } = props;

  const isBlobField = blobField || factory === 'Image' || widget === 'file';

  const fieldError =
    typeof errorMessage === 'string'
      ? errorMessage
      : (error?.filter(Boolean).join(', ') ?? '');

  return (
    <div className="group mb-4 flex flex-col gap-1">
      {label && <Label>{label}</Label>}

      <ImageInputBase
        {...rest}
        className={className}
        value={props.value}
        currentPath={rest.currentPath}
        blobField={isBlobField}
        onValueChange={(value, extras) => onChange?.(value, extras)}
      />

      {description && <Description>{description}</Description>}
      <FieldError>{fieldError}</FieldError>
    </div>
  );
}

ImageWidget.displayName = 'ImageWidget';
