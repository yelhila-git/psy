import { BadgeCheck } from 'lucide-react';
import type { Review } from '@/types';
import { formatDate } from '@/lib/utils';
import { Avatar } from '@/components/ui/avatar';
import { Rating } from '@/components/ui/rating';
import { Card } from '@/components/ui/card';

export function ReviewCard({ review }: { review: Review }) {
  return (
    <Card flat className="border-border/70 p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Avatar src={review.patientAvatarUrl} name={review.patientName} size="sm" />
          <div>
            <p className="text-base font-bold text-secondary">{review.patientName}</p>
            <p className="text-xs text-subtle-foreground">{formatDate(review.createdAt)}</p>
          </div>
        </div>
        <Rating value={review.rating} size="sm" showValue={false} />
      </div>

      {review.title && <p className="mt-4 text-base font-semibold text-secondary">{review.title}</p>}
      <p className="mt-2 text-base leading-relaxed text-muted-foreground">{review.comment}</p>

      {review.isVerifiedConsultation && (
        <p className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-success">
          <BadgeCheck className="size-3.5" aria-hidden />
          Consultation vérifiée
        </p>
      )}
    </Card>
  );
}

/** Rating summary with the 5→1 star distribution bars. */
export function ReviewSummary({ reviews, rating }: { reviews: Review[]; rating: number }) {
  const counts = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
  }));
  const total = reviews.length || 1;

  return (
    <div className="grid gap-6 rounded-card bg-surface-alt p-6 sm:grid-cols-[auto_1fr] sm:gap-10">
      <div className="text-center sm:text-start">
        <p className="text-5xl font-black leading-none text-secondary">{rating.toFixed(1)}</p>
        <Rating value={rating} size="sm" showValue={false} className="mt-2 justify-center sm:justify-start" />
        <p className="mt-2 text-xs text-muted-foreground">
          {reviews.length} avis vérifié{reviews.length > 1 ? 's' : ''}
        </p>
      </div>

      <div className="space-y-1.5">
        {counts.map(({ star, count }) => (
          <div key={star} className="flex items-center gap-3">
            <span className="w-8 shrink-0 text-xs text-muted-foreground">{star} ★</span>
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-border">
              <div
                className="h-full rounded-full bg-amber"
                style={{ width: `${(count / total) * 100}%` }}
              />
            </div>
            <span className="w-6 shrink-0 text-end text-xs text-subtle-foreground">{count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
