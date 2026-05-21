import cron from 'node-cron';
import { CafeteriaService } from '../../modules/cafeteria/cafeteria.service';

const cafeteriaService = new CafeteriaService();

export function startScrapingJobs() {
  // Runs at 7:30am Monday–Friday (cafetería opens 7am, menu ready by 7:30)
  cron.schedule('30 7 * * 1-5', async () => {
    console.info('[cron] Running cafeteria menu scrape...');
    try {
      await cafeteriaService.scrapeAndStore(new Date());
      console.info('[cron] Cafeteria menu scrape completed.');
    } catch (err) {
      console.error('[cron] Cafeteria scrape failed:', (err as Error).message);
    }
  });

  // Re-check at 11am in case the morning job failed
  cron.schedule('0 11 * * 1-5', async () => {
    const today = new Date();
    const existing = await cafeteriaService.getMenu(today.toISOString().split('T')[0]);
    if (existing.stale) {
      console.info('[cron] Retrying cafeteria scrape (stale data detected)...');
      await cafeteriaService.scrapeAndStore(today);
    }
  });
}
