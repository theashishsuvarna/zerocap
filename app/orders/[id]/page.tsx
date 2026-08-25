'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase/client';
import { generateUpiUri, generateQrDataUri } from '@/lib/upi';
import type { Order, Payment, Deliverable, Message, Profile } from '@/lib/types';
import { ORDER_STATUS_LABELS, PAYMENT_STATUS_LABELS } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { StatusBadge, PaymentStatusBadge } from '@/components/status-badge';
import { Loader2, ArrowLeft, Shield, CreditCard, QrCode, Copy, CheckCircle2, Lock, FileLock, Download, Send, Upload, AlertCircle, Eye } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';

export default function OrderDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, profile, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [order, setOrder] = useState<Order | null>(null);
  const [payment, setPayment] = useState<Payment | null>(null);
  const [deliverables, setDeliverables] = useState<Deliverable[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [qrDataUri, setQrDataUri] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [utrNumber, setUtrNumber] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDesc, setUploadDesc] = useState('');
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});

  const loadOrder = useCallback(async () => {
    const { data: orderData } = await supabase
      .from('orders')
      .select('*, hirer:profiles!orders_hirer_id_fkey(*), creator:profiles!orders_creator_id_fkey(*), gig:gigs(*)')
      .eq('id', id)
      .maybeSingle();

    if (!orderData) {
      setLoading(false);
      return;
    }
    setOrder(orderData as Order);

    const [payRes, delRes, msgRes] = await Promise.all([
      supabase.from('payments').select('*').eq('order_id', id).order('created_at', { ascending: false }).maybeSingle(),
      supabase.from('deliverables').select('*').eq('order_id', id).order('created_at', { ascending: false }),
      supabase.from('messages').select('*').eq('order_id', id).order('created_at', { ascending: true }),
    ]);

    if (payRes.data) setPayment(payRes.data as Payment);
    if (delRes.data) setDeliverables(delRes.data as Deliverable[]);
    if (msgRes.data) setMessages(msgRes.data as Message[]);

    setLoading(false);
  }, [id]);

  useEffect(() => {
    if (!authLoading && !user) router.push('/auth/sign-in');
  }, [authLoading, user, router]);

  useEffect(() => {
    if (user) loadOrder();
  }, [user, loadOrder]);

  // Generate QR when payment is initiated
  useEffect(() => {
    if (order && (order.status === 'payment_pending' || order.status === 'payment_initiated') && payment) {
      const upiUri = generateUpiUri({
        payeeId: payment.upi_id,
        payeeName: order.creator?.full_name,
        amount: Number(order.amount),
        note: `ZeroCap Order ${order.order_ref}`,
        txnRef: order.order_ref || undefined,
      });
      generateQrDataUri(upiUri).then(setQrDataUri);
    }
  }, [order, payment]);

  // Poll for payment verification
  useEffect(() => {
    if (!order || !payment) return;
    if (payment.status === 'initiated' || payment.status === 'pending') {
      const interval = setInterval(async () => {
        const { data } = await supabase
          .from('payments')
          .select('*')
          .eq('id', payment.id)
          .maybeSingle();
        if (data && data.status !== payment.status) {
          setPayment(data as Payment);
          if (data.status === 'verified' || data.status === 'paid') {
            loadOrder();
            toast({ title: 'Payment verified!' });
          }
        }
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [order, payment, loadOrder, toast]);

  const isCreator = profile?.id === order?.creator_id;
  const isHirer = profile?.id === order?.hirer_id;

  const handleAcceptOrder = async () => {
    if (!order) return;
    const { error } = await supabase
      .from('orders')
      .update({ status: 'accepted' })
      .eq('id', order.id);
    if (error) {
      toast({ title: 'Failed to accept order', variant: 'destructive' });
    } else {
      toast({ title: 'Order accepted!' });
      loadOrder();
    }
  };

  const handleRejectOrder = async () => {
    if (!order) return;
    const { error } = await supabase
      .from('orders')
      .update({ status: 'rejected' })
      .eq('id', order.id);
    if (error) {
      toast({ title: 'Failed to reject order', variant: 'destructive' });
    } else {
      toast({ title: 'Order rejected' });
      loadOrder();
    }
  };

  const handleInitiatePayment = async () => {
    if (!order || !user) return;
    const { data, error } = await supabase
      .from('payments')
      .insert({
        order_id: order.id,
        hirer_id: user.id,
        creator_id: order.creator_id,
        amount: order.amount,
        upi_id: order.creator?.upi_id || '9372169983@axl',
        method: 'upi',
        status: 'initiated',
      })
      .select()
      .single();

    if (error) {
      toast({ title: 'Failed to initiate payment', variant: 'destructive' });
      return;
    }

    await supabase
      .from('orders')
      .update({ status: 'payment_initiated' })
      .eq('id', order.id);

    setPayment(data as Payment);
    loadOrder();
    toast({ title: 'Payment initiated. Scan the QR to pay.' });
  };

  const handleSubmitUtr = async () => {
    if (!order || !payment || !utrNumber.trim()) return;
    setVerifying(true);

    try {
      // Call the edge function to verify payment
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/verify-payment`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            paymentId: payment.id,
            orderId: order.id,
            utrNumber: utrNumber.trim(),
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        toast({ title: result.error || 'Verification failed', variant: 'destructive' });
      } else {
        toast({ title: 'Payment submitted for verification!' });
        setUtrNumber('');
        loadOrder();
      }
    } catch {
      toast({ title: 'Failed to submit UTR. Please try again.', variant: 'destructive' });
    }
    setVerifying(false);
  };

  const handleUploadDeliverable = async () => {
    if (!order || !user || !uploadFile || !uploadTitle.trim()) return;
    setUploading(true);

    try {
      const filePath = `${order.id}/${Date.now()}-${uploadFile.name}`;

      // Upload original to private bucket
      const { error: uploadError } = await supabase.storage
        .from('deliverables')
        .upload(filePath, uploadFile);

      if (uploadError) throw uploadError;

      // Also upload to public previews bucket (same file as preview for now)
      const previewPath = `${order.id}/preview-${Date.now()}-${uploadFile.name}`;
      const { error: previewError } = await supabase.storage
        .from('previews')
        .upload(previewPath, uploadFile);

      if (previewError) throw previewError;

      const previewUrl = supabase.storage.from('previews').getPublicUrl(previewPath).data.publicUrl;

      const { error: dbError } = await supabase.from('deliverables').insert({
        order_id: order.id,
        creator_id: user.id,
        hirer_id: order.hirer_id,
        title: uploadTitle,
        description: uploadDesc,
        original_file_path: filePath,
        preview_file_path: previewUrl,
        file_type: uploadFile.type,
        file_size: uploadFile.size,
        is_unlocked: false,
      });

      if (dbError) throw dbError;

      // Update order status to delivered
      await supabase
        .from('orders')
        .update({ status: 'delivered' })
        .eq('id', order.id);

      toast({ title: 'Deliverable uploaded successfully!' });
      setUploadFile(null);
      setUploadTitle('');
      setUploadDesc('');
      loadOrder();
    } catch (err: any) {
      toast({ title: 'Upload failed', description: err.message, variant: 'destructive' });
    }
    setUploading(false);
  };

  const handleDownloadOriginal = async (deliverable: Deliverable) => {
    if (!deliverable.is_unlocked) return;
    const { data, error } = await supabase.storage
      .from('deliverables')
      .createSignedUrl(deliverable.original_file_path, 300);

    if (error || !data?.signedUrl) {
      toast({ title: 'Failed to generate download link', variant: 'destructive' });
      return;
    }
    window.open(data.signedUrl, '_blank');
  };

  const handleSendMessage = async () => {
    if (!order || !user || !newMessage.trim()) return;
    setSendingMessage(true);

    const receiverId = isCreator ? order.hirer_id : order.creator_id;

    const { error } = await supabase.from('messages').insert({
      order_id: order.id,
      sender_id: user.id,
      receiver_id: receiverId,
      content: newMessage.trim(),
    });

    if (error) {
      toast({ title: 'Failed to send message', variant: 'destructive' });
    } else {
      setNewMessage('');
      loadOrder();
    }
    setSendingMessage(false);
  };

  const copyUpiId = () => {
    if (!payment) return;
    navigator.clipboard.writeText(payment.upi_id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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

  if (!order) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="mx-auto max-w-3xl px-4 py-20 text-center">
          <p className="text-lg font-medium">Order not found</p>
          <Link href="/dashboard"><Button variant="outline" className="mt-4">Back to dashboard</Button></Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <Link href="/dashboard/orders" className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to orders
        </Link>

        {/* Order header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{order.title}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <span>Order Ref: {order.order_ref}</span>
              <span>·</span>
              <span>{isCreator ? `Hirer: ${order.hirer?.full_name}` : `Creator: ${order.creator?.full_name}`}</span>
              <span>·</span>
              <span className="text-primary">₹{order.amount}</span>
            </div>
          </div>
          <StatusBadge status={order.status} className="text-sm" />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main column */}
          <div className="space-y-6 lg:col-span-2">
            {/* Order status / actions */}
            {order.status === 'pending' && (
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="text-lg">Order Request</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    {isCreator
                      ? 'A hirer has requested this service. Accept or reject to proceed.'
                      : 'Your order is awaiting the creator\'s acceptance.'}
                  </p>
                  {order.description && (
                    <div className="rounded-lg border border-border/60 bg-card/40 p-4">
                      <p className="text-sm">{order.description}</p>
                    </div>
                  )}
                  {isCreator && (
                    <div className="flex gap-3">
                      <Button onClick={handleAcceptOrder} className="glow-primary">
                        <CheckCircle2 className="mr-2 h-4 w-4" /> Accept Order
                      </Button>
                      <Button onClick={handleRejectOrder} variant="outline" className="text-destructive">
                        Reject
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Payment section */}
            {(order.status === 'accepted' || order.status === 'payment_initiated' || order.status === 'payment_verified' || order.status === 'paid') && isHirer && (
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <CreditCard className="h-5 w-5 text-primary" /> Payment
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  {/* Payment details */}
                  <div className="grid grid-cols-2 gap-4 rounded-lg border border-border/60 bg-card/40 p-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Creator</p>
                      <p className="text-sm font-medium">{order.creator?.full_name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Service</p>
                      <p className="text-sm font-medium">{order.title}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Order ID</p>
                      <p className="text-sm font-medium">{order.order_ref}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Amount</p>
                      <p className="text-lg font-bold text-primary">₹{order.amount}</p>
                    </div>
                  </div>

                  {/* Payment status */}
                  {payment && (
                    <div className="flex items-center justify-between rounded-lg border border-border/60 p-4">
                      <span className="text-sm text-muted-foreground">Payment Status</span>
                      <PaymentStatusBadge status={payment.status} />
                    </div>
                  )}

                  {/* Initiate payment */}
                  {order.status === 'accepted' && !payment && (
                    <Button onClick={handleInitiatePayment} className="w-full glow-primary" size="lg">
                      <CreditCard className="mr-2 h-4 w-4" /> Proceed to Payment
                    </Button>
                  )}

                  {/* UPI payment UI */}
                  {payment && (payment.status === 'initiated' || payment.status === 'pending') && (
                    <div className="space-y-5">
                      {/* UPI ID */}
                      <div className="rounded-lg border border-border/60 bg-card/40 p-4">
                        <Label className="text-xs text-muted-foreground">UPI ID</Label>
                        <div className="mt-1 flex items-center justify-between">
                          <code className="text-sm font-medium">{payment.upi_id}</code>
                          <Button size="sm" variant="ghost" onClick={copyUpiId}>
                            {copied ? <CheckCircle2 className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>

                      {/* QR Code */}
                      <div className="flex flex-col items-center rounded-lg border border-border/60 bg-white p-6">
                        {qrDataUri ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={qrDataUri} alt="UPI Payment QR" className="h-48 w-48" />
                        ) : (
                          <div className="flex h-48 w-48 items-center justify-center">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                          </div>
                        )}
                        <div className="mt-3 flex items-center gap-2 text-sm text-zinc-700">
                          <QrCode className="h-4 w-4" /> Scan to pay via UPI
                        </div>
                      </div>

                      {/* UPI app links */}
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { name: 'GPay', url: generateUpiUri({ payeeId: payment.upi_id, amount: Number(order.amount), note: order.order_ref || undefined }) },
                          { name: 'PhonePe', url: generateUpiUri({ payeeId: payment.upi_id, amount: Number(order.amount), note: order.order_ref || undefined }) },
                          { name: 'Paytm', url: generateUpiUri({ payeeId: payment.upi_id, amount: Number(order.amount), note: order.order_ref || undefined }) },
                        ].map((app) => (
                          <a key={app.name} href={app.url} className="rounded-lg border border-border/60 bg-card/40 p-3 text-center text-sm transition-colors hover:bg-card/80">
                            {app.name}
                          </a>
                        ))}
                      </div>

                      {/* UTR submission */}
                      <div className="space-y-3 rounded-lg border border-primary/20 bg-primary/5 p-4">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="h-4 w-4 shrink-0 text-primary" />
                          <p className="text-xs text-muted-foreground">
                            After paying, enter your UTR/Transaction Reference number below.
                            The system will verify your payment before unlocking the original file.
                          </p>
                        </div>
                        <Input
                          placeholder="Enter UTR / Transaction Ref"
                          value={utrNumber}
                          onChange={(e) => setUtrNumber(e.target.value)}
                        />
                        <Button onClick={handleSubmitUtr} className="w-full" disabled={verifying || !utrNumber.trim()}>
                          {verifying ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Submit for Verification'}
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Payment verified / paid */}
                  {payment && (payment.status === 'verified' || payment.status === 'paid') && (
                    <div className="flex items-center gap-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4">
                      <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                      <div>
                        <p className="text-sm font-medium text-emerald-400">Payment Verified</p>
                        <p className="text-xs text-muted-foreground">Your payment has been verified. Original files are now unlocked.</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Payment status for creator */}
            {(order.status === 'payment_initiated' || order.status === 'payment_verified' || order.status === 'paid') && isCreator && (
              <Card className="glass-card">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Payment Status</span>
                    {payment ? <PaymentStatusBadge status={payment.status} /> : <StatusBadge status={order.status} />}
                  </div>
                  {payment?.utr_number && (
                    <div className="mt-3 text-xs text-muted-foreground">
                      UTR: {payment.utr_number}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Deliverables */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileLock className="h-5 w-5 text-primary" /> Deliverables
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {deliverables.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <FileLock className="mb-3 h-10 w-10 text-muted-foreground/40" />
                    <p className="text-sm text-muted-foreground">
                      {isCreator ? 'No deliverables uploaded yet' : 'Waiting for creator to upload deliverables'}
                    </p>
                  </div>
                ) : (
                  deliverables.map((del) => (
                    <div key={del.id} className="rounded-lg border border-border/60 bg-card/40 p-4">
                      <div className="flex items-start justify-between">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium">{del.title}</p>
                          {del.description && <p className="mt-1 text-sm text-muted-foreground">{del.description}</p>}
                        </div>
                        {del.is_unlocked ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-400">
                            <Lock className="h-3 w-3" /> Unlocked
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-400">
                            <Lock className="h-3 w-3" /> Locked
                          </span>
                        )}
                      </div>

                      <div className="mt-3 flex gap-2">
                        {/* Preview - always available */}
                        {del.preview_file_path && (
                          <a href={del.preview_file_path} target="_blank" rel="noopener noreferrer">
                            <Button size="sm" variant="outline">
                              <Eye className="mr-1.5 h-3.5 w-3.5" /> View Preview
                            </Button>
                          </a>
                        )}

                        {/* Download original - only if unlocked */}
                        {del.is_unlocked && isHirer && (
                          <Button size="sm" onClick={() => handleDownloadOriginal(del)} className="glow-sm">
                            <Download className="mr-1.5 h-3.5 w-3.5" /> Download Original
                          </Button>
                        )}

                        {/* Creator can download original anytime */}
                        {isCreator && (
                          <Button size="sm" variant="ghost" onClick={() => handleDownloadOriginal(del)}>
                            <Download className="mr-1.5 h-3.5 w-3.5" /> Download
                          </Button>
                        )}
                      </div>

                      {!del.is_unlocked && isHirer && (
                        <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Shield className="h-3 w-3" /> Original file unlocks after verified payment
                        </p>
                      )}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Upload deliverable (creator only) */}
            {isCreator && (order.status === 'accepted' || order.status === 'payment_initiated' || order.status === 'payment_verified' || order.status === 'paid' || order.status === 'delivered') && (
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Upload className="h-5 w-5 text-primary" /> Upload Deliverable
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="upload-title">Title</Label>
                    <Input
                      id="upload-title"
                      placeholder="Final design files"
                      value={uploadTitle}
                      onChange={(e) => setUploadTitle(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="upload-desc">Description (optional)</Label>
                    <Textarea
                      id="upload-desc"
                      placeholder="Describe the deliverable..."
                      value={uploadDesc}
                      onChange={(e) => setUploadDesc(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="upload-file">File</Label>
                    <Input
                      id="upload-file"
                      type="file"
                      onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                    />
                  </div>
                  <Button onClick={handleUploadDeliverable} disabled={uploading || !uploadFile || !uploadTitle.trim()} className="w-full">
                    {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Upload Deliverable'}
                  </Button>
                  <p className="flex items-start gap-2 text-xs text-muted-foreground">
                    <Shield className="h-3.5 w-3.5 shrink-0 text-primary" />
                    The original file is stored privately. A watermarked preview is shown to the hirer.
                    The original is unlocked only after verified payment.
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Messages */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-lg">Messages</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {messages.length === 0 ? (
                  <p className="py-4 text-center text-sm text-muted-foreground">No messages yet. Start the conversation.</p>
                ) : (
                  <div className="max-h-64 space-y-3 overflow-y-auto scrollbar-thin">
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[75%] rounded-lg px-3.5 py-2 text-sm ${
                            msg.sender_id === user?.id
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-card border border-border/60'
                          }`}
                        >
                          {msg.content}
                          <p className={`mt-1 text-xs ${msg.sender_id === user?.id ? 'text-primary-foreground/60' : 'text-muted-foreground'}`}>
                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <Input
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                  />
                  <Button onClick={handleSendMessage} size="icon" disabled={sendingMessage || !newMessage.trim()}>
                    {sendingMessage ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card className="glass-card">
              <CardContent className="p-5">
                <h3 className="mb-3 text-sm font-semibold">Order Timeline</h3>
                <div className="space-y-3">
                  {[
                    { label: 'Order Created', done: true, date: order.created_at },
                    { label: 'Creator Accepted', done: ['accepted', 'payment_initiated', 'payment_verified', 'paid', 'delivered', 'completed'].includes(order.status) },
                    { label: 'Payment Initiated', done: ['payment_initiated', 'payment_verified', 'paid', 'delivered', 'completed'].includes(order.status) },
                    { label: 'Payment Verified', done: ['payment_verified', 'paid', 'delivered', 'completed'].includes(order.status) },
                    { label: 'Deliverable Unlocked', done: ['delivered', 'completed'].includes(order.status) && deliverables.some(d => d.is_unlocked) },
                  ].map((step, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                        step.done ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
                      }`}>
                        {step.done ? <CheckCircle2 className="h-3.5 w-3.5" /> : i + 1}
                      </div>
                      <span className={`text-sm ${step.done ? 'text-foreground' : 'text-muted-foreground'}`}>
                        {step.label}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 shrink-0 text-primary" />
                  <div>
                    <p className="text-sm font-medium">ZeroCap Trust</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Original files are stored in private storage and only unlocked after server-side payment verification.
                      Never trust a &quot;payment completed&quot; button — only verified status unlocks files.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

