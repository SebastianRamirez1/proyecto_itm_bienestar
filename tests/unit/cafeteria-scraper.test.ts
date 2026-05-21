import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  scrapeMenu,
  buildFallbackMenu,
  fetchITMCafeteriaPage,
} from '../../src/modules/cafeteria/cafeteria.scraper';

afterEach(() => {
  vi.restoreAllMocks();
});

// ── buildFallbackMenu ───────────────────────────────────────────────────────

describe('buildFallbackMenu', () => {
  it('returns a menu with at least one item', () => {
    const result = buildFallbackMenu();
    expect(result.items.length).toBeGreaterThan(0);
  });

  it('returns items with name and category fields', () => {
    const { items } = buildFallbackMenu();
    for (const item of items) {
      expect(item).toHaveProperty('name');
      expect(item).toHaveProperty('category');
      expect(typeof item.name).toBe('string');
    }
  });

  it('returns prices as a non-empty object', () => {
    const { prices } = buildFallbackMenu();
    expect(Object.keys(prices).length).toBeGreaterThan(0);
    for (const value of Object.values(prices)) {
      expect(typeof value).toBe('number');
      expect(value).toBeGreaterThan(0);
    }
  });
});

// ── scrapeMenu ──────────────────────────────────────────────────────────────

describe('scrapeMenu', () => {
  it('returns null when html has no matching menu container', async () => {
    const result = await scrapeMenu('<html><body><p>Nothing here</p></body></html>');
    expect(result).toBeNull();
  });

  it('returns null for empty string', async () => {
    const result = await scrapeMenu('');
    expect(result).toBeNull();
  });

  it('parses items from a .menu-del-dia container', async () => {
    const html = `
      <html><body>
        <div class="menu-del-dia">
          <div class="menu-item"><span class="item-name">Bandeja Paisa</span></div>
          <div class="menu-item"><span class="item-name">Sopa de Lentejas</span></div>
        </div>
      </body></html>
    `;
    const result = await scrapeMenu(html);
    expect(result).not.toBeNull();
    expect(result!.items).toHaveLength(2);
    expect(result!.items[0].name).toBe('Bandeja Paisa');
  });

  it('parses prices from .price-list table', async () => {
    const html = `
      <html><body>
        <div class="menu-del-dia">
          <div class="menu-item"><span class="item-name">Almuerzo</span></div>
        </div>
        <div class="price-list">
          <table>
            <tr class="precio"><td>Almuerzo completo</td><td>$8.500</td></tr>
            <tr class="precio"><td>Solo sopa</td><td>$3.000</td></tr>
          </table>
        </div>
      </body></html>
    `;
    const result = await scrapeMenu(html);
    expect(result).not.toBeNull();
    expect(result!.prices['Almuerzo completo']).toBe(8500);
    expect(result!.prices['Solo sopa']).toBe(3000);
  });

  it('returns null when container exists but contains no named items', async () => {
    const html = `
      <html><body>
        <div class="menu-del-dia">
          <div class="menu-item"><span class="item-name">   </span></div>
        </div>
      </body></html>
    `;
    const result = await scrapeMenu(html);
    expect(result).toBeNull();
  });
});

// ── fetchITMCafeteriaPage ───────────────────────────────────────────────────

describe('fetchITMCafeteriaPage', () => {
  it('returns page content when the request succeeds', async () => {
    const mockHtml = '<html><body>Cafeteria menu</body></html>';
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      text: async () => mockHtml,
    } as Response);

    const result = await fetchITMCafeteriaPage();
    expect(result).toBe(mockHtml);
  });

  it('returns null when the HTTP response is not ok', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 503,
    } as Response);

    const result = await fetchITMCafeteriaPage();
    expect(result).toBeNull();
  });

  it('returns null when fetch throws a network error', async () => {
    vi.spyOn(global, 'fetch').mockRejectedValueOnce(new Error('Network failure'));

    const result = await fetchITMCafeteriaPage();
    expect(result).toBeNull();
  });
});
