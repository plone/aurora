import config from '@plone/registry';

interface IconProps {
  name: string;
}

const Icon = (props: IconProps) => {
  const { name } = props;

  const IconComponent = config.getIcon(name);

  if (IconComponent === undefined) {
    return null;
  }

  return <IconComponent />;
};

export default Icon;
