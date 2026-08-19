'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/misc';

export function FaqAccordion({
  items,
  idPrefix,
}: {
  items: { q: string; a: string }[];
  idPrefix: string;
}) {
  return (
    <Accordion type="single" collapsible className="mt-4">
      {items.map((item, i) => (
        <AccordionItem key={item.q} value={`${idPrefix}-${i}`}>
          <AccordionTrigger>{item.q}</AccordionTrigger>
          <AccordionContent>{item.a}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
