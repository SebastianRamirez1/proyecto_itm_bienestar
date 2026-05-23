import { redis } from '../../shared/cache/redis';

const MODULES = ['alerts', 'cafeteria', 'health', 'library', 'events', 'auth', 'webhooks', 'status', 'other'] as const;

type ModuleName = typeof MODULES[number];

export interface MetricsData {
  uptime: {
    seconds: number;
    human: string;
  };
  requests: {
    total: number;
    byModule: Record<ModuleName, number>;
  };
  latency: {
    avgMs: Record<ModuleName, number>;
  };
}

function formatUptime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export class MetricsService {
  async getMetrics(): Promise<MetricsData> {
    // Batch all Redis reads in a single pipeline
    const pipeline = redis.pipeline();

    pipeline.get('metrics:requests:total');
    for (const mod of MODULES) {
      pipeline.get(`metrics:requests:${mod}`);
    }
    for (const mod of MODULES) {
      pipeline.get(`metrics:latency:sum:${mod}`);
      pipeline.get(`metrics:latency:count:${mod}`);
    }

    const results = await pipeline.exec() ?? [];

    // Parse total requests (index 0)
    const total = parseInt((results[0]?.[1] as string) ?? '0', 10) || 0;

    // Parse per-module request counts (indices 1..MODULES.length)
    const byModule = {} as Record<ModuleName, number>;
    MODULES.forEach((mod, i) => {
      byModule[mod] = parseInt((results[1 + i]?.[1] as string) ?? '0', 10) || 0;
    });

    // Parse latency averages (sum/count pairs after the request counts)
    const avgMs = {} as Record<ModuleName, number>;
    const offset = 1 + MODULES.length;
    MODULES.forEach((mod, i) => {
      const sum   = parseFloat((results[offset + i * 2]?.[1] as string)     ?? '0') || 0;
      const count = parseInt((results[offset + i * 2 + 1]?.[1] as string)   ?? '0', 10) || 0;
      avgMs[mod] = count > 0 ? Math.round(sum / count) : 0;
    });

    const uptimeSeconds = Math.floor(process.uptime());

    return {
      uptime: {
        seconds: uptimeSeconds,
        human: formatUptime(uptimeSeconds),
      },
      requests: { total, byModule },
      latency:  { avgMs },
    };
  }

  /** Called by the onResponse hook after every request. */
  async record(module: string, elapsedMs: number): Promise<void> {
    const mod = MODULES.includes(module as ModuleName) ? module : 'other';

    const pipeline = redis.pipeline();
    pipeline.incr('metrics:requests:total');
    pipeline.incr(`metrics:requests:${mod}`);
    pipeline.incrbyfloat(`metrics:latency:sum:${mod}`, elapsedMs);
    pipeline.incr(`metrics:latency:count:${mod}`);
    await pipeline.exec();
  }
}
