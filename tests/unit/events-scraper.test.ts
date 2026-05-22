import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  mapCategory,
  parseDateRange,
  scrapeAgendaITM,
  fetchAgendaITMPage,
} from '../../src/modules/events/events.scraper';
import { EventCategory } from '@prisma/client';

afterEach(() => {
  vi.restoreAllMocks();
});

// ── mapCategory ──────────────────────────────────────────────────────────────

describe('mapCategory', () => {
  it('maps "Literatura" to cultural', () => {
    expect(mapCategory('Literatura')).toBe(EventCategory.cultural);
  });

  it('maps "Música" (with accent) to cultural', () => {
    expect(mapCategory('Música')).toBe(EventCategory.cultural);
  });

  it('maps "Musica" (without accent) to cultural', () => {
    expect(mapCategory('Musica')).toBe(EventCategory.cultural);
  });

  it('maps "Artes Visuales" to cultural', () => {
    expect(mapCategory('Artes Visuales')).toBe(EventCategory.cultural);
  });

  it('maps "Danza" to cultural', () => {
    expect(mapCategory('Danza')).toBe(EventCategory.cultural);
  });

  it('maps "Cine" to cultural', () => {
    expect(mapCategory('Cine')).toBe(EventCategory.cultural);
  });

  it('maps "Astronomía" to academic', () => {
    expect(mapCategory('Astronomía')).toBe(EventCategory.academic);
  });

  it('maps "Ciencia" to academic', () => {
    expect(mapCategory('Ciencia')).toBe(EventCategory.academic);
  });

  it('maps "Educación" to academic', () => {
    expect(mapCategory('Educación')).toBe(EventCategory.academic);
  });

  it('maps "Taller" to workshop', () => {
    expect(mapCategory('Taller')).toBe(EventCategory.workshop);
  });

  it('maps "Bienestar" to wellness', () => {
    expect(mapCategory('Bienestar')).toBe(EventCategory.wellness);
  });

  it('maps "Salud" to wellness', () => {
    expect(mapCategory('Salud')).toBe(EventCategory.wellness);
  });

  it('maps "Deportes" to sport', () => {
    expect(mapCategory('Deportes')).toBe(EventCategory.sport);
  });

  it('maps "Deporte" to sport', () => {
    expect(mapCategory('Deporte')).toBe(EventCategory.sport);
  });

  it('defaults to cultural for unknown categories', () => {
    expect(mapCategory('Desconocido')).toBe(EventCategory.cultural);
  });

  it('defaults to cultural for empty string', () => {
    expect(mapCategory('')).toBe(EventCategory.cultural);
  });

  it('is case-insensitive', () => {
    expect(mapCategory('MÚSICA')).toBe(EventCategory.cultural);
    expect(mapCategory('taller')).toBe(EventCategory.workshop);
  });

  it('matches partial strings (substring match)', () => {
    // "Narración oral" contains "narración"
    expect(mapCategory('Narración oral')).toBe(EventCategory.cultural);
  });
});

// ── parseDateRange ────────────────────────────────────────────────────────────

describe('parseDateRange', () => {
  const YEAR = 2026;

  it('parses a single day with month: "25 de abril"', () => {
    const result = parseDateRange('25 de abril', YEAR);
    expect(result).not.toBeNull();
    expect(result!.startDate).toEqual(new Date(YEAR, 3, 25, 8, 0, 0)); // abril = mes 3
    expect(result!.endDate).toEqual(new Date(YEAR, 3, 25, 18, 0, 0));
  });

  it('parses a date range: "2-3 de abril"', () => {
    const result = parseDateRange('2-3 de abril', YEAR);
    expect(result).not.toBeNull();
    expect(result!.startDate).toEqual(new Date(YEAR, 3, 2, 8, 0, 0));
    expect(result!.endDate).toEqual(new Date(YEAR, 3, 3, 18, 0, 0));
  });

  it('parses a multi-day range: "1-11 de mayo"', () => {
    const result = parseDateRange('1-11 de mayo', YEAR);
    expect(result).not.toBeNull();
    expect(result!.startDate).toEqual(new Date(YEAR, 4, 1, 8, 0, 0));
    expect(result!.endDate).toEqual(new Date(YEAR, 4, 11, 18, 0, 0));
  });

  it('parses a day-only string with contextMonth', () => {
    const result = parseDateRange('9', YEAR, 4); // mayo = 4
    expect(result).not.toBeNull();
    expect(result!.startDate).toEqual(new Date(YEAR, 4, 9, 8, 0, 0));
    expect(result!.endDate).toEqual(new Date(YEAR, 4, 9, 18, 0, 0));
  });

  it('returns null for day-only string without contextMonth', () => {
    const result = parseDateRange('9', YEAR, undefined);
    expect(result).toBeNull();
  });

  it('returns null for "Todos los miércoles"', () => {
    expect(parseDateRange('Todos los miércoles', YEAR)).toBeNull();
  });

  it('returns null for "Todos los martes"', () => {
    expect(parseDateRange('Todos los martes', YEAR)).toBeNull();
  });

  it('returns null for "Todo el semestre"', () => {
    expect(parseDateRange('Todo el semestre', YEAR)).toBeNull();
  });

  it('returns null for unparseable strings', () => {
    expect(parseDateRange('Por confirmar', YEAR)).toBeNull();
    expect(parseDateRange('', YEAR)).toBeNull();
  });

  it('handles all 12 months correctly', () => {
    const months = [
      'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
      'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
    ];
    months.forEach((month, idx) => {
      const result = parseDateRange(`15 de ${month}`, YEAR);
      expect(result).not.toBeNull();
      expect(result!.startDate.getMonth()).toBe(idx);
    });
  });
});

// ── scrapeAgendaITM ───────────────────────────────────────────────────────────

// HTML mínimo que reproduce la estructura real de itm.edu.co/agenda-itm/
const buildMockHtml = (month: string, rows: string) => `
  <html><body>
    <h2>${month.toUpperCase()}</h2>
    <table>
      <tr><th>Evento</th><th>Fecha</th><th>Lugar</th><th>Descripción</th><th>Categoría</th></tr>
      ${rows}
    </table>
  </body></html>
`;

describe('scrapeAgendaITM', () => {
  it('returns an empty array for HTML with no matching structure', () => {
    const result = scrapeAgendaITM('<html><body><p>Sin eventos</p></body></html>', 2026);
    expect(result).toEqual([]);
  });

  it('parses a single event correctly', () => {
    const html = buildMockHtml('ABRIL', `
      <tr>
        <td>Festival de la Canción</td>
        <td>25 de abril</td>
        <td>Campus Fraternidad</td>
        <td>Gran festival musical estudiantil</td>
        <td>Música</td>
      </tr>
    `);

    const events = scrapeAgendaITM(html, 2026);
    expect(events).toHaveLength(1);
    expect(events[0].title).toBe('Festival de la Canción');
    expect(events[0].category).toBe(EventCategory.cultural);
    expect(events[0].location).toBe('Campus Fraternidad');
    expect(events[0].description).toBe('Gran festival musical estudiantil');
    expect(events[0].startDate).toEqual(new Date(2026, 3, 25, 8, 0, 0));
    expect(events[0].endDate).toEqual(new Date(2026, 3, 25, 18, 0, 0));
    expect(events[0].maxCapacity).toBeNull();
  });

  it('skips recurring events ("Todos los miércoles")', () => {
    const html = buildMockHtml('ABRIL', `
      <tr>
        <td>Club de Lectura</td>
        <td>Todos los miércoles</td>
        <td>Biblioteca Robledo</td>
        <td>Encuentro literario</td>
        <td>Literatura</td>
      </tr>
    `);

    const events = scrapeAgendaITM(html, 2026);
    expect(events).toHaveLength(0);
  });

  it('skips rows with titles shorter than 3 characters', () => {
    const html = buildMockHtml('MAYO', `
      <tr>
        <td>OK</td>
        <td>10 de mayo</td>
        <td>Campus</td>
        <td>Descripción</td>
        <td>Cultura</td>
      </tr>
    `);

    const events = scrapeAgendaITM(html, 2026);
    expect(events).toHaveLength(0);
  });

  it('skips the header row (rowIdx === 0)', () => {
    const html = buildMockHtml('JUNIO', `
      <tr>
        <td>Observaciones Nocturnas</td>
        <td>3 de junio</td>
        <td>Observatorio, Campus Fraternidad</td>
        <td>Sesión de astronomía</td>
        <td>Astronomía</td>
      </tr>
    `);

    // The header tr (rowIdx=0) is the <th> row built by buildMockHtml;
    // the event row is rowIdx=1 → should be parsed
    const events = scrapeAgendaITM(html, 2026);
    expect(events).toHaveLength(1);
    expect(events[0].category).toBe(EventCategory.academic);
  });

  it('uses fallback description when description cell is empty', () => {
    const html = buildMockHtml('JULIO', `
      <tr>
        <td>Taller de Caricatura</td>
        <td>4 de julio</td>
        <td>Campus Fraternidad</td>
        <td></td>
        <td>Taller</td>
      </tr>
    `);

    const events = scrapeAgendaITM(html, 2026);
    expect(events[0].description).toBe('Evento cultural ITM: Taller de Caricatura');
  });

  it('uses "Campus ITM" as fallback location when cell is empty', () => {
    const html = `
      <html><body>
        <h2>AGOSTO</h2>
        <table>
          <tr><th>Evento</th><th>Fecha</th></tr>
          <tr><td>Evento sin lugar</td><td>10 de agosto</td></tr>
        </table>
      </body></html>
    `;

    const events = scrapeAgendaITM(html, 2026);
    expect(events[0].location).toBe('Campus ITM');
  });

  it('parses multiple events across multiple months', () => {
    const html = `
      <html><body>
        <h2>MAYO</h2>
        <table>
          <tr><th>Evento</th><th>Fecha</th><th>Lugar</th><th>Desc</th><th>Cat</th></tr>
          <tr><td>Concierto de Jazz</td><td>9 de mayo</td><td>Fraternidad</td><td>Jazz en vivo</td><td>Música</td></tr>
        </table>
        <h2>JUNIO</h2>
        <table>
          <tr><th>Evento</th><th>Fecha</th><th>Lugar</th><th>Desc</th><th>Cat</th></tr>
          <tr><td>Feria de Ciencias</td><td>3 de junio</td><td>Robledo</td><td>Exhibición</td><td>Ciencia</td></tr>
          <tr><td>Taller de Fotografía</td><td>15 de junio</td><td>Robledo</td><td>Aprende fotografía</td><td>Taller</td></tr>
        </table>
      </body></html>
    `;

    const events = scrapeAgendaITM(html, 2026);
    expect(events).toHaveLength(3);
    expect(events[0].title).toBe('Concierto de Jazz');
    expect(events[0].startDate.getMonth()).toBe(4); // mayo
    expect(events[1].title).toBe('Feria de Ciencias');
    expect(events[1].category).toBe(EventCategory.academic);
    expect(events[1].startDate.getMonth()).toBe(5); // junio
    expect(events[2].category).toBe(EventCategory.workshop);
  });

  it('ignores tables that appear before any month heading', () => {
    const html = `
      <html><body>
        <table>
          <tr><th>Evento</th><th>Fecha</th></tr>
          <tr><td>Evento huérfano</td><td>5 de marzo</td></tr>
        </table>
        <h2>ABRIL</h2>
        <table>
          <tr><th>Evento</th><th>Fecha</th><th>Lugar</th><th>Desc</th><th>Cat</th></tr>
          <tr><td>Evento válido</td><td>10 de abril</td><td>Robledo</td><td>OK</td><td>Cultura</td></tr>
        </table>
      </body></html>
    `;

    const events = scrapeAgendaITM(html, 2026);
    expect(events).toHaveLength(1);
    expect(events[0].title).toBe('Evento válido');
  });

  it('also detects month headings in h3 tags', () => {
    const html = `
      <html><body>
        <h3>septiembre 2026</h3>
        <table>
          <tr><th>Evento</th><th>Fecha</th><th>Lugar</th><th>Desc</th><th>Cat</th></tr>
          <tr><td>Semillero Astronomía</td><td>10 de septiembre</td><td>Observatorio</td><td>Astros</td><td>Astronomía</td></tr>
        </table>
      </body></html>
    `;

    const events = scrapeAgendaITM(html, 2026);
    expect(events).toHaveLength(1);
    expect(events[0].startDate.getMonth()).toBe(8); // septiembre = 8
  });
});

// ── fetchAgendaITMPage ────────────────────────────────────────────────────────

describe('fetchAgendaITMPage', () => {
  it('returns HTML content when the request succeeds', async () => {
    const mockHtml = '<html><body><h2>ABRIL</h2></body></html>';
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      text: async () => mockHtml,
    } as Response);

    const result = await fetchAgendaITMPage();
    expect(result).toBe(mockHtml);
  });

  it('returns null when the HTTP response is not ok (503)', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 503,
    } as Response);

    const result = await fetchAgendaITMPage();
    expect(result).toBeNull();
  });

  it('returns null when fetch throws a network error', async () => {
    vi.spyOn(global, 'fetch').mockRejectedValueOnce(new Error('Network failure'));

    const result = await fetchAgendaITMPage();
    expect(result).toBeNull();
  });

  it('returns null when fetch times out', async () => {
    vi.spyOn(global, 'fetch').mockRejectedValueOnce(new DOMException('Timeout', 'AbortError'));

    const result = await fetchAgendaITMPage();
    expect(result).toBeNull();
  });
});
