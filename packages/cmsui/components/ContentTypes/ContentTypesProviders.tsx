import { useCallback, useMemo, type ReactNode } from 'react';
import { useBlocker, useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import {
  ContentTypesDriverProvider,
  ControlPanelsProvider,
  interpolate,
  type Notify,
  type Translate,
  type UseBlocker,
} from '@plone/controlpanels';
import Toast from '@plone/layout/components/Toast/Toast';
import config from '@plone/registry';
import { createAuroraDriver } from './auroraDriver';

/** React Router's blocker, in the shape the control panels expect. */
const useRouterBlocker: UseBlocker = (shouldBlock) => {
  const blocker = useBlocker(({ nextLocation }) =>
    shouldBlock(nextLocation.pathname),
  );
  return {
    isBlocked: blocker.state === 'blocked',
    proceed: () => blocker.proceed?.(),
    cancel: () => blocker.reset?.(),
  };
};

/**
 * Connects the content types control panel to Aurora: React Router for
 * navigation, i18next for translations, the toast queue for notifications,
 * and the Aurora driver for data.
 */
export default function ContentTypesProviders({
  children,
}: {
  children: ReactNode;
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const driver = useMemo(() => createAuroraDriver(), []);

  // The package's messages use single-brace placeholders (`{count}`), like
  // react-intl, so they're filled in after i18next looks the message up.
  const translate = useCallback<Translate>(
    (message, values) =>
      interpolate(
        t(message.id, { defaultValue: message.defaultMessage }),
        values,
      ),
    [t],
  );

  const notify = useCallback<Notify>(({ title, description, variant }) => {
    config.getUtility({ name: 'show', type: 'toast' }).method({
      title,
      description,
      className: variant === 'error' ? 'error' : undefined,
    });
  }, []);

  return (
    <ControlPanelsProvider
      navigate={navigate}
      translate={translate}
      notify={notify}
      useBlocker={useRouterBlocker}
    >
      <ContentTypesDriverProvider driver={driver}>
        {children}
      </ContentTypesDriverProvider>
      <Toast
        queue={config.getUtility({ name: 'queue', type: 'toast' }).method()}
      />
    </ControlPanelsProvider>
  );
}
