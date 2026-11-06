import React from 'react';
import {
  Text,
  Button,
  UNSTABLE_Toast as Toast,
  UNSTABLE_ToastContent as ToastContent,
  UNSTABLE_ToastRegion as ToastRegion,
} from 'react-aria-components';
import { CloseIcon } from '@plone/icons';
import clsx from 'clsx';
import { type ToastQueue } from '../../config/toast';
import styles from './Toast.module.css';
/**
 * Props Types for the SectionWrapper component.
 * They are able to infer the props of the element type passed to the `as` prop.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
type AppToastPropsType<T extends React.ElementType> = {
  queue: ToastQueue;
} & React.ComponentPropsWithoutRef<React.ElementType>;

const AppToast = (props: AppToastPropsType<React.ElementType>) => {
  const { queue } = props;
  return (
    <ToastRegion queue={queue} className={styles.region}>
      {({ toast }) => (
        <Toast
          toast={toast}
          className={clsx(styles.toast, toast.content.className)}
        >
          <ToastContent className={styles.content}>
            <Text slot="title">
              {toast.content.icon ? (
                <span className="toast-icon">{toast.content.icon}</span>
              ) : (
                <></>
              )}
              {toast.content.title}
            </Text>
            <Text slot="description">{toast.content.description}</Text>
          </ToastContent>
          <Button slot="close" className={styles.close}>
            <CloseIcon />
          </Button>
          {toast.timeout && toast.content.showProgress !== false ? (
            <div
              className={styles.progress}
              style={
                {
                  '--toast-duration': `${toast.timeout}ms`,
                } as React.CSSProperties
              }
              aria-hidden="true"
            />
          ) : null}
        </Toast>
      )}
    </ToastRegion>
  );
};

export default AppToast;
