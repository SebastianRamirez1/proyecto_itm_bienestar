import { HealthRepository } from './health.repository';
import { getOrSet, CacheTTL } from '../../shared/cache/redis';

// Maps Prisma AcademicPeriodType → HealthContextType
const PERIOD_TO_CONTEXT: Record<string, string> = {
  normal: 'normal',
  midterm: 'midterm',
  finals: 'finals',
  registration: 'registration',
  break: 'normal',
};

const SCHEDULE = {
  attention: 'Lunes a viernes: 8:00am – 12:00pm y 2:00pm – 6:00pm',
  location: 'Bloque 3, Oficina 301 — Sede Robledo',
  phone: '+57 (4) 460 0727 ext. 5301',
  email: 'psicologia.bienestar@itm.edu.co',
  appointmentInfo: 'Las citas se solicitan en persona o a través de esta API.',
};

const EMERGENCY_CONTACTS = [
  { name: 'Línea 106 — Salud Mental', phone: '106', available: '24/7', free: true },
  { name: 'Línea 123 — Emergencias', phone: '123', available: '24/7', free: true },
  { name: 'Línea Amiga — Ministerio de Salud', phone: '018000113113', available: '24/7', free: true },
  { name: 'Psicología ITM', phone: '+57 (4) 460 0727 ext. 5301', available: 'L-V 8am-6pm', free: true },
];

export class HealthService {
  constructor(private readonly repo = new HealthRepository()) {}

  async getResources() {
    return getOrSet('health:resources:all', CacheTTL.HEALTH, () =>
      this.repo.findAllActiveResources(),
    );
  }

  async getTips() {
    const period = await this.repo.findCurrentAcademicPeriod();
    const contextType = period ? (PERIOD_TO_CONTEXT[period.periodType] ?? 'normal') : 'normal';

    const { data: resources } = await getOrSet(
      `health:tips:${contextType}`,
      CacheTTL.HEALTH,
      () => this.repo.findResourcesByContext(contextType),
    );

    return {
      currentPeriod: period
        ? { name: period.periodName, type: period.periodType }
        : { name: 'Periodo normal', type: 'normal' },
      contextType,
      resources,
    };
  }

  getSchedule() {
    return SCHEDULE;
  }

  getEmergencyContacts() {
    return EMERGENCY_CONTACTS;
  }
}
