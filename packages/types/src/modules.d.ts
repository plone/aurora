declare module '*.aac' {
  let asset: string;
  export default asset;
}
declare module '*.avif' {
  let asset: string;
  export default asset;
}
declare module '*.module.css' {
  let styles: {
    readonly [key: string]: string;
  };
  export default styles;
}
declare module '*.css' {
  let asset: string;
  export default asset;
}
declare module '*.csv' {
  let asset: string;
  export default asset;
}
declare module '*.eot' {
  let asset: string;
  export default asset;
}
declare module '*.fbx' {
  let asset: string;
  export default asset;
}
declare module '*.flac' {
  let asset: string;
  export default asset;
}
declare module '*.gif' {
  let asset: string;
  export default asset;
}
declare module '*.glb' {
  let asset: string;
  export default asset;
}
declare module '*.gltf' {
  let asset: string;
  export default asset;
}
declare module '*.gql' {
  let asset: string;
  export default asset;
}
declare module '*.graphql' {
  let asset: string;
  export default asset;
}
declare module '*.hdr' {
  let asset: string;
  export default asset;
}
declare module '*.ico' {
  let asset: string;
  export default asset;
}
declare module '*.jpeg' {
  let asset: string;
  export default asset;
}
declare module '*.jpg' {
  let asset: string;
  export default asset;
}
declare module '*.mp3' {
  let asset: string;
  export default asset;
}
declare module '*.mov' {
  let asset: string;
  export default asset;
}
declare module '*.mp4' {
  let asset: string;
  export default asset;
}
declare module '*.ogg' {
  let asset: string;
  export default asset;
}
declare module '*.otf' {
  let asset: string;
  export default asset;
}
declare module '*.png' {
  let asset: string;
  export default asset;
}
declare module '*.psd' {
  let asset: string;
  export default asset;
}
declare module '*.sql' {
  let asset: string;
  export default asset;
}
declare module '*.svg' {
  let asset: string;
  export default asset;
}
// The SVGR Vite plugin of `@plone/icons` wraps every `*.svg?react` import in
// its `Icon` component, so the component takes the props of `Icon`, except
// `children`. A type check in `@plone/icons` fails when they differ.
declare module '*.svg?react' {
  import type { CSSProperties, FunctionComponent } from 'react';

  const ReactComponent: FunctionComponent<{
    id?: string;
    'aria-label'?: string;
    'aria-labelledby'?: string;
    'aria-describedby'?: string;
    'aria-details'?: string;
    'aria-hidden'?: boolean | 'false' | 'true';
    size?: '2xs' | 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl';
    slot?: string;
    color?: string;
    className?: string;
    style?: CSSProperties;
  }>;
  export default ReactComponent;
}
declare module '*.ttf' {
  let asset: string;
  export default asset;
}
declare module '*.wasm' {
  let asset: string;
  export default asset;
}
declare module '*.wav' {
  let asset: string;
  export default asset;
}
declare module '*.webm' {
  let asset: string;
  export default asset;
}
declare module '*.webp' {
  let asset: string;
  export default asset;
}
declare module '*.woff' {
  let asset: string;
  export default asset;
}
declare module '*.woff2' {
  let asset: string;
  export default asset;
}
declare module '*.webmanifest' {
  let asset: string;
  export default asset;
}
declare module '*.zip' {
  let asset: string;
  export default asset;
}
