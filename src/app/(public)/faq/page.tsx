import type { Metadata } from 'next';
import Link from 'next/link';
import { AlertTriangle, LifeBuoy } from 'lucide-react';
import { EMERGENCY_NOTICE, SITE, SUBSCRIPTION_PLANS } from '@/lib/constants';
import { formatPrice } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FaqAccordion } from '@/components/faq-accordion';

export const metadata: Metadata = {
  title: 'Questions fréquentes',
  description:
    'Toutes les réponses sur les consultations en ligne AlloMonPsy : confidentialité, tarifs, annulation, vérification des psychologues.',
};

const GROUPS = [
  {
    title: 'Consultations',
    items: [
      {
        q: 'Une consultation en ligne est-elle aussi efficace qu’en cabinet ?',
        a: 'Pour la grande majorité des motifs — anxiété, dépression, stress, difficultés relationnelles — les études montrent une efficacité comparable à celle du présentiel. Certaines situations, notamment les troubles sévères ou les situations de crise, nécessitent un suivi en présentiel : votre psychologue vous le dira dès la première séance si c’est le cas.',
      },
      {
        q: 'Combien de temps dure une séance ?',
        a: 'Vous choisissez la durée au moment de la réservation : 30, 45, 60 ou 90 minutes. Le format d’une heure est le plus courant. Une première séance de 90 minutes est souvent recommandée pour faire le point.',
      },
      {
        q: 'De quoi ai-je besoin techniquement ?',
        a: 'Un ordinateur, une tablette ou un smartphone avec une caméra, un micro et une connexion internet. La visio se lance directement dans le navigateur, sans installation. Prévoyez un endroit calme où vous ne serez pas interrompu.',
      },
      {
        q: 'Puis-je changer de psychologue ?',
        a: 'À tout moment et sans avoir à vous justifier. La qualité du lien avec votre praticien est déterminante : s’il ne s’installe pas, il vaut mieux essayer quelqu’un d’autre. Vous pouvez réserver avec un nouveau praticien dès la séance suivante.',
      },
    ],
  },
  {
    title: 'Confidentialité',
    items: [
      {
        q: 'Mes échanges sont-ils confidentiels ?',
        a: 'Oui. Le secret professionnel s’applique exactement comme en cabinet. Les visioconférences sont chiffrées et ne sont jamais enregistrées. Vos messages et notes de séance ne sont accessibles qu’à vous et à votre psychologue.',
      },
      {
        q: 'Qui a accès à mes données ?',
        a: 'Seul votre psychologue accède au contenu de votre suivi. Notre équipe technique n’a accès qu’aux données strictement nécessaires au fonctionnement du service (facturation, support) et n’a jamais accès aux séances ni aux messages.',
      },
      {
        q: 'Puis-je supprimer mon compte et mes données ?',
        a: `Oui, depuis vos paramètres, à tout moment. La suppression est définitive sous 30 jours, à l’exception des données de facturation que la loi nous impose de conserver. Écrivez à ${SITE.email} pour toute demande.`,
      },
    ],
  },
  {
    title: 'Tarifs et paiement',
    items: [
      {
        q: 'Combien coûte une consultation ?',
        a: 'Chaque psychologue fixe librement son tarif, généralement entre 250 et 750 MAD la séance d’une heure. Le prix est affiché sur la fiche du praticien et confirmé avant la réservation — il n’y a jamais de frais cachés.',
      },
      {
        q: 'Comment se déroule le paiement ?',
        a: 'Il n’y a aucun paiement en ligne : ni carte bancaire, ni PayPal. Après avoir réservé votre créneau, vous recevez le numéro de réception du psychologue ainsi qu’une référence à indiquer. Vous effectuez le transfert instantané directement (Wafacash, Cash Plus, Barid Cash ou transfert mobile), puis cliquez sur « J’ai effectué le paiement ». Le psychologue vérifie la réception sur son compte et confirme : votre consultation est alors débloquée.',
      },
      {
        q: 'Combien de temps ai-je pour payer ?',
        a: 'Vous disposez de 30 minutes après la réservation pour effectuer le transfert et le déclarer. Passé ce délai, la réservation est automatiquement annulée et le créneau redevient disponible pour d’autres patients. Un compte à rebours vous indique le temps restant.',
      },
      {
        q: 'Que se passe-t-il si le psychologue ne reçoit pas mon paiement ?',
        a: 'Il signale le paiement comme non reçu en précisant pourquoi — montant incomplet, référence absente, transfert introuvable. Votre rendez-vous repasse en attente de paiement avec un nouveau délai, et vous pouvez corriger puis déclarer à nouveau votre transfert. En cas de désaccord, contactez le support : l’historique complet des déclarations est conservé.',
      },
      {
        q: 'Puis-je annuler ou reporter ?',
        a: 'L’annulation est gratuite jusqu’à 24 heures avant la séance. Comme le règlement se fait directement entre vous et le praticien, le remboursement d’un transfert déjà effectué se convient avec lui. Passé ce délai, la consultation est due, car le créneau ne peut plus être proposé à un autre patient. Le report reste possible selon les disponibilités du praticien.',
      },
      {
        q: 'La consultation est-elle remboursée par une mutuelle ?',
        a: 'Certaines mutuelles prennent en charge tout ou partie des séances de psychologie. Une facture détaillée est disponible dans votre espace après chaque consultation — transmettez-la à votre organisme.',
      },
    ],
  },
  {
    title: 'Pour les psychologues',
    items: [
      {
        q: 'Comment mon profil est-il vérifié ?',
        a: 'Vous déposez votre diplôme, votre autorisation d’exercice et une pièce d’identité. Notre équipe contrôle chaque document, généralement sous 48 à 72 heures ouvrées. Votre profil n’est visible par les patients qu’une fois cette validation obtenue.',
      },
      {
        q: 'Quelle commission prélève la plateforme ?',
        a: `Aucune. AlloMonPsy ne prélève rien sur vos consultations : vos patients vous règlent directement et vous encaissez 100 % de vos honoraires. La plateforme se rémunère uniquement par un abonnement mensuel, à partir de ${formatPrice(SUBSCRIPTION_PLANS[1]!.pricePerMonth)} par mois, avec une formule gratuite limitée à ${SUBSCRIPTION_PLANS[0]!.monthlyQuota} consultations mensuelles pour démarrer.`,
      },
      {
        q: 'Quand suis-je payé ?',
        a: 'Immédiatement, et directement par le patient. Il vous transfère le montant de la séance sur votre compte, puis vous confirmez la réception depuis votre tableau de bord — c’est cette confirmation qui débloque la consultation vidéo. La plateforme ne détient jamais votre argent.',
      },
      {
        q: 'Qui voit mes coordonnées bancaires ?',
        a: 'Uniquement les patients ayant réservé un créneau avec vous, et seulement les informations que vous choisissez d’afficher (RIB, IBAN, téléphone). Elles n’apparaissent jamais sur votre profil public ni dans les résultats de recherche.',
      },
      {
        q: 'Puis-je garder mon cabinet en parallèle ?',
        a: 'Bien sûr. Vous définissez les plages horaires que vous souhaitez ouvrir en ligne, et rien ne vous empêche de continuer vos consultations en présentiel. Beaucoup de praticiens utilisent la plateforme en complément.',
      },
    ],
  },
];

export default function FaqPage() {
  return (
    <>
      <section className="border-b border-border bg-surface-alt">
        <div className="container-page py-14 lg:py-20">
          <p className="eyebrow">Support</p>
          <h1 className="mt-3 max-w-3xl text-4xl font-bold leading-tight text-secondary sm:text-5xl">
            Questions fréquentes
          </h1>
          <p className="mt-5 max-w-2xl text-md leading-relaxed text-muted-foreground">
            Vous ne trouvez pas votre réponse ? Notre équipe répond sous 24 heures ouvrées.
          </p>
        </div>
      </section>

      <div className="container-page grid gap-10 py-12 lg:grid-cols-[1fr_320px] lg:py-16">
        <div className="min-w-0 space-y-10">
          {GROUPS.map((group) => (
            <section key={group.title}>
              <h2 className="text-lg font-bold text-secondary">{group.title}</h2>
              <FaqAccordion items={group.items} idPrefix={group.title} />
            </section>
          ))}
        </div>

        <aside className="space-y-5">
          <Card className="border-error/30 bg-error-soft p-5">
            <span className="flex size-10 items-center justify-center rounded-card bg-error/10 text-error">
              <AlertTriangle className="size-5" aria-hidden />
            </span>
            <h2 className="mt-4 text-base font-bold text-secondary">En cas d’urgence</h2>
            <p className="mt-2 text-base leading-relaxed text-muted-foreground">{EMERGENCY_NOTICE}</p>
          </Card>

          <Card className="p-5">
            <span className="flex size-10 items-center justify-center rounded-card bg-primary-soft text-primary">
              <LifeBuoy className="size-5" aria-hidden />
            </span>
            <h2 className="mt-4 text-base font-bold text-secondary">Besoin d’aide ?</h2>
            <p className="mt-2 text-base leading-relaxed text-muted-foreground">
              Écrivez-nous, nous répondons sous 24 heures ouvrées.
            </p>
            <Button variant="outline" full className="mt-4" asChild>
              <a href={`mailto:${SITE.email}`}>Contacter le support</a>
            </Button>
          </Card>

          <Card className="bg-secondary p-5 text-white">
            <h2 className="text-base font-bold text-white">Prêt à commencer ?</h2>
            <p className="mt-2 text-base leading-relaxed text-white/70">
              Parcourez les profils vérifiés et réservez votre première séance.
            </p>
            <Button variant="onDark" full className="mt-4" asChild>
              <Link href="/psychologists">Trouver un psychologue</Link>
            </Button>
          </Card>
        </aside>
      </div>
    </>
  );
}
