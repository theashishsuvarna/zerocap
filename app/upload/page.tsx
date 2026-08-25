'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase/client';
import type { Order } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Upload, Shield, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

export default function UploadPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

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
      .select('*, hirer:profiles!orders_hirer_id_fkey(*)')
      .eq('creator_id', user.id)
      .in('status', ['accepted', 'payment_initiated', 'payment_verified', 'paid', 'delivered'])
      .order('created_at', { ascending: false });
    if (data) setOrders(data as Order[]);
    setLoading(false);
  };

  const handleUpload = async () => {
    if (!user || !selectedOrder || !file || !title.trim()) return;
    setUploading(true);

    try {
      const order = orders.find((o) => o.id === selectedOrder);
      if (!order) return;

      const filePath = `${order.id}/${Date.now()}-${file.name}`;

      const { error: uploadError } = await supabase.storage
        .from('deliverables')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const previewPath = `${order.id}/preview-${Date.now()}-${file.name}`;
      const { error: previewError } = await supabase.storage
        .from('previews')
        .upload(previewPath, file);

      if (previewError) throw previewError;

      const previewUrl = supabase.storage.from('previews').getPublicUrl(previewPath).data.publicUrl;

      const { error: dbError } = await supabase.from('deliverables').insert({
        order_id: order.id,
        creator_id: user.id,
        hirer_id: order.hirer_id,
        title: title.trim(),
        description: description.trim(),
        original_file_path: filePath,
        preview_file_path: previewUrl,
        file_type: file.type,
        file_size: file.size,
        is_unlocked: false,
      });

      if (dbError) throw dbError;

      await supabase.from('orders').update({ status: 'delivered' }).eq('id', order.id);

      toast({ title: 'Deliverable uploaded successfully!' });
      router.push(`/orders/${order.id}`);
    } catch (err: any) {
      toast({ title: 'Upload failed', description: err.message, variant: 'destructive' });
    }
    setUploading(false);
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

  if (profile?.role !== 'creator') {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="mx-auto max-w-3xl px-4 py-20 text-center">
          <p className="text-lg font-medium">Only creators can upload deliverables</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        <Link href="/dashboard" className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to dashboard
        </Link>

        <h1 className="mb-8 text-3xl font-bold tracking-tight">Upload Deliverable</h1>

        {orders.length === 0 ? (
          <Card className="glass-card">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <Upload className="mb-4 h-12 w-12 text-muted-foreground/40" />
              <p className="text-lg font-medium">No active orders</p>
              <p className="text-sm text-muted-foreground">You need an accepted order to upload a deliverable.</p>
            </CardContent>
          </Card>
        ) : (
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Upload className="h-5 w-5 text-primary" /> Upload File
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="order">Select Order</Label>
                <select
                  id="order"
                  value={selectedOrder}
                  onChange={(e) => setSelectedOrder(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">Choose an order...</option>
                  {orders.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.title} - {o.hirer?.full_name} (₹{o.amount})
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="title">Deliverable Title</Label>
                <Input id="title" placeholder="Final design files" value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="desc">Description (optional)</Label>
                <Textarea id="desc" placeholder="Describe the deliverable..." value={description} onChange={(e) => setDescription(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="file">File</Label>
                <Input id="file" type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
              </div>
              <Button onClick={handleUpload} disabled={uploading || !selectedOrder || !file || !title.trim()} className="w-full glow-primary">
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Upload Deliverable'}
              </Button>
              <div className="flex items-start gap-2 rounded-lg border border-primary/20 bg-primary/5 p-4">
                <Shield className="h-4 w-4 shrink-0 text-primary" />
                <p className="text-xs text-muted-foreground">
                  The original file is stored in private storage. A preview is shown to the hirer.
                  The original is only unlocked after server-side payment verification.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <Footer />
    </div>
  );
}
