import ploneHeroSvg from '../../static/plone-hero.svg';

const LoginHero = () => {
  return (
    <img
      src={ploneHeroSvg}
      className="h-full w-auto object-cover"
      alt=""
      aria-hidden="true"
    />
  );
};

export default LoginHero;
