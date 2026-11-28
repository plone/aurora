/**
 * Runtime registration of the Aurora acceptance add-on.
 *
 * With `AURORA_ACCEPTANCE_RESET=1`, it registers `POST /@aurora-acceptance-reset`,
 * which puts the database back into the state it had right after Nick
 * seeded the profiles, like Plone's RobotRemote fixture does between tests.
 *
 * The first reset copies the seeded database to a template database. Every
 * reset then drops the database and recreates it from the template, which is
 * a file copy in PostgreSQL and takes a fraction of a second. Blobs must be
 * stored in the database (`BLOBS=db`) so that they are reset too.
 *
 * It is Express middleware, not a Nick route: a route runs inside a request
 * transaction that holds a connection to the database being replaced.
 */
import {
  config,
  jobs,
  knex,
  log,
  middleware,
  scheduledJobs,
} from '@plone/nick';
import pg from 'pg';

const RESET_PATH = '/@aurora-acceptance-reset';

type Request = { method: string; path: string };
type Response = {
  status(code: number): Response;
  json(body: unknown): void;
  end(): void;
};

function connectionSettings() {
  return config.settings.connection as {
    host: string;
    port: number;
    user: string;
    password: string;
    database: string;
  };
}

function quote(identifier: string) {
  return `"${identifier.replace(/"/g, '""')}"`;
}

/** Run statements on the maintenance database, outside Nick's pool. */
async function maintenance(statements: string[]) {
  const { database: _database, ...connection } = connectionSettings();
  const client = new pg.Client({ ...connection, database: 'postgres' });
  await client.connect();
  try {
    for (const statement of statements) {
      await client.query(statement);
    }
  } finally {
    await client.end();
  }
}

let templateReady = false;
let resetting: Promise<void> | undefined;

async function reset() {
  const { database } = connectionSettings();
  const template = `${database}_aurora_acceptance_template`;

  // Stop what polls the database in this process, then close the pool
  const jobsWereActive = jobs.active;
  const scheduledJobsWereActive = scheduledJobs.active;
  await jobs.stop();
  scheduledJobs.stop();
  await knex.destroy();

  try {
    await maintenance(
      templateReady
        ? [
            `DROP DATABASE ${quote(database)} WITH (FORCE)`,
            `CREATE DATABASE ${quote(database)} TEMPLATE ${quote(template)}`,
          ]
        : [
            `DROP DATABASE IF EXISTS ${quote(template)}`,
            `CREATE DATABASE ${quote(template)} TEMPLATE ${quote(database)}`,
          ],
    );
    templateReady = true;
  } finally {
    knex.initialize();
    if (jobsWereActive) jobs.start();
    if (scheduledJobsWereActive) await scheduledJobs.start();
  }
}

async function resetMiddleware(
  req: Request,
  res: Response,
  next: () => void,
): Promise<void> {
  if (req.method !== 'POST' || req.path !== RESET_PATH) {
    next();
    return;
  }
  try {
    resetting ??= reset().finally(() => {
      resetting = undefined;
    });
    await resetting;
    res.status(204).end();
  } catch (err: any) {
    log.error(`Acceptance reset failed: ${err?.stack || err}`);
    res.status(500).json({ message: String(err?.message || err) });
  }
}

export function init(): void {
  if (process.env.AURORA_ACCEPTANCE_RESET !== '1') {
    return;
  }
  if (config.settings.blobs !== 'db') {
    throw new Error(
      'The Aurora acceptance reset needs BLOBS=db, so that blobs are reset too',
    );
  }
  middleware.register(resetMiddleware);
  log.info(`Aurora acceptance reset enabled at POST ${RESET_PATH}`);
}
