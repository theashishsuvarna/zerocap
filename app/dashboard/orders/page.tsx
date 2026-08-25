'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase/client';
import type { Order } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Package, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { StatusBadge } from '@/components/status-badge';

export default function OrdersListPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) router.push('/auth/sign-in');
  }, [authLoading, user, router]);

  useEffect(() => {
    if (user) loadOrders();
  }, [user]);

  const loadOrders = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('orders')
      .select('*, hirer:profiles!orders_hirer_id_fkey(*), creator:profiles!orders_creator_id_fkey(*)')
      .or(`hirer_id.eq.${user.id},creator_id.eq.${user.id}`)
      .order('created_at', { ascending: false });
    if (data) setOrders(data as Order[]);
    setLoading(false);
  };

  if (authLoading || (user && loading)) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!user) return null;

  const isCreator = profile?.role === 'creator';

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <Link href="/dashboard" className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to dashboard
        </Link>

        <h1 className="mb-8 text-3xl font-bold tracking-tight">All Orders</h1>

        {orders.length === 0 ? (
          <Card className="glass-card">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <Package className="mb-4 h-12 w-12 text-muted-foreground/40" />
              <p className="text-lg font-medium">No orders yet</p>
              <p className="text-sm text-muted-foreground">
                {isCreator ? 'When hirers order your gigs, they will appear here' : 'When you hire a creator, your orders will appear here'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => (
              <Link key={order.id} href={`/orders/${order.id}`}>
                <Card className="glass-card transition-all hover:glow-sm hover:border-primary/30">
                  <CardContent className="flex items-center justify-between p-5">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-3">
                        <p className="truncate font-medium">{order.title}</p>
                        <StatusBadge status={order.status} />
                      </div>
                      <div className="mt-1 flex items-center gap-3 text-sm text-muted-foreground">
                        <span>{isCreator ? order.hirer?.full_name : order.creator?.full_name}</span>
                        <span>·</span>
                        <span className="text-primary">₹{order.amount}</span>
                        <span>·</span>
                        <span className="text-xs">{order.order_ref}</span>
                      </div>
                    </div>
                    <div className="ml-4 text-right">
                      <p className="text-xs text-muted-foreground">{new Date(order.created_at).toLocaleDateString()}</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
