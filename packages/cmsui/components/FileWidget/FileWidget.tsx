import { useId, useRef, useState } from 'react';
import type { FormWidgetProps } from '@plone/types';
import { Button, Description, DropZone, Label } from '@plone/quanta';
import { AttachmentIcon, BinIcon } from '@plone/icons';
import { useTranslation } from 'react-i18next';
import { twMerge } from 'tailwind-merge';

/**
 * The value of a file or image field.
 *
 * The content API sends a stored file with its `download` URL. A new file
 * is sent to the API with its `data`, encoded in base64.
 */
export type FileValue = {
  filename?: string;
  'content-type'?: string;
  size?: number;
  /** The URL of the stored file. */
  download?: string;
  /** The content of a new file. */
  data?: string;
  encoding?: 'base64';
  [key: string]: unknown;
};

export type FileWidgetProps = FormWidgetProps<FileValue | null>;

function readFile(file: File) {
  return new Promise<FileValue>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result ?? '');
      resolve({
        data: dataUrl.slice(dataUrl.indexOf(',') + 1),
        encoding: 'base64',
        'content-type': file.type || 'application/octet-stream',
        filename: file.name,
        size: file.size,
      });
    };
    reader.onerror = () =>
      reject(reader.error ?? new Error('File read failed'));
    reader.readAsDataURL(file);
  });
}

const formatSize = (size?: number) => {
  if (size == null) return '';
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / 1024 / 1024).toFixed(1)} MB`;
};

const previewSrc = (value: FileValue) => {
  if (!value['content-type']?.startsWith('image/')) return undefined;
  if (value.data) return `data:${value['content-type']};base64,${value.data}`;
  return value.download;
};

/**
 * Picks a file for a file or image field, such as the file of a File or the
 * image of an Image. The editor chooses a file, or drops it on the widget.
 * The value is the file, as the content API sends and receives it, or
 * `null` when the field is emptied.
 *
 * An `Image` field only accepts images, and shows a preview.
 */
export function FileWidget({
  name,
  value,
  onChange,
  onBlur,
  label,
  description,
  required,
  disabled,
  readOnly,
  invalid,
  errorMessage,
  className,
  schema,
}: FileWidgetProps) {
  const { t } = useTranslation();
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [readError, setReadError] = useState('');
  const imageOnly = schema?.factory === 'Image';
  const editable = !disabled && !readOnly;
  const file = value && typeof value === 'object' ? value : null;
  const preview = file ? previewSrc(file) : undefined;
  const error = errorMessage || readError;
  const showError = invalid || !!readError;

  const pick = async (picked?: File | null) => {
    if (!picked) return;
    if (imageOnly && !picked.type.startsWith('image/')) {
      setReadError(t('cmsui.widgets.file.imageOnly'));
      return;
    }
    try {
      onChange(await readFile(picked));
      setReadError('');
    } catch {
      setReadError(t('cmsui.widgets.file.readError'));
    }
  };

  return (
    <div
      className={twMerge('group flex flex-col gap-1', className)}
      data-required={required || undefined}
      data-invalid={showError || undefined}
      data-disabled={disabled || undefined}
    >
      {label && <Label htmlFor={id}>{label}</Label>}
      <DropZone
        isDisabled={!editable}
        aria-label={t('cmsui.widgets.file.dropZone', { label })}
        // A dropped file is checked like a chosen one.
        onDrop={async (event) => {
          const item = event.items.find((item) => item.kind === 'file');
          if (item?.kind === 'file') await pick(await item.getFile());
        }}
        className="flex flex-col items-stretch gap-3 p-4 text-left"
      >
        {file && (
          <div className="flex items-center gap-3">
            {preview ? (
              <img
                src={preview}
                alt=""
                className="h-16 w-16 rounded-sm object-cover"
              />
            ) : (
              <AttachmentIcon aria-hidden size="base" />
            )}
            <div className="flex min-w-0 flex-1 flex-col text-sm">
              {file.download && !file.data ? (
                <a
                  href={file.download}
                  className="truncate underline"
                  target="_blank"
                  rel="noreferrer"
                >
                  {file.filename}
                </a>
              ) : (
                <span className="truncate">{file.filename}</span>
              )}
              <span className="text-xs text-quanta-pigeon">
                {formatSize(file.size)}
              </span>
            </div>
            {editable && (
              <Button
                variant="icon"
                type="button"
                aria-label={t('cmsui.widgets.file.remove', {
                  filename: file.filename,
                })}
                onPress={() => {
                  onChange(null);
                  if (inputRef.current) inputRef.current.value = '';
                }}
              >
                <BinIcon aria-hidden size="sm" />
              </Button>
            )}
          </div>
        )}
        <div className="flex items-center gap-3">
          {/* The file input is the field's control: it has the field's
              label, and the keyboard opens the file chooser from it. */}
          <input
            ref={inputRef}
            id={id}
            name={name}
            type="file"
            accept={imageOnly ? 'image/*' : undefined}
            required={required}
            disabled={!editable}
            aria-invalid={showError || undefined}
            aria-describedby={
              [description && `${id}-description`, showError && `${id}-error`]
                .filter(Boolean)
                .join(' ') || undefined
            }
            onChange={(event) => pick(event.target.files?.[0])}
            onBlur={onBlur}
            className="peer sr-only"
          />
          {editable && (
            // For the pointer only: the input above has the focus.
            <span
              aria-hidden
              onClick={() => inputRef.current?.click()}
              className={`
                cursor-pointer rounded-lg bg-quanta-snow px-3 py-2 text-sm text-quanta-space
                peer-focus-visible:outline-2 peer-focus-visible:outline-quanta-cobalt
                hover:bg-quanta-smoke
              `}
            >
              {file
                ? t('cmsui.widgets.file.replace')
                : t('cmsui.widgets.file.choose')}
            </span>
          )}
          {!file && (
            <span className="text-sm text-quanta-pigeon">
              {t('cmsui.widgets.file.orDrop')}
            </span>
          )}
        </div>
      </DropZone>
      {description && (
        <Description id={`${id}-description`}>{description}</Description>
      )}
      {showError && error && (
        <p id={`${id}-error`} className="text-xs font-normal text-quanta-candy">
          {error}
        </p>
      )}
    </div>
  );
}

FileWidget.displayName = 'FileWidget';
