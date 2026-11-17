import * as React from 'react';

import { Toaster } from 'sonner';

/*
 * The editor shows its notifications, such as an Undo after deleting
 * something, with sonner. Only the first editor on the page renders the
 * toaster, so several editors don't stack several of them.
 */

let owners = 0;

export function EditorToaster() {
  const [isOwner, setIsOwner] = React.useState(false);

  React.useEffect(() => {
    owners += 1;
    if (owners === 1) setIsOwner(true);
    return () => {
      owners -= 1;
    };
  }, []);

  return isOwner ? <Toaster position="bottom-center" /> : null;
}
