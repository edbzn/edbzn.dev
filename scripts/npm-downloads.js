/**
 * npm download counts for every package an npm user maintains, summed per
 * month.
 *
 * The downloads API returns at most 18 months per request and rate-limits
 * hard (about ten quick requests, then HTTP 429), so fetching the full
 * history takes a few minutes. Past months never change, so the history is
 * kept in `src/data/npm-downloads.json` and each build only fetches the days
 * after it (one request per package, see `sourceNodes` in gatsby-node.js).
 *
 * Refresh the snapshot with `pnpm update:npm-downloads`.
 */

const fs = require('node:fs/promises');
const path = require('node:path');

const SNAPSHOT_PATH = path.join(__dirname, '../src/data/npm-downloads.json');
const DAY = 24 * 60 * 60 * 1000;
// Under the API's 18-month cap per request
const CHUNK_DAYS = 365;
// Pause between requests, and backoff on HTTP 429
const REQUEST_GAP = 700;
const RETRY_DELAYS = [2000, 4000, 8000, 16000, 32000];

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const isoDay = (date) => date.toISOString().slice(0, 10);

async function fetchJson(url) {
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
    if (res.ok) {
      return res.json();
    }
    if (res.status !== 429 || attempt >= RETRY_DELAYS.length) {
      throw new Error(`HTTP ${res.status} for ${url}`);
    }
    await wait(RETRY_DELAYS[attempt]);
  }
}

/** Names of the packages `username` maintains. */
async function fetchNpmPackages(username) {
  const { objects } = await fetchJson(
    `https://registry.npmjs.org/-/v1/search?text=maintainer:${username}&size=250`
  );
  return objects.map((object) => object.package.name).sort();
}

async function fetchCreatedDay(name) {
  const { time } = await fetchJson(
    `https://registry.npmjs.org/${name.replace('/', '%2F')}`
  );
  return time.created.slice(0, 10);
}

/**
 * Sums the downloads of `packages` per month (`YYYY-MM`), from `since` (or
 * each package's creation day) to `until`, both `YYYY-MM-DD` and included.
 * Requests run one at a time to stay under the rate limit.
 */
async function fetchMonthlyDownloads(packages, { since, until }) {
  const months = {};
  const end = new Date(until);

  for (const name of packages) {
    let start = new Date(since || (await fetchCreatedDay(name)));
    while (start <= end) {
      const chunkEnd = new Date(
        Math.min(start.getTime() + (CHUNK_DAYS - 1) * DAY, end.getTime())
      );
      const { downloads } = await fetchJson(
        `https://api.npmjs.org/downloads/range/` +
          `${isoDay(start)}:${isoDay(chunkEnd)}/${name}`
      );
      for (const { day, downloads: count } of downloads) {
        const month = day.slice(0, 7);
        months[month] = (months[month] || 0) + count;
      }
      start = new Date(chunkEnd.getTime() + DAY);
      await wait(REQUEST_GAP);
    }
  }

  return months;
}

/** Last day of the month before `date`, as `YYYY-MM-DD`. */
function endOfPreviousMonth(date) {
  return isoDay(
    new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 0))
  );
}

async function readSnapshot() {
  try {
    return JSON.parse(await fs.readFile(SNAPSHOT_PATH, 'utf8'));
  } catch {
    return null;
  }
}

/**
 * Writes the full monthly history of `username`'s packages, up to the end
 * of the last complete month, to the snapshot file.
 */
async function updateSnapshot(username) {
  const packages = await fetchNpmPackages(username);
  const until = endOfPreviousMonth(new Date());
  const months = await fetchMonthlyDownloads(packages, { until });
  const snapshot = {
    username,
    until,
    packages,
    months: Object.fromEntries(Object.entries(months).sort()),
  };
  await fs.writeFile(SNAPSHOT_PATH, `${JSON.stringify(snapshot, null, 2)}\n`);
  return snapshot;
}

module.exports = {
  DAY,
  isoDay,
  fetchNpmPackages,
  fetchMonthlyDownloads,
  readSnapshot,
  updateSnapshot,
};

if (require.main === module) {
  import('../gatsby-config.mjs')
    .then(({ default: config }) =>
      updateSnapshot(config.siteMetadata.npm.username)
    )
    .then(
      ({ packages, until, months }) => {
        const total = Object.values(months).reduce((a, b) => a + b, 0);
        console.log(
          `Wrote ${path.relative(process.cwd(), SNAPSHOT_PATH)}: ` +
            `${packages.length} packages, ${total.toLocaleString('en-US')} ` +
            `downloads up to ${until}`
        );
      },
      (error) => {
        console.error(error);
        process.exit(1);
      }
    );
}
