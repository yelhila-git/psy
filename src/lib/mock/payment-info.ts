import type { PsychologistPaymentInfo } from '@/types';
import { MOROCCAN_BANKS } from '@/lib/constants';
import { createRng, int, iso, addDays, startOfToday } from './seed';
import { psychologists } from './psychologists';

const NOTES = [
  'Merci d’indiquer la référence de la réservation dans le motif du transfert.',
  'Je confirme les transferts reçus dans l’heure en journée.',
  undefined,
  'Envoyez-moi la capture du transfert, je confirme dans la journée.',
];

/** A 24-digit Moroccan RIB, deterministic per practitioner. */
function buildRib(r: () => number) {
  return Array.from({ length: 24 }, () => String(int(0, 9, r))).join('');
}

/**
 * Payment coordinates for every verified practitioner.
 *
 * Two verified practitioners are deliberately left inactive so the
 * "no coordinates yet" path — blocked bookings, dashboard alert — is
 * reachable in the prototype instead of being dead code.
 */
export const psychologistPaymentInfo: PsychologistPaymentInfo[] = psychologists
  .filter((p) => p.isVerified)
  .map((p, index) => {
    const r = createRng(5300 + index * 31);
    const rib = buildRib(r);
    const inactive = index === 3 || index === 7;

    return {
      psychologistId: p.id,
      accountHolderName: p.fullName.replace(/^Dr\.?\s*/i, ''),
      bankName: MOROCCAN_BANKS[index % MOROCCAN_BANKS.length]!,
      rib,
      iban: r() > 0.4 ? `MA64${rib}` : undefined,
      phone: p.phone ?? `06${String(int(10_000_000, 99_999_999, r))}`,
      visibility: { rib: r() > 0.35, iban: r() > 0.6 },
      instructions: NOTES[index % NOTES.length],
      isActive: !inactive,
      updatedAt: iso(addDays(startOfToday(), -int(3, 120, r))),
    } satisfies PsychologistPaymentInfo;
  });

export const paymentInfoByPsychologist = new Map(
  psychologistPaymentInfo.map((info) => [info.psychologistId, info]),
);
