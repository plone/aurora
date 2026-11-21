import { useTranslate } from '../../../provider/ControlPanelsProvider';
import { useBehaviorMetadata } from '../../driver';
import { fieldBehavior } from '../../behaviorEditing';
import { messages } from '../../messages';
import { isCustomField } from '../../schemaEditing';
import type { TypeSchema } from '../../types';

export interface FormPreviewProps {
  /** The edit form to show. */
  schema: TypeSchema;
  /** The behavior whose fields to highlight. */
  highlight?: string;
  /** Titles of the behaviors whose fields can't be shown yet. */
  pending?: string[];
  /** Whether the schema is an estimate rather than the backend's preview. */
  isEstimate?: boolean;
  isUpdating?: boolean;
  /** The title of a behavior, by name. */
  behaviorTitle: (name: string) => string;
}

/**
 * The fieldsets and fields of an edit form, compactly, so editors see where
 * behaviors put their fields.
 */
export function FormPreview({
  schema,
  highlight,
  pending = [],
  isEstimate,
  isUpdating,
  behaviorTitle,
}: FormPreviewProps) {
  const t = useTranslate();
  const metadata = useBehaviorMetadata();
  return (
    <aside
      aria-label={t(messages.formPreview)}
      aria-busy={isUpdating || undefined}
      className={`
        flex min-w-0 flex-col gap-3 self-start rounded-lg border border-quanta-smoke bg-quanta-air
        p-4
        lg:sticky lg:top-4
      `}
    >
      <h3 className="text-sm font-semibold">{t(messages.formPreview)}</h3>
      <p className="text-xs text-quanta-pigeon">
        {isUpdating
          ? t(messages.formPreviewUpdating)
          : t(messages.formPreviewHelp)}
      </p>
      {schema.fieldsets
        .filter((fieldset) => fieldset.fields.length > 0)
        .map((fieldset) => (
          <section key={fieldset.id} className="flex flex-col gap-1">
            <h4
              className={`
                flex justify-between text-xs font-semibold tracking-wide text-quanta-pigeon
                uppercase
              `}
            >
              <span>{fieldset.title}</span>
              <span className="font-mono">{fieldset.fields.length}</span>
            </h4>
            <ul className="flex flex-col gap-1">
              {fieldset.fields.map((name) => {
                const field = schema.properties[name];
                const custom = isCustomField(field);
                const behavior = fieldBehavior(field?.behavior, metadata);
                const isHighlighted = !!highlight && behavior === highlight;
                return (
                  <li
                    key={name}
                    data-highlighted={isHighlighted || undefined}
                    className={`
                      flex justify-between gap-2 rounded border bg-quanta-snow px-2 py-0.5 text-xs
                      ${custom ? 'border-dashed border-quanta-silver' : 'border-quanta-smoke'}
                      ${isHighlighted ? 'border-quanta-sapphire bg-quanta-air font-semibold' : ''}
                    `}
                  >
                    <span className="truncate">{field?.title || name}</span>
                    <span className="truncate text-quanta-pigeon">
                      {custom
                        ? t(messages.custom)
                        : behavior
                          ? behaviorTitle(behavior)
                          : ''}
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      {pending.length > 0 && (
        <p className="text-xs text-quanta-pigeon">
          {t(messages.pendingFields, { behaviors: pending.join(', ') })}
        </p>
      )}
      {isEstimate && (
        <p className="text-xs text-quanta-pigeon">
          {t(messages.formPreviewEstimate)}
        </p>
      )}
    </aside>
  );
}
