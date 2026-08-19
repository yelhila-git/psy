import type { Conversation, Message } from '@/types';
import { addMinutes, createRng, int, iso, startOfToday, addDays } from './seed';
import { psychologists } from './psychologists';
import { patients, CURRENT_PATIENT_ID, CURRENT_PSYCHOLOGIST_ID } from './patients';

type Turn = { from: 'patient' | 'psychologist'; body: string };

const THREADS: Turn[][] = [
  [
    { from: 'patient', body: 'Bonjour, je voulais confirmer notre séance de jeudi 18h.' },
    {
      from: 'psychologist',
      body: "Bonjour, c'est bien noté de mon côté. Le lien de visio sera disponible 10 minutes avant.",
    },
    { from: 'patient', body: 'Parfait, merci beaucoup.' },
    {
      from: 'psychologist',
      body: "Avec plaisir. Pensez à noter d'ici là les situations où l'anxiété est montée, même brièvement — on en reparlera.",
    },
  ],
  [
    {
      from: 'patient',
      body: "Est-ce qu'il serait possible de décaler la séance de vendredi ? J'ai un imprévu au travail.",
    },
    {
      from: 'psychologist',
      body: 'Bien sûr. J’ai une disponibilité lundi à 14h ou mardi à 11h, est-ce que l’un des deux vous convient ?',
    },
    { from: 'patient', body: 'Lundi 14h serait parfait.' },
    { from: 'psychologist', body: 'C’est réservé. Vous recevrez la confirmation par e-mail.' },
  ],
  [
    {
      from: 'psychologist',
      body: 'Bonjour, je fais suite à notre séance. Voici l’exercice de respiration dont nous avons parlé, à faire deux fois par jour.',
    },
    { from: 'patient', body: 'Merci, je vais essayer dès ce soir.' },
    {
      from: 'psychologist',
      body: "N'hésitez pas à me dire si c'est difficile à tenir, on ajustera. L'objectif est la régularité, pas la performance.",
    },
  ],
  [
    { from: 'patient', body: 'Bonjour, j’ai une question sur le tarif des séances de 90 minutes.' },
    {
      from: 'psychologist',
      body: 'Bonjour, la séance longue est facturée au prorata, elle est indiquée au moment de la réservation. Je la recommande surtout pour les premières séances.',
    },
    { from: 'patient', body: 'Très bien, merci pour la précision.' },
  ],
  [
    {
      from: 'patient',
      body: "La semaine a été compliquée, j'ai eu du mal à appliquer ce qu'on avait vu.",
    },
    {
      from: 'psychologist',
      body: "C'est une information utile, pas un échec. On regardera ensemble ce qui a bloqué — souvent le contexte compte plus que la volonté.",
    },
    { from: 'patient', body: 'Merci, ça me rassure.' },
  ],
  [
    { from: 'psychologist', body: 'Bonjour, notre séance de demain est bien confirmée.' },
    { from: 'patient', body: 'Merci, à demain.' },
  ],
];

const messages: Message[] = [];
const conversations: Conversation[] = [];

function buildThread(
  index: number,
  patientId: string,
  psychologistId: string,
  turns: Turn[],
  daysAgo: number,
) {
  const r = createRng(2200 + index * 31);
  const conversationId = `cnv-${String(index + 1).padStart(3, '0')}`;
  let cursor = addDays(startOfToday(), -daysAgo);
  cursor.setHours(int(9, 19, r), int(0, 59, r), 0, 0);

  const threadMessages: Message[] = turns.map((turn, i) => {
    cursor = addMinutes(cursor, i === 0 ? 0 : int(3, 180, r));
    const senderId = turn.from === 'patient' ? patientId : psychologistId;
    return {
      id: `msg-${conversationId}-${i + 1}`,
      conversationId,
      senderId,
      senderRole: turn.from,
      body: turn.body,
      sentAt: iso(cursor),
      // The last inbound message is left unread on a couple of threads so the
      // badge counters in the sidebar have something to show.
      readAt: i === turns.length - 1 && index % 3 === 0 ? undefined : iso(addMinutes(cursor, 4)),
    } satisfies Message;
  });

  messages.push(...threadMessages);
  const last = threadMessages[threadMessages.length - 1]!;
  const psy = psychologists.find((p) => p.id === psychologistId)!;
  const patient = patients.find((p) => p.id === patientId)!;

  conversations.push({
    id: conversationId,
    patientId,
    psychologistId,
    participant: {
      id: psy.id,
      fullName: psy.fullName,
      avatarUrl: psy.avatarUrl,
      subtitle: psy.title,
    },
    lastMessage: { body: last.body, sentAt: last.sentAt, senderId: last.senderId },
    unreadCount: threadMessages.filter((m) => !m.readAt && m.senderId !== patient.id).length,
    updatedAt: last.sentAt,
  });
}

// Threads for the signed-in patient.
buildThread(0, CURRENT_PATIENT_ID, CURRENT_PSYCHOLOGIST_ID, THREADS[0]!, 0);
buildThread(1, CURRENT_PATIENT_ID, psychologists[2]!.id, THREADS[1]!, 2);
buildThread(2, CURRENT_PATIENT_ID, psychologists[4]!.id, THREADS[2]!, 6);

// Threads for the signed-in psychologist, with other patients.
buildThread(3, patients[1]!.id, CURRENT_PSYCHOLOGIST_ID, THREADS[3]!, 1);
buildThread(4, patients[2]!.id, CURRENT_PSYCHOLOGIST_ID, THREADS[4]!, 3);
buildThread(5, patients[3]!.id, CURRENT_PSYCHOLOGIST_ID, THREADS[5]!, 8);

export { messages, conversations };

export function messagesForConversation(conversationId: string) {
  return messages
    .filter((m) => m.conversationId === conversationId)
    .sort((a, b) => a.sentAt.localeCompare(b.sentAt));
}
