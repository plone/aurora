import Plone from '../../static/plone.svg?react';
import { useLoaderData } from 'react-router';
import type { loader } from '../../routes/auth/login';

const LoginLogo = () => {
  const { siteTitle, siteLogo } = useLoaderData<typeof loader>();

  if (siteLogo) {
    return <img src={siteLogo} alt={siteTitle ?? ''} className="h-32" />;
  }

  return (
    <div
      className={`
        flex h-32 w-32 flex-col items-center justify-center rounded-full bg-quanta-sapphire p-2
      `}
    >
      <Plone className="text-quanta-air" aria-hidden="true" />
    </div>
  );
};

export default LoginLogo;
