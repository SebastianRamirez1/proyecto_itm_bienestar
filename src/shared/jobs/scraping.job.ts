import cron from 'node-cron';
import { CafeteriaService } from '../../modules/cafeteria/cafeteria.service';
import { EventsService } from '../../modules/events/events.service';

const cafeteriaService = new CafeteriaService();
const eventsService    = new EventsService();

export function startScrapingJobs() {
  // ── Cafetería ──────────────────────────────────────────────────────────────
  // Corre a las 7:30am de lunes a viernes (la cafetería abre a las 7am)
  cron.schedule('30 7 * * 1-5', async () => {
    console.info('[cron] Running cafeteria menu scrape...');
    try {
      await cafeteriaService.scrapeAndStore(new Date());
      console.info('[cron] Cafeteria menu scrape completed.');
    } catch (err) {
      console.error('[cron] Cafeteria scrape failed:', (err as Error).message);
    }
  });

  // Reintento a las 11am si el menú no se obtuvo en la mañana
  cron.schedule('0 11 * * 1-5', async () => {
    const today = new Date();
    const existing = await cafeteriaService.getMenu(today.toISOString().split('T')[0]);
    if (existing.stale) {
      console.info('[cron] Retrying cafeteria scrape (stale data detected)...');
      await cafeteriaService.scrapeAndStore(today);
    }
  });

  // ── Agenda ITM — Eventos ───────────────────────────────────────────────────
  // Corre todos los lunes a las 6am para capturar la agenda semanal actualizada
  cron.schedule('0 6 * * 1', async () => {
    console.info('[cron] Running ITM Agenda events scrape...');
    try {
      const { created } = await eventsService.scrapeAndStore();
      console.info(`[cron] ITM Agenda scrape completed: ${created} new events.`);
    } catch (err) {
      console.error('[cron] ITM Agenda scrape failed:', (err as Error).message);
    }
  });
}
