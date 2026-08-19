'use client';

import * as React from 'react';
import { MessageSquareDashed, Paperclip, Search, Send } from 'lucide-react';
import type { Conversation, Message, UserRole } from '@/types';
import { messageService } from '@/lib/services';
import { cn, formatRelative } from '@/lib/utils';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { EmptyState, Skeleton } from '@/components/ui/feedback';

/**
 * Two-pane messenger. Below lg the thread list and the conversation swap
 * rather than sitting side by side — a 320px list plus a thread does not fit
 * on a 390px screen.
 */
export function Chat({ viewerId, viewerRole }: { viewerId: string; viewerRole: UserRole }) {
  const [conversations, setConversations] = React.useState<Conversation[] | null>(null);
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [messages, setMessages] = React.useState<Message[] | null>(null);
  const [draft, setDraft] = React.useState('');
  const [search, setSearch] = React.useState('');
  const [sending, setSending] = React.useState(false);

  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    messageService.conversations(viewerId, viewerRole).then((data) => {
      setConversations(data);
      setActiveId((current) => current ?? data[0]?.id ?? null);
    });
  }, [viewerId, viewerRole]);

  React.useEffect(() => {
    if (!activeId) return;
    let cancelled = false;
    setMessages(null);

    messageService.messages(activeId).then((data) => {
      if (cancelled) return;
      setMessages(data);
      messageService.markRead(activeId).then(() => {
        setConversations((current) =>
          current?.map((c) => (c.id === activeId ? { ...c, unreadCount: 0 } : c)) ?? null,
        );
      });
    });

    return () => {
      cancelled = true;
    };
  }, [activeId]);

  // Keep the newest message in view as the thread grows.
  React.useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    const body = draft.trim();
    if (!body || !activeId) return;

    setSending(true);
    setDraft('');
    const message = await messageService.send(activeId, viewerId, viewerRole, body);
    setMessages((current) => [...(current ?? []), message]);
    setConversations((current) =>
      current?.map((c) =>
        c.id === activeId
          ? { ...c, lastMessage: { body, sentAt: message.sentAt, senderId: viewerId }, updatedAt: message.sentAt }
          : c,
      ) ?? null,
    );
    setSending(false);
  };

  const filtered = conversations?.filter((c) =>
    search ? c.participant.fullName.toLowerCase().includes(search.toLowerCase()) : true,
  );
  const active = conversations?.find((c) => c.id === activeId) ?? null;

  return (
    <Card className="grid h-[calc(100dvh-13rem)] min-h-[520px] overflow-hidden lg:grid-cols-[320px_1fr]">
      {/* Thread list */}
      <div
        className={cn(
          'flex min-h-0 flex-col border-e border-border',
          activeId && 'hidden lg:flex',
        )}
      >
        <div className="shrink-0 border-b border-border p-4">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher une conversation…"
            startAdornment={<Search />}
            className="h-10"
            aria-label="Rechercher une conversation"
          />
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {!conversations ? (
            <div className="space-y-3 p-4">
              {Array.from({ length: 5 }, (_, i) => (
                <div key={i} className="flex gap-3">
                  <Skeleton className="size-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-3 w-2/3" />
                    <Skeleton className="h-3 w-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered?.length === 0 ? (
            <p className="p-6 text-center text-base text-muted-foreground">
              Aucune conversation trouvée.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {filtered?.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => setActiveId(c.id)}
                    className={cn(
                      'flex w-full items-start gap-3 p-4 text-start transition-colors',
                      c.id === activeId ? 'bg-primary-soft/50' : 'hover:bg-muted',
                    )}
                  >
                    <Avatar src={c.participant.avatarUrl} name={c.participant.fullName} size="sm" />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline justify-between gap-2">
                        <span className="truncate text-base font-semibold text-secondary">
                          {c.participant.fullName}
                        </span>
                        <span className="shrink-0 text-2xs text-subtle-foreground">
                          {formatRelative(c.updatedAt)}
                        </span>
                      </span>
                      <span className="mt-0.5 flex items-center gap-2">
                        <span
                          className={cn(
                            'line-clamp-1 flex-1 text-xs',
                            c.unreadCount ? 'font-medium text-secondary' : 'text-muted-foreground',
                          )}
                        >
                          {c.lastMessage.senderId === viewerId && 'Vous : '}
                          {c.lastMessage.body}
                        </span>
                        {c.unreadCount > 0 && (
                          <Badge variant="solid" size="sm">
                            {c.unreadCount}
                          </Badge>
                        )}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Thread */}
      <div className={cn('flex min-h-0 flex-col', !activeId && 'hidden lg:flex')}>
        {!active ? (
          <div className="flex flex-1 items-center justify-center p-6">
            <EmptyState
              icon={MessageSquareDashed}
              title="Sélectionnez une conversation"
              description="Vos échanges avec les praticiens apparaissent ici. Ils restent strictement confidentiels."
              className="border-0 bg-transparent"
            />
          </div>
        ) : (
          <>
            <div className="flex shrink-0 items-center gap-3 border-b border-border p-4">
              <button
                type="button"
                onClick={() => setActiveId(null)}
                className="text-base font-medium text-primary lg:hidden"
              >
                Retour
              </button>
              <Avatar src={active.participant.avatarUrl} name={active.participant.fullName} size="sm" />
              <div className="min-w-0">
                <p className="truncate text-base font-bold text-secondary">
                  {active.participant.fullName}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {active.participant.subtitle}
                </p>
              </div>
            </div>

            <div ref={scrollRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-surface-alt/60 p-4">
              {!messages ? (
                <div className="space-y-3">
                  {Array.from({ length: 4 }, (_, i) => (
                    <Skeleton key={i} className={cn('h-16', i % 2 ? 'ms-auto w-2/3' : 'w-3/5')} />
                  ))}
                </div>
              ) : (
                messages.map((m) => {
                  const mine = m.senderId === viewerId;
                  return (
                    <div key={m.id} className={cn('flex', mine ? 'justify-end' : 'justify-start')}>
                      <div
                        className={cn(
                          'max-w-[80%] rounded-card px-4 py-2.5 sm:max-w-[70%]',
                          mine
                            ? 'rounded-ee-sm bg-primary text-primary-foreground'
                            : 'rounded-es-sm border border-border bg-card text-secondary',
                        )}
                      >
                        <p className="whitespace-pre-wrap text-base leading-relaxed">{m.body}</p>
                        <p
                          className={cn(
                            'mt-1 text-2xs',
                            mine ? 'text-primary-foreground/70' : 'text-subtle-foreground',
                          )}
                        >
                          {new Date(m.sentAt).toLocaleTimeString('fr-FR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <form onSubmit={send} className="flex shrink-0 items-center gap-2 border-t border-border p-4">
              <Button type="button" variant="ghost" size="icon" aria-label="Joindre un fichier">
                <Paperclip />
              </Button>
              <Input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Écrivez votre message…"
                aria-label="Message"
                className="flex-1"
              />
              <Button type="submit" size="icon" disabled={!draft.trim() || sending} aria-label="Envoyer">
                <Send className="rtl-flip" />
              </Button>
            </form>
          </>
        )}
      </div>
    </Card>
  );
}
