import { execFile } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { acceptanceApiURL } from './backend';

const execFileAsync = promisify(execFile);
const composeFile = fileURLToPath(
  new URL('../../../acceptance/nick-addon/compose.yml', import.meta.url),
);
const compose = ['compose', '-p', 'aurora-nick-fixture', '-f', composeFile];

/** Recreate only the dedicated acceptance stack and its disposable volumes. */
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
  await execFileAsync('docker', [...compose, 'down', '--volumes'], {
    timeout: 120_000,
  });
  await execFileAsync('docker', [...compose, 'up', '-d', '--wait'], {
    timeout: 120_000,
  });
}

export async function nickLogs(): Promise<string> {
  const { stdout } = await execFileAsync(
    'docker',
    [...compose, 'logs', '--no-color', 'nick'],
    { timeout: 15_000, maxBuffer: 5 * 1024 * 1024 },
  );
  return stdout;
}
