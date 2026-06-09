import { useEffect, useMemo, useState } from 'react';
import { useFetcher, useRevalidator, type SubmitTarget } from 'react-router';
import { Heading } from 'react-aria-components';
import { useTranslation } from 'react-i18next';
import {
  Button,
  DateTimePicker,
  Dialog,
  Input,
  Modal,
} from '@plone/components/quanta';
import { CloseIcon, PropertiesIcon } from '@plone/components/Icons';
import { type ToastItem } from '@plone/layout/config/toast';
import { useContentsContext } from '../../providers/contents';
import {
  buildPropertiesPatch,
  computeInitialStates,
  type PropertyField,
  type PropertyItem,
} from '../../helpers/properties';

export default function PropertiesModal() {
  const { t } = useTranslation();
  const fetcher = useFetcher();
  const dataFetcher = useFetcher<{
    items: Array<PropertyItem & { '@id': string }>;
  }>();
  const { revalidate } = useRevalidator();
  const {
    showProperties,
    setShowProperties,
    selected,
    setSelected,
    showToast,
  } = useContentsContext();

  const items = useMemo(() => [...selected], [selected]);
  const initial = useMemo(
    () => computeInitialStates(dataFetcher.data?.items ?? []),
    [dataFetcher.data],
  );

  const [values, setValues] = useState<Record<string, any>>({});

  useEffect(() => {
    if (showProperties) {
      const params = new URLSearchParams();
      items.forEach((item) => params.append('path', item['@id']));
      dataFetcher.load(`/@@contents/@@properties?${params.toString()}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showProperties]);

  useEffect(() => {
    if (dataFetcher.data) {
      setValues({
        effective: initial.effective.value ?? null,
        expires: initial.expires.value ?? null,
        rights: initial.rights.value ?? '',
        creators: (initial.creators.value ?? []).join(', '),
        exclude_from_nav: initial.exclude_from_nav.value ?? false,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataFetcher.data]);

  useEffect(() => {
    if (fetcher.state === 'idle' && fetcher.data) {
      const data = fetcher.data;
      if (data?.ok?.length > 0) {
        const toast: ToastItem = {
          title:
            data.ok.length === 1
              ? t('contents.actions.properties_saved', {
                  title: data.ok[0].title,
                })
              : t('contents.actions.properties_saved_multiple', {
                  number: data.ok.length,
                }),
          icon: <PropertiesIcon />,
        };
        showToast(toast);
        revalidate();
      }
      if (data?.errors?.length > 0) {
        data.errors.forEach((e: any) => {
          showToast({
            title: `${t('contents.error')} ${e.__error?.status} - ${e.__error?.data?.type}`,
            description: e.__error?.data?.message,
            icon: <PropertiesIcon />,
            className: 'error',
          });
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetcher.state]);

  if (!showProperties) return null;

  const close = () => {
    setSelected('none');
    setShowProperties(false);
  };

  const setField = (field: PropertyField, value: any) => {
    setValues({ ...values, [field]: value });
  };

  const mixedPlaceholder = (field: PropertyField) =>
    initial[field].mixed ? t('contents.modal_properties.mixed') : undefined;

  const confirm = () => {
    const body = buildPropertiesPatch(initial, {
      effective: values.effective ?? null,
      expires: values.expires ?? null,
      rights: values.rights ?? '',
      creators: values.creators ?? '',
      exclude_from_nav: !!values.exclude_from_nav,
    });
    if (Object.keys(body).length === 0) {
      close();
      return;
    }
    fetcher.submit(
      {
        items: items.map((i) => ({ '@id': i['@id'], title: i.title })),
        data: body,
      } as SubmitTarget,
      {
        method: 'PATCH',
        encType: 'application/json',
        action: '/@@contents/@@properties',
      },
    );
    close();
  };

  return (
    <Modal
      isDismissable
      isOpen={showProperties}
      onOpenChange={setShowProperties}
    >
      <Dialog className="mx-auto w-full p-8">
        <Heading
          slot="title"
          className="react-aria-Heading mb-6 text-xl font-bold"
        >
          {t('contents.modal_properties.title')}
        </Heading>
        <div className="mx-auto grid max-w-xl gap-4">
          <DateTimePicker
            label={t('contents.modal_properties.effective')}
            value={values.effective ?? null}
            granularity="minute"
            description={mixedPlaceholder('effective')}
            onChange={(v) => setField('effective', v)}
          />
          <DateTimePicker
            label={t('contents.modal_properties.expires')}
            value={values.expires ?? null}
            granularity="minute"
            description={mixedPlaceholder('expires')}
            onChange={(v) => setField('expires', v)}
          />
          <Field label={t('contents.modal_properties.rights')}>
            <Input
              type="text"
              value={values.rights ?? ''}
              placeholder={mixedPlaceholder('rights')}
              onChange={(e) => setField('rights', e.target.value)}
            />
          </Field>
          <Field label={t('contents.modal_properties.creators')}>
            <Input
              type="text"
              value={values.creators ?? ''}
              placeholder={
                mixedPlaceholder('creators') ??
                t('contents.modal_properties.creators_hint')
              }
              onChange={(e) => setField('creators', e.target.value)}
            />
          </Field>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={!!values.exclude_from_nav}
              onChange={(e) => setField('exclude_from_nav', e.target.checked)}
            />
            {t('contents.modal_properties.exclude_from_nav')}
            {initial.exclude_from_nav.mixed && (
              <span className="text-quanta-graphite">
                ({t('contents.modal_properties.mixed')})
              </span>
            )}
          </label>

          <div className="mt-4 flex justify-center gap-3">
            <Button
              onPress={close}
              aria-label={t('contents.modal.close')}
              accent={true}
              size="L"
            >
              <CloseIcon />
            </Button>
            <Button
              onPress={confirm}
              aria-label={t('contents.modal_properties.confirm')}
              variant="primary"
              accent={true}
              size="L"
              isDisabled={fetcher.state !== 'idle' || !dataFetcher.data}
            >
              <PropertiesIcon />
            </Button>
          </div>
        </div>
      </Dialog>
    </Modal>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="grid gap-1 text-sm">
      <span className="font-bold">{label}</span>
      {children}
    </label>
  );
}
