import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';

/** Shell for every marketing / marketplace page: public header + navy footer. */
export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <Navbar />
      <main id="main" className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  );
}
