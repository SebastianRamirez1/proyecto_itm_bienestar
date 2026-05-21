import { CafeteriaRepository } from './cafeteria.repository';
import {
  fetchITMCafeteriaPage,
  scrapeMenu,
  buildFallbackMenu,
} from './cafeteria.scraper';
import { redis, CacheTTL } from '../../shared/cache/redis';

const CACHE_PREFIX = 'cafeteria:menu';
const SCHEDULE = {
  weekdays: 'Lunes a viernes: 7:00am – 8:00pm',
  saturday: 'Sábados: 7:00am – 3:00pm',
  sunday: 'Domingos: Cerrado',
};
const PRICES_STATIC = {
  'Almuerzo completo (estudiante)': 8500,
  'Almuerzo completo (docente)': 10000,
  'Solo sopa': 3000,
  'Solo plato principal': 6500,
  'Bebida': 2000,
};

export class CafeteriaService {
  constructor(private readonly repo = new CafeteriaRepository()) {}

  async getMenu(dateStr?: string): Promise<{ menu: unknown; stale: boolean }> {
    const date = dateStr ? new Date(dateStr) : new Date();
    const cacheKey = `${CACHE_PREFIX}:${date.toISOString().split('T')[0]}`;

    const cached = await redis.get(cacheKey);
    if (cached) return { menu: JSON.parse(cached), stale: false };

    const dbMenu = await this.repo.findMenuByDate(date);
    if (dbMenu) {
      await redis.setex(cacheKey, CacheTTL.CAFETERIA, JSON.stringify(dbMenu));
      return { menu: dbMenu, stale: false };
    }

    return this.scrapeAndStore(date, cacheKey);
  }

  async scrapeAndStore(
    date: Date,
    cacheKey?: string,
  ): Promise<{ menu: unknown; stale: boolean }> {
    const key = cacheKey ?? `${CACHE_PREFIX}:${date.toISOString().split('T')[0]}`;

    try {
      const html = await fetchITMCafeteriaPage();
      if (html) {
        const scraped = await scrapeMenu(html);
        if (scraped) {
          const menu = await this.repo.upsertMenu(date, scraped.items, scraped.prices);
          await redis.setex(key, CacheTTL.CAFETERIA, JSON.stringify(menu));
          return { menu, stale: false };
        }
      }
    } catch {
      // fall through to fallback
    }

    // Fallback: latest known menu marked as stale
    const latest = await this.repo.findLatestMenu();
    if (latest) {
      return { menu: latest, stale: true };
    }

    // Ultimate fallback: hardcoded demo data
    const fallback = buildFallbackMenu();
    const demoMenu = await this.repo.upsertMenu(date, fallback.items, fallback.prices);
    await redis.setex(key, CacheTTL.CAFETERIA, JSON.stringify(demoMenu));
    return { menu: demoMenu, stale: true };
  }

  getSchedule() {
    return SCHEDULE;
  }

  getPrices() {
    return PRICES_STATIC;
  }
}
