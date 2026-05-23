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
  attention: 'Lunes a viernes: 8:00am – 6:00pm',
  phone: '604 4405100 ext. 5307',
  email: 'acercarse@itm.edu.co',
  appointmentInfo:
    'Las citas se solicitan en persona en cualquiera de las sedes o a través de esta API. ' +
    'El equipo se comunicará contigo en 24 horas hábiles.',
  campuses: [
    {
      name: 'Robledo',
      location: 'Bloque E, piso 2',
      phone: '604 4405100 ext. 5307',
    },
    {
      name: 'Fraternidad',
      location: 'Bloque L, oficina 105',
      phone: '604 4600727 ext. 5522',
    },
    {
      name: 'La Floresta',
      location: 'Piso 1, oficina 108',
      phone: '604 4405100',
    },
    {
      name: 'Castilla',
      location: 'Piso 1',
      phone: '604 4405100',
    },
  ],
};

const EMERGENCY_CONTACTS = [
  // ── Líneas nacionales / distritales — disponibles 24/7 ─────────────────────
  {
    name: 'Línea 106 — Salud Mental Medellín',
    phone: '106',
    description: 'Línea de atención psicosocial en crisis para ciudadanos de Medellín',
    available: '24/7',
    free: true,
    type: 'hotline',
  },
  {
    name: 'Línea 123 — Emergencias',
    phone: '123',
    description: 'Línea nacional de emergencias — policía, bomberos, ambulancia',
    available: '24/7',
    free: true,
    type: 'hotline',
  },
  {
    name: 'Línea Amiga — Ministerio de Salud',
    phone: '018000113113',
    description: 'Apoyo emocional y orientación en salud mental a nivel nacional',
    available: '24/7',
    free: true,
    type: 'hotline',
  },
  // ── Servicios ITM ───────────────────────────────────────────────────────────
  {
    name: 'ACERCARSE — Psicología ITM (Robledo)',
    phone: '604 4405100 ext. 5307',
    email: 'acercarse@itm.edu.co',
    description:
      'Servicio de psicología y acompañamiento emocional de Bienestar Universitario — Sede Robledo, Bloque E piso 2',
    available: 'L-V 8:00am – 6:00pm',
    free: true,
    type: 'itm',
  },
  {
    name: 'ACERCARSE — Psicología ITM (Fraternidad)',
    phone: '604 4600727 ext. 5522',
    email: 'acercarse@itm.edu.co',
    description:
      'Servicio de psicología y acompañamiento emocional de Bienestar Universitario — Sede Fraternidad, Bloque L oficina 105',
    available: 'L-V 8:00am – 6:00pm',
    free: true,
    type: 'itm',
  },
  {
    name: 'ZOU — Prevención del Consumo ITM',
    phone: '604 4405100 ext. 5307',
    email: 'zou@itm.edu.co',
    description:
      'Programa de prevención e intervención en consumo de sustancias psicoactivas del ITM',
    available: 'L-V 8:00am – 6:00pm',
    free: true,
    type: 'itm',
  },
  {
    name: 'Enfermería ITM',
    phone: '604 4405100',
    description:
      'Atención de urgencias médicas menores disponible en todas las sedes del ITM',
    available: 'L-V 6:00am – 10:00pm',
    free: true,
    type: 'itm',
  },
  {
    name: 'Mente Plena — Psiquiatría (convenio ITM)',
    phone: '604 4405100 ext. 5307',
    email: 'acercarse@itm.edu.co',
    description:
      'Atención psiquiátrica a través del convenio Mente Plena, coordinada por Bienestar Universitario ITM. Requiere remisión previa.',
    available: 'Previa cita — gestionar con Bienestar',
    free: true,
    type: 'itm',
  },
  {
    name: 'LAB-IDH — Laboratorio de Innovación en Derechos Humanos ITM',
    phone: '604 4405100',
    email: 'lab@itm.edu.co',
    description:
      'Apoyo en situaciones de vulneración de derechos, convivencia y diversidad en el campus',
    available: 'L-V 8:00am – 5:00pm',
    free: true,
    type: 'itm',
  },
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

  async requestAppointment(
    userId: string,
    userEmail: string,
    body: { preferredDate: string; reason: string; modality?: string },
  ) {
    const appointment = await this.repo.createAppointment({
      userId,
      preferredDate: new Date(body.preferredDate),
      reason: body.reason,
      modality: body.modality ?? 'presencial',
    });

    // Fire-and-forget notification
    // TODO: replace with real email provider (Resend / Nodemailer) when SMTP_HOST is configured
    this.notifyPsychologyTeam(userEmail, appointment).catch(() => {});

    return appointment;
  }

  private async notifyPsychologyTeam(
    userEmail: string,
    appointment: { id: string; preferredDate: Date; reason: string; modality: string },
  ): Promise<void> {
    const date = appointment.preferredDate.toISOString().split('T')[0];
    console.log(
      `[health:appointment] id=${appointment.id} user=${userEmail} ` +
      `date=${date} modality=${appointment.modality}`,
    );
    // Future: send email to acercarse@itm.edu.co with appointment details
  }
}
