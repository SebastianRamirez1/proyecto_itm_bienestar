import * as cheerio from 'cheerio';
import { MenuItem } from './cafeteria.schema';

interface ScrapedMenu {
  items: MenuItem[];
  prices: Record<string, number>;
}

// CSS selectors — update when ITM website structure changes
const SELECTORS = {
  menuContainer: '.menu-del-dia, .cafeteria-menu, table.menu',
  menuItem: '.menu-item, tr.plato',
  itemName: '.item-name, td:first-child',
  priceContainer: '.price-list, .precios',
  priceItem: '.price-item, tr.precio',
};

export async function scrapeMenu(htmlContent: string): Promise<ScrapedMenu | null> {
  try {
    const $ = cheerio.load(htmlContent);
    const items: MenuItem[] = [];
    const prices: Record<string, number> = {};

    const container = $(SELECTORS.menuContainer);
    if (!container.length) return null;

    container.find(SELECTORS.menuItem).each((_i, el) => {
      const name = $(el).find(SELECTORS.itemName).text().trim();
      if (name) {
        items.push({ name, category: 'plato_principal' });
      }
    });

    $(SELECTORS.priceContainer).find(SELECTORS.priceItem).each((_i, el) => {
      const cells = $(el).find('td');
      if (cells.length >= 2) {
        const label = $(cells[0]).text().trim();
        const rawPrice = $(cells[1]).text().replace(/[^0-9]/g, '');
        const price = parseInt(rawPrice, 10);
        if (label && !isNaN(price)) prices[label] = price;
      }
    });

    if (!items.length) return null;
    return { items, prices };
  } catch {
    return null;
  }
}

export function buildFallbackMenu(): ScrapedMenu {
  return {
    items: [
      { name: 'Sopa del día', category: 'entrada' },
      { name: 'Bandeja paisa', category: 'plato_principal' },
      { name: 'Jugo natural', category: 'bebida' },
      { name: 'Postre del día', category: 'postre' },
    ],
    prices: {
      'Almuerzo completo': 8500,
      'Solo sopa': 3000,
      'Solo plato': 6500,
      'Bebida': 2000,
    },
  };
}

export async function fetchITMCafeteriaPage(): Promise<string | null> {
  try {
    const response = await fetch('https://www.itm.edu.co/bienestar/cafeteria', {
      signal: AbortSignal.timeout(10000),
      headers: { 'User-Agent': 'BienestarITM-Bot/1.0' },
    });
    if (!response.ok) return null;
    return response.text();
  } catch {
    return null;
  }
}
