import type { Review } from '@/types';
import { addDays, createRng, int, iso } from './seed';
import { appointments } from './appointments';
import { patientById } from './patients';

const COMMENTS: { title: string; body: string; rating: number }[] = [
  {
    title: 'Un accompagnement qui change vraiment les choses',
    body: "J'ai mis longtemps avant d'oser prendre rendez-vous. Dès la première séance je me suis senti·e écouté·e sans jugement. Six mois plus tard, les crises d'angoisse ont presque disparu.",
    rating: 5,
  },
  {
    title: 'À l’écoute et très professionnel·le',
    body: "Beaucoup de bienveillance et des outils concrets à appliquer entre les séances. La visio fonctionne parfaitement, je n'ai jamais eu de problème de connexion.",
    rating: 5,
  },
  {
    title: 'Des séances structurées',
    body: 'On avance avec un objectif clair, ce qui me rassure beaucoup. Le format en ligne me permet de consulter depuis chez moi sans perdre de temps dans les trajets.',
    rating: 5,
  },
  {
    title: 'Je recommande',
    body: "Approche douce mais qui pousse à se remettre en question quand il le faut. J'ai apprécié la disponibilité et la ponctualité.",
    rating: 4,
  },
  {
    title: 'Très bonne première expérience',
    body: "Je consultais pour la première fois un psychologue. L'ambiance était détendue, les explications claires. Je continue le suivi.",
    rating: 5,
  },
  {
    title: 'Professionnel·le et rassurant·e',
    body: "Cadre confidentiel bien respecté, j'ai pu aborder des sujets difficiles à mon rythme. Le tarif est cohérent avec la qualité du suivi.",
    rating: 5,
  },
  {
    title: 'Bien mais horaires limités',
    body: "Le suivi est de qualité, je n'ai rien à redire sur le fond. Un peu compliqué de trouver un créneau en soirée, il faut s'y prendre à l'avance.",
    rating: 4,
  },
  {
    title: 'Un vrai soulagement',
    body: "Après une période très difficile, ces séances m'ont permis de remettre les choses en perspective. Merci pour la patience et l'écoute.",
    rating: 5,
  },
  {
    title: 'Correct',
    body: "Le suivi est sérieux. L'approche ne correspondait pas totalement à ce que je cherchais, mais cela reste une expérience positive.",
    rating: 3,
  },
  {
    title: 'Enfin quelqu’un qui comprend',
    body: "Le fait de pouvoir parler en darija et en français change tout pour moi. Je me sens comprise, ce qui n'avait pas été le cas ailleurs.",
    rating: 5,
  },
  {
    title: 'Excellent suivi de couple',
    body: 'Nous avons appris à communiquer autrement. Les séances sont exigeantes mais très utiles, chacun repart avec quelque chose à travailler.',
    rating: 5,
  },
  {
    title: 'Ponctuel·le et impliqué·e',
    body: "Jamais de retard, des retours écrits après les séances quand c'est nécessaire. Le sérieux se ressent.",
    rating: 4,
  },
];

/**
 * Reviews are derived from completed appointments only — the platform never
 * shows a rating that isn't backed by a consultation that actually happened.
 */
export const reviews: Review[] = appointments
  .filter((a) => a.status === 'completed')
  .map((a, index) => {
    const r = createRng(3300 + index * 11);
    const template = COMMENTS[index % COMMENTS.length]!;
    const patient = patientById.get(a.patientId)!;
    return {
      id: `rev-${String(index + 1).padStart(4, '0')}`,
      appointmentId: a.id,
      psychologistId: a.psychologistId,
      patientId: a.patientId,
      // Reviews display a shortened name, matching common marketplace practice.
      patientName: `${patient.firstName} ${patient.lastName[0]}.`,
      patientAvatarUrl: patient.avatarUrl,
      rating: template.rating,
      title: template.title,
      comment: template.body,
      createdAt: iso(addDays(new Date(a.endsAt), int(1, 6, r))),
      isVerifiedConsultation: true,
    } satisfies Review;
  })
  // Roughly 3 in 4 patients leave a review.
  .filter((_, i) => i % 4 !== 3);

export function reviewsForPsychologist(psychologistId: string) {
  return reviews
    .filter((r) => r.psychologistId === psychologistId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
