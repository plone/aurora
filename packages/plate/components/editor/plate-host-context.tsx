import * as React from 'react';

/*
 * What the host app offers the editor, all optional. A host without them,
 * such as a plain `PlateEditor` in Storybook or in another app, still gets a
 * working editor.
 */
export type PlateHostContextValue = {
  /**
   * The element where block settings render, such as the host's sidebar.
   * Without it, settings open in a popover next to the block.
   */
  settingsContainer?: () => HTMLElement | null;
};

const PlateHostContext = React.createContext<PlateHostContextValue>({});

export const PlateHostProvider = PlateHostContext.Provider;

export const usePlateHost = () => React.useContext(PlateHostContext);
