/**
 * events.scraper.ts
 *
 * Extrae eventos culturales y académicos de la Agenda ITM.
 * Fuente: https://www.itm.edu.co/agenda-itm/
 *
 * La página muestra los eventos organizados por mes en tablas HTML.
 * Se parsea el contenido con cheerio y se almacenan en la base de datos.
 */

import * as cheerio from 'cheerio';
import { EventCategory } from '@prisma/client';

export interface ScrapedEvent {
  title: string;
  description: string;
  category: EventCategory;
  startDate: Date;
  endDate: Date;
  location: string;
  maxCapacity: number | null;
}

// ── Mapeo de categorías ITM → EventCategory ──────────────────────────────────

const CATEGORY_MAP: Record<string, EventCategory> = {
  literatura: EventCategory.cultural,
  libro: EventCategory.cultural,
  audiovisual: EventCategory.cultural,
  música: EventCategory.cultural,
  musica: EventCategory.cultural,
  danza: EventCategory.cultural,
  'artes visuales': EventCategory.cultural,
  artes: EventCategory.cultural,
  arte: EventCategory.cultural,
  cine: EventCategory.cultural,
  cultura: EventCategory.cultural,
  astronomía: EventCategory.academic,
  astronomia: EventCategory.academic,
  ciencia: EventCategory.academic,
  educación: EventCategory.academic,
  educacion: EventCategory.academic,
  académico: EventCategory.academic,
  academico: EventCategory.academic,
  taller: EventCategory.workshop,
  workshop: EventCategory.workshop,
  bienestar: EventCategory.wellness,
  salud: EventCategory.wellness,
  deporte: EventCategory.sport,
  deportes: EventCategory.sport,
  sport: EventCategory.sport,
  narración: EventCategory.cultural,
  narracion: EventCategory.cultural,
  extensión: EventCategory.academic,
  extension: EventCategory.academic,
};

export function mapCategory(rawCategory: string): EventCategory {
  const lower = rawCategory.toLowerCase().trim();
  for (const [key, value] of Object.entries(CATEGORY_MAP)) {
    if (lower.includes(key)) return value;
  }
  return EventCategory.cultural; // default para eventos culturales del ITM
}

// ── Parser de fechas en texto español ────────────────────────────────────────

const MONTHS: Record<string, number> = {
  enero: 0, febrero: 1, marzo: 2, abril: 3, mayo: 4, junio: 5,
  julio: 6, agosto: 7, septiembre: 8, octubre: 9, noviembre: 10, diciembre: 11,
};

/**
 * Convierte una cadena como "25 de abril" o "2-3 de abril" en fechas.
 * Devuelve { startDate, endDate } usando el año proporcionado.
 */
export function parseDateRange(
  rawDate: string,
  contextYear: number,
  contextMonth?: number,
): { startDate: Date; endDate: Date } | null {
  const normalized = rawDate.toLowerCase().trim();

  // "todos los miércoles" o "todos los martes" → no se scrapean como evento puntual
  if (normalized.startsWith('todos los') || normalized.startsWith('todo')) {
    return null;
  }

  // Detectar mes explícito: "25 de abril", "2-3 de abril", "1-11 de mayo"
  const withMonth = normalized.match(/(\d+)(?:-(\d+))?\s+de\s+(\w+)/);
  if (withMonth) {
    const day1 = parseInt(withMonth[1], 10);
    const day2 = withMonth[2] ? parseInt(withMonth[2], 10) : day1;
    const monthName = withMonth[3];
    const month = MONTHS[monthName] ?? contextMonth ?? new Date().getMonth();

    const startDate = new Date(contextYear, month, day1, 8, 0, 0);
    const endDate = new Date(contextYear, month, day2, 18, 0, 0);
    return { startDate, endDate };
  }

  // Solo número de día: "9", "16" → usar mes de contexto
  const dayOnly = normalized.match(/^(\d+)$/);
  if (dayOnly && contextMonth !== undefined) {
    const day = parseInt(dayOnly[1], 10);
    const startDate = new Date(contextYear, contextMonth, day, 8, 0, 0);
    const endDate = new Date(contextYear, contextMonth, day, 18, 0, 0);
    return { startDate, endDate };
  }

  return null;
}

// ── Fetch de la página de la Agenda ITM ──────────────────────────────────────

export async function fetchAgendaITMPage(): Promise<string | null> {
  try {
    const response = await fetch('https://www.itm.edu.co/agenda-itm/', {
      signal: AbortSignal.timeout(15000),
      headers: {
        'User-Agent': 'BienestarITM-Bot/1.0 (+https://www.itm.edu.co)',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'es-CO,es;q=0.9',
      },
    });
    if (!response.ok) return null;
    return response.text();
  } catch {
    return null;
  }
}

// ── Parser principal ──────────────────────────────────────────────────────────

export function scrapeAgendaITM(html: string, targetYear: number): ScrapedEvent[] {
  const $ = cheerio.load(html);
  const events: ScrapedEvent[] = [];

  // La agenda agrupa eventos por mes en secciones h2/h3 + tablas
  // Estructura típica: <h2>ABRIL 2025</h2> <table>...</table>
  let currentMonth: number | undefined;

  $('h2, h3, table').each((_i, el) => {
    const tag = (el as { tagName?: string }).tagName?.toLowerCase();

    if (tag === 'h2' || tag === 'h3') {
      const text = $(el).text().toLowerCase();
      // Detectar nombre de mes en el encabezado
      for (const [name, idx] of Object.entries(MONTHS)) {
        if (text.includes(name)) {
          currentMonth = idx;
          break;
        }
      }
      return;
    }

    if (tag === 'table' && currentMonth !== undefined) {
      // Iterar filas de la tabla (saltar encabezado)
      $(el).find('tr').each((rowIdx, row) => {
        if (rowIdx === 0) return; // skip header row

        const cells = $(row).find('td');
        if (cells.length < 2) return;

        const eventTitle = $(cells[0]).text().trim();
        const rawDate    = $(cells[1]).text().trim();
        const location   = cells.length >= 3 ? $(cells[2]).text().trim() : 'Campus ITM';
        const description = cells.length >= 4 ? $(cells[3]).text().trim() : '';
        const rawCategory = cells.length >= 5 ? $(cells[4]).text().trim() : '';

        if (!eventTitle || eventTitle.length < 3) return;

        const dates = parseDateRange(rawDate, targetYear, currentMonth);
        if (!dates) return; // eventos recurrentes o sin fecha parseable

        const event: ScrapedEvent = {
          title: eventTitle,
          description: description || `Evento cultural ITM: ${eventTitle}`,
          category: mapCategory(rawCategory),
          startDate: dates.startDate,
          endDate: dates.endDate,
          location: location || 'Campus ITM — sede por confirmar',
          maxCapacity: null,
        };

        events.push(event);
      });
    }
  });

  return events;
}
