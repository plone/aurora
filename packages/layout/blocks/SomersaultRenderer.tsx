import type { Content } from '@plone/types';
import {
  PlateController,
  PlateRenderer,
  type Value,
} from '@plone/plate/components/editor';
import somersaultRendererConfig from '@plone/plate/config/presets/somersault-renderer';
import { MAIN_REGION } from '@plone/plate/constants';

type SomersaultRendererProps = {
  content: Content;
};

const SomersaultRenderer = ({ content }: SomersaultRendererProps) => {
  const somersaultBlock = content.blocks?.[MAIN_REGION] as
    { value?: Value } | undefined;

  return somersaultBlock?.value ? (
    <PlateController>
      <PlateRenderer
        editorConfig={somersaultRendererConfig}
        value={somersaultBlock.value as Value}
      />
    </PlateController>
  ) : null;
};

export default SomersaultRenderer;
