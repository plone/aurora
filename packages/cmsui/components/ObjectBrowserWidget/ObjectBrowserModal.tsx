import {
  Dialog,
  Heading,
  Modal as RACModal,
  ModalOverlay,
} from 'react-aria-components';
import { Button, Input } from '@plone/components/quanta';
import { SearchIcon, CloseIcon } from '@plone/components/Icons';
import { ObjectBrowserWidgetBody } from './ObjectBrowserWidgetBody';
import { useObjectBrowserContext } from './ObjectBrowserContext';
import { useTranslation } from 'react-i18next';

type ObjectBrowserModalProps = {
  isOpen?: boolean;
  onOpenChange?: (isOpen: boolean) => void;
};

export const ObjectBrowserModal = ({
  isOpen,
  onOpenChange,
}: ObjectBrowserModalProps = {}) => {
  const { t } = useTranslation();
  const {
    open,
    setOpen,
    searchMode,
    setSearchMode,
    setSearchableText,
    handleSearchInputChange,
    ariaControlsId,
    title,
  } = useObjectBrowserContext();

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    onOpenChange?.(nextOpen);
  };

  return (
    <ModalOverlay
      isDismissable
      className={`
        fixed inset-0 z-50 bg-black/50
        data-[entering]:duration-200 data-[entering]:animate-in data-[entering]:fade-in
        data-[exiting]:duration-150 data-[exiting]:animate-out data-[exiting]:fade-out
      `}
      isOpen={isOpen ?? open}
      onOpenChange={handleOpenChange}
    >
      <RACModal
        className={`
          fixed top-0 right-0 bottom-0 w-[360px] border-l border-quanta-azure bg-quanta-air px-6
          py-8 text-black shadow-2xl outline-none
          data-[entering]:duration-300 data-[entering]:animate-in
          data-[entering]:slide-in-from-right-full
          data-[exiting]:duration-200 data-[exiting]:animate-out
          data-[exiting]:slide-out-to-right-full
        `}
      >
        <Dialog className="flex h-full flex-col overflow-hidden p-1">
          {!searchMode ? (
            <div className="flex items-center justify-between gap-2">
              <Heading
                slot="title"
                className="!mb-0 min-w-0 flex-1 truncate !text-xl"
                title={title || t('cmsui.objectbrowserwidget.dialogTitle')}
              >
                {title || t('cmsui.objectbrowserwidget.dialogTitle')}
              </Heading>
              <div className="flex shrink-0 items-center gap-0.5">
                <Button
                  variant="icon"
                  onPress={() => {
                    setSearchMode(true);
                    setSearchableText('');
                  }}
                  type="button"
                  aria-label={t('cmsui.objectbrowserwidget.openSearch')}
                >
                  <SearchIcon />
                </Button>

                <Button
                  slot="close"
                  variant="icon"
                  type="button"
                  aria-label={t('cmsui.objectbrowserwidget.closeDialog')}
                  onPress={() => handleOpenChange(false)}
                >
                  <CloseIcon />
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Input
                onChange={handleSearchInputChange}
                className={'border-quanta rounded-md'}
                aria-controls={ariaControlsId}
                placeholder={t('cmsui.objectbrowserwidget.searchPlaceholder')}
              />
              <Button
                variant="icon"
                type="button"
                aria-label={t('cmsui.objectbrowserwidget.closeSearch')}
                onPress={() => {
                  setSearchMode(false);
                  setSearchableText('');
                }}
              >
                <CloseIcon />
              </Button>
            </div>
          )}
          <ObjectBrowserWidgetBody />
        </Dialog>
      </RACModal>
    </ModalOverlay>
  );
};

ObjectBrowserModal.displayName = 'ObjectBrowserModal';
