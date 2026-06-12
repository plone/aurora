import {
  Button,
  Text,
  UNSTABLE_Toast as Toast,
  UNSTABLE_ToastContent as ToastContent,
  UNSTABLE_ToastRegion as ToastRegion,
} from 'react-aria-components';
import { CloseIcon } from '@plone/components/Icons';
import config from '@plone/registry';
import { type ToastQueue } from '../../config/toast';
import '@plone/components/src/styles/basic/Toast.css';

const AppToast = ({ queue }: { queue?: ToastQueue }) => {
  const toastQueue: ToastQueue =
    queue ?? config.getUtility({ name: 'queue', type: 'toast' }).method();

  return (
    <ToastRegion queue={toastQueue}>
      {({ toast }) => (
        <Toast
          toast={toast}
          className={['react-aria-Toast', toast.content.className].join(' ')}
        >
          {toast.content.icon ? (
            <span className="toast-icon">{toast.content.icon}</span>
          ) : (
            <></>
          )}
          <ToastContent>
            <Text slot="title">{toast.content.title}</Text>
            {toast.content.description ? (
              <Text slot="description">{toast.content.description}</Text>
            ) : null}
          </ToastContent>
          <Button slot="close">
            <CloseIcon />
          </Button>
        </Toast>
      )}
    </ToastRegion>
  );
};

export default AppToast;
