import { ConfigType } from './dist';

export function stylesAliases(
  ploneDir: string,
): Array<{ find: RegExp; replacement: string }>;

export function PloneRegistryVitePlugin(): {
  name: string;
  enforce: 'pre' | 'post' | undefined;
  config: () => {
    ssr: {
      optimizeDeps: {
        exclude: string[];
      };
    };
    oxc: Record<string, never>;
    optimizeDeps: {
      exclude: string[];
    };
    resolve: {
      alias: any[];
    };
  };
};

declare module '@plone/registry/addons-loader' {
  export default function applyAddonConfiguration(
    config: ConfigType,
  ): ConfigType;
}
