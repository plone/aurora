import { execFile } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { acceptanceApiURL } from './backend';

const execFileAsync = promisify(execFile);
const composeFile = fileURLToPath(
  new URL('../../../acceptance/nick-addon/compose.yml', import.meta.url),
);
const compose = ['compose', '-p', 'aurora-nick-fixture', '-f', composeFile];

/**
 * Put the dedicated acceptance stack back into its seeded state. The
 * acceptance add-on recreates the database from a template copy taken right
 * after seeding; see acceptance/nick-addon/src/profiles/default/index.ts.
 */
export async function resetNick(): Promise<void> {
  const apiURL = new URL(acceptanceApiURL());
  const port = process.env.NICK_ACCEPTANCE_PORT || '55002';
  if (
    apiURL.protocol !== 'http:' ||
    !['127.0.0.1', 'localhost'].includes(apiURL.hostname) ||
    apiURL.port !== port ||
    apiURL.pathname !== '/' ||
    apiURL.search ||
    apiURL.hash
  ) {
    throw new Error('Nick acceptance tests require the local disposable stack');
  }
  const response = await fetch(new URL('/@aurora-acceptance-reset', apiURL), {
    method: 'POST',
    signal: AbortSignal.timeout(60_000),
  });
  if (response.status !== 204) {
    throw new Error(
      `Nick acceptance reset failed: ${response.status} ${await response.text()}`,
    );
  }
}

/** Nick's log lines since `since`: the stack lives for the whole run. */
export async function nickLogs(since: Date): Promise<string> {
  const { stdout } = await execFileAsync(
    'docker',
    [...compose, 'logs', '--no-color', '--since', since.toISOString(), 'nick'],
    { timeout: 15_000, maxBuffer: 5 * 1024 * 1024 },
  );
  return stdout;
}
