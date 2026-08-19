import type { Conversation, ID, Message, UserRole } from '@/types';
import { api, ENDPOINTS, isLive } from '@/lib/api-client';
import { delay } from '@/lib/utils';
import { conversations, messages, messagesForConversation } from '@/lib/mock/messages';
import { psychologistById } from '@/lib/mock/psychologists';
import { patientById } from '@/lib/mock/patients';

export const messageService = {
  /**
   * GET /api/conversations
   *
   * `viewerRole` decides whose name and avatar appear in the list: a patient
   * sees the practitioner, a practitioner sees the patient.
   */
  async conversations(viewerId: ID, viewerRole: UserRole): Promise<Conversation[]> {
    if (isLive('messages')) {
      return api.get<Conversation[]>(ENDPOINTS.conversations, { params: { role: viewerRole } });
    }
    await delay(200);

    return conversations
      .filter((c) => (viewerRole === 'patient' ? c.patientId === viewerId : c.psychologistId === viewerId))
      .map((c) => {
        if (viewerRole === 'patient') return c;
        const patient = patientById.get(c.patientId)!;
        return {
          ...c,
          participant: {
            id: patient.id,
            fullName: patient.fullName,
            avatarUrl: patient.avatarUrl,
            subtitle: patient.city ?? 'Patient',
          },
        };
      })
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  },

  /** GET /api/conversations/{id}/messages */
  async messages(conversationId: ID): Promise<Message[]> {
    if (isLive('messages')) return api.get<Message[]>(ENDPOINTS.messages(conversationId));
    await delay(160);
    return messagesForConversation(conversationId);
  },

  /** POST /api/conversations/{id}/messages */
  async send(conversationId: ID, senderId: ID, senderRole: UserRole, body: string): Promise<Message> {
    if (isLive('messages')) {
      return api.post<Message>(ENDPOINTS.messages(conversationId), { body });
    }
    await delay(240);

    const message: Message = {
      id: `msg-${conversationId}-${Date.now()}`,
      conversationId,
      senderId,
      senderRole,
      body,
      sentAt: new Date().toISOString(),
      readAt: new Date().toISOString(),
    };

    messages.push(message);
    const conversation = conversations.find((c) => c.id === conversationId);
    if (conversation) {
      conversation.lastMessage = { body, sentAt: message.sentAt, senderId };
      conversation.updatedAt = message.sentAt;
      conversation.unreadCount = 0;
    }
    return message;
  },

  async markRead(conversationId: ID): Promise<void> {
    if (isLive('messages')) {
      await api.post(`${ENDPOINTS.messages(conversationId)}/read`);
      return;
    }
    await delay(60);
    const conversation = conversations.find((c) => c.id === conversationId);
    if (conversation) conversation.unreadCount = 0;
    for (const m of messages) {
      if (m.conversationId === conversationId && !m.readAt) m.readAt = new Date().toISOString();
    }
  },

  async unreadTotal(viewerId: ID, viewerRole: UserRole): Promise<number> {
    const list = await this.conversations(viewerId, viewerRole);
    return list.reduce((sum, c) => sum + c.unreadCount, 0);
  },

  /** Resolves (or opens) the thread between a patient and a practitioner. */
  async findOrCreate(patientId: ID, psychologistId: ID): Promise<Conversation> {
    if (isLive('messages')) {
      return api.post<Conversation>(ENDPOINTS.conversations, {
        patient_id: patientId,
        psychologist_id: psychologistId,
      });
    }
    await delay(200);

    const existing = conversations.find(
      (c) => c.patientId === patientId && c.psychologistId === psychologistId,
    );
    if (existing) return existing;

    const psy = psychologistById.get(psychologistId)!;
    const created: Conversation = {
      id: `cnv-new-${Date.now()}`,
      patientId,
      psychologistId,
      participant: {
        id: psy.id,
        fullName: psy.fullName,
        avatarUrl: psy.avatarUrl,
        subtitle: psy.title,
      },
      lastMessage: { body: '', sentAt: new Date().toISOString(), senderId: patientId },
      unreadCount: 0,
      updatedAt: new Date().toISOString(),
    };
    conversations.push(created);
    return created;
  },
};
