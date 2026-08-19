'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Info,
  MessageSquare,
  Mic,
  MicOff,
  Monitor,
  MonitorOff,
  PhoneOff,
  Send,
  Settings,
  Signal,
  Users,
  Video as VideoIcon,
  VideoOff,
  X,
} from 'lucide-react';
import type { AppointmentWithParties, UserRole } from '@/types';
import { cn, formatPrice } from '@/lib/utils';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/misc';

type CallState = 'waiting' | 'connecting' | 'active' | 'ended';

interface LocalMessage {
  id: string;
  fromSelf: boolean;
  body: string;
  at: Date;
}

/**
 * Consultation room — UI only. There is no WebRTC here by design: the video
 * surfaces are placeholders driven by local state, so the layout, the control
 * bar and every call state can be reviewed before any transport is wired in.
 *
 * When WebRTC lands, replace the two `VideoSurface` bodies with the remote and
 * local `MediaStream` elements and drive `state` from the peer connection.
 */
export function ConsultationRoom({
  appointment,
  viewerRole,
}: {
  appointment: AppointmentWithParties;
  viewerRole: UserRole;
}) {
  const [state, setState] = React.useState<CallState>('waiting');
  const [micOn, setMicOn] = React.useState(true);
  const [cameraOn, setCameraOn] = React.useState(true);
  const [sharing, setSharing] = React.useState(false);
  const [panel, setPanel] = React.useState<'info' | 'chat' | null>('info');
  const [elapsed, setElapsed] = React.useState(0);
  const [draft, setDraft] = React.useState('');
  const [messages, setMessages] = React.useState<LocalMessage[]>([]);

  const other =
    viewerRole === 'patient'
      ? {
          name: appointment.psychologist.fullName,
          avatar: appointment.psychologist.avatarUrl,
          subtitle: appointment.psychologist.title,
        }
      : {
          name: appointment.patient.fullName,
          avatar: appointment.patient.avatarUrl,
          subtitle: 'Patient',
        };

  // Session timer, running only while the call is active.
  React.useEffect(() => {
    if (state !== 'active') return;
    const timer = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(timer);
  }, [state]);

  const join = () => {
    setState('connecting');
    // Stands in for the ICE negotiation round-trip.
    setTimeout(() => setState('active'), 1800);
  };

  const formatElapsed = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    const body = draft.trim();
    if (!body) return;
    setMessages((current) => [
      ...current,
      { id: `local-${Date.now()}`, fromSelf: true, body, at: new Date() },
    ]);
    setDraft('');
  };

  const overtime = elapsed > appointment.durationMinutes * 60;

  if (state === 'ended') {
    return <EndedState appointment={appointment} viewerRole={viewerRole} elapsed={elapsed} />;
  }

  return (
    <div className="flex h-dvh flex-col bg-secondary text-white">
      {/* Top bar */}
      <header className="flex shrink-0 items-center justify-between gap-4 border-b border-white/10 px-4 py-3 lg:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar src={other.avatar} name={other.name} size="sm" />
          <div className="min-w-0">
            <p className="truncate text-base font-bold text-white">{other.name}</p>
            <p className="truncate text-2xs text-white/60">{other.subtitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {state === 'active' && (
            <span
              className={cn(
                'inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold tabular-nums',
                overtime ? 'bg-warning/20 text-warning' : 'bg-white/10 text-white',
              )}
            >
              <span className="size-1.5 rounded-full bg-error" />
              {formatElapsed(elapsed)}
              <span className="hidden font-normal text-white/50 sm:inline">
                / {appointment.durationMinutes}:00
              </span>
            </span>
          )}

          <span className="hidden items-center gap-1.5 text-xs text-white/60 sm:flex">
            <Signal className="size-4 text-success" aria-hidden />
            Bonne connexion
          </span>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        {/* Stage */}
        <div className="relative flex min-w-0 flex-1 flex-col">
          <div className="relative flex-1 p-3 lg:p-4">
            {state === 'waiting' && <WaitingRoom other={other} appointment={appointment} onJoin={join} />}
            {state === 'connecting' && <ConnectingState name={other.name} />}

            {state === 'active' && (
              <div className="relative h-full">
                <VideoSurface
                  name={other.name}
                  avatar={other.avatar}
                  cameraOn
                  label={other.name}
                  className="h-full"
                />

                {/* Local preview */}
                <div className="absolute end-4 top-4 w-32 overflow-hidden rounded-card border-2 border-white/20 shadow-lg sm:w-44">
                  <VideoSurface
                    name="Vous"
                    avatar={
                      viewerRole === 'patient'
                        ? appointment.patient.avatarUrl
                        : appointment.psychologist.avatarUrl
                    }
                    cameraOn={cameraOn}
                    label="Vous"
                    compact
                    className="aspect-[3/4] sm:aspect-video"
                  />
                </div>

                {sharing && (
                  <Badge variant="warning" className="absolute start-4 top-4">
                    <Monitor aria-hidden />
                    Vous partagez votre écran
                  </Badge>
                )}
              </div>
            )}
          </div>

          {/* Control bar */}
          <div className="shrink-0 border-t border-white/10 px-4 py-4 lg:px-6">
            <VideoControls
              micOn={micOn}
              cameraOn={cameraOn}
              sharing={sharing}
              panel={panel}
              disabled={state !== 'active'}
              onToggleMic={() => setMicOn((v) => !v)}
              onToggleCamera={() => setCameraOn((v) => !v)}
              onToggleShare={() => setSharing((v) => !v)}
              onTogglePanel={(next) => setPanel((current) => (current === next ? null : next))}
              onEnd={() => setState('ended')}
              unread={0}
            />
          </div>
        </div>

        {/* Side panel */}
        {panel && (
          <aside className="absolute inset-y-0 end-0 z-20 flex w-full max-w-sm flex-col border-s border-white/10 bg-secondary-hover lg:static lg:w-[340px]">
            <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-4 py-3">
              <h2 className="text-base font-bold text-white">
                {panel === 'info' ? 'Informations' : 'Messages'}
              </h2>
              <button
                type="button"
                onClick={() => setPanel(null)}
                className="rounded-control p-1.5 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
                aria-label="Fermer le panneau"
              >
                <X className="size-4" />
              </button>
            </div>

            {panel === 'info' ? (
              <div className="min-h-0 flex-1 overflow-y-auto p-4">
                <section>
                  <h3 className="text-2xs font-bold uppercase tracking-wider text-accent-soft">
                    Consultation
                  </h3>
                  <dl className="mt-3 space-y-2.5">
                    <InfoRow label="Référence" value={appointment.reference} />
                    <InfoRow
                      label="Date"
                      value={new Date(appointment.startsAt).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    />
                    <InfoRow
                      label="Horaire"
                      value={new Date(appointment.startsAt).toLocaleTimeString('fr-FR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    />
                    <InfoRow label="Durée" value={`${appointment.durationMinutes} minutes`} />
                    <InfoRow
                      label="Montant"
                      value={formatPrice(appointment.price, appointment.currency)}
                    />
                  </dl>
                </section>

                <Separator className="my-5 bg-white/10" />

                <section>
                  <h3 className="text-2xs font-bold uppercase tracking-wider text-accent-soft">
                    {viewerRole === 'patient' ? 'Votre psychologue' : 'Votre patient'}
                  </h3>
                  <div className="mt-3 flex items-center gap-3">
                    <Avatar src={other.avatar} name={other.name} size="default" square />
                    <div className="min-w-0">
                      <p className="truncate text-base font-bold text-white">{other.name}</p>
                      <p className="truncate text-xs text-white/60">{other.subtitle}</p>
                    </div>
                  </div>

                  {viewerRole === 'psychologist' && (
                    <p className="mt-3 text-xs text-white/60">{appointment.patient.email}</p>
                  )}
                </section>

                {appointment.reason && (
                  <>
                    <Separator className="my-5 bg-white/10" />
                    <section>
                      <h3 className="text-2xs font-bold uppercase tracking-wider text-accent-soft">
                        Motif indiqué
                      </h3>
                      <p className="mt-2 text-base leading-relaxed text-white/75">
                        {appointment.reason}
                      </p>
                    </section>
                  </>
                )}

                <p className="mt-6 rounded-card bg-white/5 p-3.5 text-xs leading-relaxed text-white/60">
                  Cette séance n’est pas enregistrée. Le flux est chiffré de bout en bout entre vous
                  et votre interlocuteur.
                </p>
              </div>
            ) : (
              <>
                <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
                  {messages.length === 0 ? (
                    <p className="py-8 text-center text-base text-white/50">
                      Les messages échangés pendant la séance apparaissent ici.
                    </p>
                  ) : (
                    messages.map((m) => (
                      <div
                        key={m.id}
                        className={cn('flex', m.fromSelf ? 'justify-end' : 'justify-start')}
                      >
                        <div
                          className={cn(
                            'max-w-[85%] rounded-card px-3.5 py-2.5',
                            m.fromSelf ? 'bg-primary text-white' : 'bg-white/10 text-white',
                          )}
                        >
                          <p className="text-base leading-relaxed">{m.body}</p>
                          <p className="mt-1 text-2xs text-white/50">
                            {m.at.toLocaleTimeString('fr-FR', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <form
                  onSubmit={sendMessage}
                  className="flex shrink-0 items-center gap-2 border-t border-white/10 p-4"
                >
                  <Input
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder="Votre message…"
                    aria-label="Message"
                    className="border-white/20 bg-white/10 text-white placeholder:text-white/40"
                  />
                  <Button type="submit" size="icon" disabled={!draft.trim()} aria-label="Envoyer">
                    <Send className="rtl-flip" />
                  </Button>
                </form>
              </>
            )}
          </aside>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------

function VideoSurface({
  name,
  avatar,
  cameraOn,
  label,
  compact,
  className,
}: {
  name: string;
  avatar?: string;
  cameraOn: boolean;
  label: string;
  compact?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-card bg-secondary-hover',
        className,
      )}
    >
      {cameraOn && avatar ? (
        <>
          {/* Placeholder for the MediaStream surface. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={avatar} alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        </>
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-secondary-hover">
          <Avatar src={avatar} name={name} size={compact ? 'sm' : '2xl'} />
          {!compact && (
            <p className="flex items-center gap-2 text-base text-white/60">
              <VideoOff className="size-4" aria-hidden />
              Caméra désactivée
            </p>
          )}
        </div>
      )}

      <span
        className={cn(
          'absolute start-3 bottom-3 rounded-full bg-black/50 px-2.5 py-1 font-medium text-white backdrop-blur',
          compact ? 'text-2xs' : 'text-xs',
        )}
      >
        {label}
      </span>
    </div>
  );
}

function WaitingRoom({
  other,
  appointment,
  onJoin,
}: {
  other: { name: string; avatar: string; subtitle: string };
  appointment: AppointmentWithParties;
  onJoin: () => void;
}) {
  return (
    <div className="flex h-full items-center justify-center rounded-card bg-secondary-hover p-6">
      <div className="max-w-md text-center">
        <span className="relative mx-auto flex size-24 items-center justify-center">
          <span className="absolute inset-0 animate-pulse-ring rounded-full bg-primary/30" aria-hidden />
          <Avatar src={other.avatar} name={other.name} size="2xl" className="relative" />
        </span>

        <Badge variant="onDark" className="mt-6">
          <Users aria-hidden />
          Salle d’attente
        </Badge>

        <h2 className="mt-4 text-2xl font-bold text-white">Prêt à rejoindre la séance ?</h2>
        <p className="mt-3 text-base leading-relaxed text-white/70">
          {other.name} sera informé de votre arrivée. Vérifiez que votre micro et votre caméra
          fonctionnent, et installez-vous dans un endroit calme.
        </p>

        <div className="mt-6 rounded-card bg-white/5 p-4 text-start">
          <dl className="space-y-2">
            <InfoRow
              label="Horaire prévu"
              value={new Date(appointment.startsAt).toLocaleTimeString('fr-FR', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            />
            <InfoRow label="Durée" value={`${appointment.durationMinutes} minutes`} />
          </dl>
        </div>

        <Button size="lg" full className="mt-6" onClick={onJoin}>
          <VideoIcon />
          Rejoindre la consultation
        </Button>
      </div>
    </div>
  );
}

function ConnectingState({ name }: { name: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 rounded-card bg-secondary-hover">
      <span className="flex gap-1.5" aria-hidden>
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="size-2.5 animate-pulse rounded-full bg-primary"
            style={{ animationDelay: `${i * 150}ms` }}
          />
        ))}
      </span>
      <p className="text-md font-medium text-white">Connexion à {name}…</p>
      <p className="text-base text-white/60">Établissement du canal sécurisé</p>
    </div>
  );
}

function EndedState({
  appointment,
  viewerRole,
  elapsed,
}: {
  appointment: AppointmentWithParties;
  viewerRole: UserRole;
  elapsed: number;
}) {
  const minutes = Math.max(1, Math.round(elapsed / 60));
  const home = viewerRole === 'patient' ? '/dashboard/patient' : '/dashboard/psychologist';

  return (
    <div className="flex min-h-dvh items-center justify-center bg-secondary p-6">
      <div className="max-w-md text-center">
        <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-white/10 text-white">
          <PhoneOff className="size-7" aria-hidden />
        </span>

        <h1 className="mt-6 text-3xl font-bold text-white">Consultation terminée</h1>
        <p className="mt-3 text-md leading-relaxed text-white/70">
          La séance a duré {minutes} minute{minutes > 1 ? 's' : ''}. Un récapitulatif vient de vous
          être envoyé par e-mail.
        </p>

        <div className="mt-8 flex flex-col gap-3">
          {viewerRole === 'patient' && (
            <Button size="lg" variant="onDark" asChild>
              <Link href={`/psychologists/${appointment.psychologist.slug}`}>
                Laisser un avis
              </Link>
            </Button>
          )}
          <Button size="lg" variant="onDark-outline" asChild>
            <Link href={home}>Retour au tableau de bord</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-base text-white/60">{label}</dt>
      <dd className="text-end text-base font-medium text-white">{value}</dd>
    </div>
  );
}

/** Reusable control bar so the same affordances appear in any call surface. */
export function VideoControls({
  micOn,
  cameraOn,
  sharing,
  panel,
  disabled,
  unread = 0,
  onToggleMic,
  onToggleCamera,
  onToggleShare,
  onTogglePanel,
  onEnd,
}: {
  micOn: boolean;
  cameraOn: boolean;
  sharing: boolean;
  panel: 'info' | 'chat' | null;
  disabled?: boolean;
  unread?: number;
  onToggleMic: () => void;
  onToggleCamera: () => void;
  onToggleShare: () => void;
  onTogglePanel: (panel: 'info' | 'chat') => void;
  onEnd: () => void;
}) {
  return (
    <div className="flex items-center justify-center gap-2 sm:gap-3">
      <ControlButton
        active={micOn}
        disabled={disabled}
        onClick={onToggleMic}
        label={micOn ? 'Couper le micro' : 'Activer le micro'}
      >
        {micOn ? <Mic /> : <MicOff />}
      </ControlButton>

      <ControlButton
        active={cameraOn}
        disabled={disabled}
        onClick={onToggleCamera}
        label={cameraOn ? 'Couper la caméra' : 'Activer la caméra'}
      >
        {cameraOn ? <VideoIcon /> : <VideoOff />}
      </ControlButton>

      <ControlButton
        active={!sharing}
        disabled={disabled}
        onClick={onToggleShare}
        label={sharing ? 'Arrêter le partage' : 'Partager l’écran'}
        className="hidden sm:inline-flex"
      >
        {sharing ? <MonitorOff /> : <Monitor />}
      </ControlButton>

      <ControlButton
        active={panel !== 'chat'}
        onClick={() => onTogglePanel('chat')}
        label="Ouvrir la discussion"
        badge={unread}
      >
        <MessageSquare />
      </ControlButton>

      <ControlButton
        active={panel !== 'info'}
        onClick={() => onTogglePanel('info')}
        label="Informations de la consultation"
      >
        <Info />
      </ControlButton>

      <ControlButton active disabled label="Paramètres" className="hidden sm:inline-flex">
        <Settings />
      </ControlButton>

      <button
        type="button"
        onClick={onEnd}
        className="ms-2 inline-flex h-12 items-center gap-2 rounded-full bg-error px-5 text-base font-semibold text-white transition-colors hover:brightness-110 focus-visible:ring-2 focus-visible:ring-white"
      >
        <PhoneOff className="size-5" aria-hidden />
        <span className="hidden sm:inline">Terminer</span>
      </button>
    </div>
  );
}

function ControlButton({
  children,
  active,
  disabled,
  onClick,
  label,
  badge,
  className,
}: {
  children: React.ReactNode;
  active: boolean;
  disabled?: boolean;
  onClick?: () => void;
  label: string;
  badge?: number;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      aria-pressed={!active}
      title={label}
      className={cn(
        'relative inline-flex size-12 items-center justify-center rounded-full transition-colors focus-visible:ring-2 focus-visible:ring-white disabled:opacity-40',
        active ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-error text-white hover:brightness-110',
        '[&_svg]:size-5',
        className,
      )}
    >
      {children}
      {badge ? (
        <span className="absolute -end-0.5 -top-0.5 flex size-5 items-center justify-center rounded-full bg-primary text-2xs font-bold text-white">
          {badge}
        </span>
      ) : null}
    </button>
  );
}
