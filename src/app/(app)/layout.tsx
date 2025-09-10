import { BottomNav } from '@/components/common/bottom-nav';
import { MiniCartDrawer } from '@/components/store/mini-cart-drawer';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative h-full w-full overflow-hidden bg-black">
      <main className="h-full">{children}</main>
      <MiniCartDrawer />
      <BottomNav />
    </div>
  );
}
