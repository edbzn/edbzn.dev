// Chart datasets per workspace size, from the benchmark's results/quick*/report (quick specs)
// and results/slow*/raw (slow projects, valid runs only).
import runs12 from './12/runs.json';
import runs50 from './50/runs.json';
import runs100 from './100/runs.json';
import tax12 from './12/startup-tax.json';
import tax50 from './50/startup-tax.json';
import tax100 from './100/startup-tax.json';
import timelines12 from './12/timelines.json';
import timelines50 from './50/timelines.json';
import timelines100 from './100/timelines.json';
import resources12 from './12/resources.json';
import resources50 from './50/resources.json';
import resources100 from './100/resources.json';
import slowRuns12 from './slow/12/runs.json';
import slowRuns50 from './slow/50/runs.json';
import slowRuns100 from './slow/100/runs.json';
import slowTimelines12 from './slow/12/timelines.json';
import slowTimelines50 from './slow/50/timelines.json';
import slowTimelines100 from './slow/100/timelines.json';
// Work (task durations summed / parallelism), wall and biggest task per run, from the raw Nx profiles.
import limitsAll from './limits.json';
import slowLimits from './slow/limits.json';
// Real Nx Agents runs: slow projects, 100 projects, 8 agents of 4 vCPU, from the agents/*-slow-100
// branches of the benchmark repo.
import agentsAll from './agents.json';

// RAM at the busiest moments of the all-runner --parallel=8 runs (99th percentile), from each run's
// samples.json.gz; attached to the matching run.
import memory from './memory.json';

const withMemory = (workload, size, rows) =>
  rows.map((r) => {
    const m =
      r.runner === 'all' &&
      r.parallel === 8 &&
      r.scenario === 'full' &&
      (r.shard_target_s ?? 10) === 10
        ? memory.find(
            (x) =>
              x.workload === workload &&
              x.size === size &&
              x.variant === r.variant
          )
        : null;
    return m ? { ...r, mem_gb: m.mem_gb } : r;
  });
const quickRuns = {
  12: withMemory('quick', 12, runs12),
  50: withMemory('quick', 50, runs50),
  100: withMemory('quick', 100, runs100),
};
const slowRuns = {
  12: withMemory('slow', 12, slowRuns12),
  50: withMemory('slow', 50, slowRuns50),
  100: withMemory('slow', 100, slowRuns100),
};

export const runs = { quick: quickRuns, slow: slowRuns };
export const tax = { 12: tax12, 50: tax50, 100: tax100 };
export const timelines = {
  quick: { 12: timelines12, 50: timelines50, 100: timelines100 },
  slow: { 12: slowTimelines12, 50: slowTimelines50, 100: slowTimelines100 },
};
export const resources = {
  12: resources12,
  50: resources50,
  100: resources100,
};
export const limits = { quick: limitsAll, slow: slowLimits };
export const agents = agentsAll;
