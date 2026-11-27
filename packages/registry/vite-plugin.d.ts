export function applyViteExtenders(
  config: Record<string, unknown>,
  env: { command: string; mode: string; isSsrBuild?: boolean },
  files: string[],
  load?: (file: string) => Promise<unknown>,
): Promise<Record<string, unknown>>;

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
