'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase/client';
import type { Order, Gig, Transaction } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, TrendingUp, Package, Clock, CheckCircle2, DollarSign, ArrowRight, Plus } from 'lucide-react';
import Link from 'next/link';
import { StatusBadge } from '@/components/status-badge';

export default function DashboardPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [gigs, setGigs] = useState<Gig[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/sign-in');
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    const isCreator = profile?.role === 'creator';

    const [ordersRes, gigsRes, txRes] = await Promise.all([
      supabase
        .from('orders')
        .select('*, hirer:profiles!orders_hirer_id_fkey(*), creator:profiles!orders_creator_id_fkey(*), gig:gigs(*)')
        .or(`hirer_id.eq.${user.id},creator_id.eq.${user.id}`)
        .order('created_at', { ascending: false }),
      isCreator
        ? supabase.from('gigs').select('*').eq('creator_id', user.id).order('created_at', { ascending: false })
        : Promise.resolve({ data: [], error: null }),
      supabase.from('transactions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
    ]);

    if (ordersRes.data) setOrders(ordersRes.data as Order[]);
    if (gigsRes.data) setGigs(gigsRes.data as Gig[]);
    if (txRes.data) setTransactions(txRes.data as Transaction[]);
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
  const activeOrders = orders.filter((o) => ['accepted', 'payment_pending', 'payment_initiated', 'payment_verified', 'paid', 'delivered'].includes(o.status));
  const pendingOrders = orders.filter((o) => o.status === 'pending');
  const completedOrders = orders.filter((o) => o.status === 'completed');

  const earnings = isCreator
    ? transactions.filter((t) => t.type === 'credit' && t.status === 'completed').reduce((sum, t) => sum + Number(t.amount), 0)
    : 0;
  const spent = !isCreator
    ? transactions.filter((t) => t.type === 'debit' && t.status === 'completed').reduce((sum, t) => sum + Number(t.amount), 0)
    : 0;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {isCreator ? 'Creator Dashboard' : 'Hirer Dashboard'}
            </h1>
            <p className="mt-2 text-muted-foreground">
              Welcome back, {profile?.full_name}
            </p>
          </div>
          {isCreator ? (
            <Link href="/portfolio">
              <Button className="glow-primary">
                <Plus className="mr-2 h-4 w-4" /> Create Gig
              </Button>
            </Link>
          ) : (
            <Link href="/gig">
              <Button className="glow-primary">
                <Plus className="mr-2 h-4 w-4" /> Find Creators
              </Button>
            </Link>
          )}
        </div>

        {/* Stats */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={isCreator ? DollarSign : TrendingUp}
            label={isCreator ? 'Total Earnings' : 'Total Spent'}
            value={`₹${isCreator ? earnings : spent}`}
            color="text-emerald-400"
          />
          <StatCard icon={Package} label="Active Orders" value={activeOrders.length.toString()} color="text-blue-400" />
          <StatCard icon={Clock} label="Pending Orders" value={pendingOrders.length.toString()} color="text-amber-400" />
          <StatCard icon={CheckCircle2} label="Completed" value={completedOrders.length.toString()} color="text-teal-400" />
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Recent Orders */}
          <div className="lg:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold">Recent Orders</h2>
              <Link href="/dashboard/orders">
                <Button variant="ghost" size="sm">
                  View all <ArrowRight className="ml-1 h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
            {orders.length === 0 ? (
              <Card className="glass-card">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <Package className="mb-3 h-10 w-10 text-muted-foreground/40" />
                  <p className="font-medium">No orders yet</p>
                  <p className="text-sm text-muted-foreground">
                    {isCreator ? 'Orders from hirers will appear here' : 'Your hired services will appear here'}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {orders.slice(0, 5).map((order) => (
                  <Link key={order.id} href={`/orders/${order.id}`}>
                    <Card className="glass-card transition-all hover:glow-sm hover:border-primary/30">
                      <CardContent className="flex items-center justify-between p-4">
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium">{order.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {isCreator ? order.hirer?.full_name : order.creator?.full_name} · ₹{order.amount}
                          </p>
                        </div>
                        <StatusBadge status={order.status} />
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {isCreator && (
              <div>
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-xl font-semibold">Your Gigs</h2>
                  <Link href="/portfolio">
                    <Button variant="ghost" size="sm">Manage</Button>
                  </Link>
                </div>
                {gigs.length === 0 ? (
                  <Card className="glass-card">
                    <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                      <p className="text-sm text-muted-foreground">No gigs yet</p>
                      <Link href="/portfolio">
                        <Button size="sm" variant="outline" className="mt-3">Create your first gig</Button>
                      </Link>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-2">
                    {gigs.slice(0, 4).map((gig) => (
                      <Card key={gig.id} className="glass-card">
                        <CardContent className="p-3">
                          <p className="truncate text-sm font-medium">{gig.title}</p>
                          <p className="text-sm text-primary">₹{gig.price}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div>
              <h2 className="mb-4 text-xl font-semibold">Recent Transactions</h2>
              {transactions.length === 0 ? (
                <Card className="glass-card">
                  <CardContent className="py-6 text-center">
                    <p className="text-sm text-muted-foreground">No transactions yet</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-2">
                  {transactions.slice(0, 5).map((tx) => (
                    <Card key={tx.id} className="glass-card">
                      <CardContent className="flex items-center justify-between p-3">
                        <div>
                          <p className="text-sm font-medium">{tx.description || 'Transaction'}</p>
                          <p className="text-xs text-muted-foreground">{new Date(tx.created_at).toLocaleDateString()}</p>
                        </div>
                        <span className={`text-sm font-semibold ${tx.type === 'credit' ? 'text-emerald-400' : 'text-red-400'}`}>
                          {tx.type === 'credit' ? '+' : '-'}₹{tx.amount}
                        </span>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: string; color: string }) {
  return (
    <Card className="glass-card">
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="mt-1 text-2xl font-bold">{value}</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-card/60">
            <Icon className={`h-5 w-5 ${color}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
