import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@plone/quanta';
import { CopyIcon } from '@plone/icons';

export type CopyButtonProps = {
  label?: string;
  onCopyRequested?: () => string;
};

export type CopyButtonStatus = 'idle' | 'copied' | 'failed';

export const CopyButton = ({ label, onCopyRequested }: CopyButtonProps) => {
  const [status, setStatus] = useState<CopyButtonStatus>('idle');
  const copyTimeout = useRef<ReturnType<typeof setTimeout>>(undefined);
  const { t } = useTranslation();

  const doCopy = useCallback(async () => {
    const text = onCopyRequested?.() || '';

    try {
      await navigator.clipboard.writeText(text);
      setStatus('copied');
    } catch {
      setStatus('failed');
    }
    clearTimeout(copyTimeout.current);
    copyTimeout.current = setTimeout(() => setStatus('idle'), 2000);
  }, [onCopyRequested]);

  useEffect(
    () => () => {
      clearTimeout(copyTimeout.current);
    },
    [],
  );

  const finalLabel = label || '';

  return (
    <Button
      variant="neutral"
      accent
      className={`
        mt-5 h-9 cursor-pointer items-center self-start rounded-[18px] border border-quanta-silver
        bg-white pr-3.5! pl-3.5! font-sans text-[13px]! text-quanta-denim
      `}
      onPress={doCopy}
    >
      <CopyIcon size="sm" className={finalLabel.length ? 'mr-1.25' : ''} />
      {status === 'copied'
        ? t('cmsui.siteOverview.copied')
        : status === 'failed'
          ? t('cmsui.siteOverview.copyFailed')
          : finalLabel}
    </Button>
  );
};

export default CopyButton;
