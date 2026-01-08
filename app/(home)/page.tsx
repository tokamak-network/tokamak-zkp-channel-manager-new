import { HeroSection } from './_components/HeroSection';
import { FeatureGrid } from './_components/FeatureGrid';
import { QuickActions } from './_components/QuickActions';

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col">
      <HeroSection />
      <FeatureGrid />
      <QuickActions />
    </main>
  );
}

