import ploneWhiteSVG from '../../static/plone.svg';

// TODO: Consider rename to AuthLogo or similar as its reused for singup too
const LoginLogo = ({
  bgClassName = 'bg-quanta-lemon',
}: {
  bgClassName?: string;
}) => {
  return (
    <div
      className={`
        flex h-32 w-32 flex-col items-center justify-center rounded-full p-2
        ${bgClassName}
      `}
    >
      <img src={ploneWhiteSVG} alt="" aria-hidden="true" />
    </div>
  );
};

export default LoginLogo;
