'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Save, User, Briefcase, CheckCircle2, DollarSign, Star } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function ProfilePage() {
  const { user, profile, loading: authLoading, refreshProfile } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [fullName, setFullName] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [upiId, setUpiId] = useState('');
  const [skills, setSkills] = useState('');
  const [saving, setSaving] = useState(false);
  const [stats, setStats] = useState({ gigs: 0, completedOrders: 0, earnings: 0, totalOrders: 0 });

  useEffect(() => {
    if (!authLoading && !user) router.push('/auth/sign-in');
  }, [authLoading, user, router]);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setBio(profile.bio || '');
      setAvatarUrl(profile.avatar_url || '');
      setPortfolioUrl(profile.portfolio_url || '');
      setUpiId(profile.upi_id || '9372169983@axl');
      setSkills(profile.skills?.join(', ') || '');
    }
  }, [profile]);

  useEffect(() => {
    if (user) loadStats();
  }, [user]);

  const loadStats = async () => {
    if (!user) return;
    const isCreator = profile?.role === 'creator';

    if (isCreator) {
      const [gigsRes, ordersRes, txRes] = await Promise.all([
        supabase.from('gigs').select('id', { count: 'exact' }).eq('creator_id', user.id),
        supabase.from('orders').select('id, status').eq('creator_id', user.id),
        supabase.from('transactions').select('amount').eq('user_id', user.id).eq('type', 'credit').eq('status', 'completed'),
      ]);
      const completed = ordersRes.data?.filter((o: any) => o.status === 'completed').length || 0;
      const earnings = txRes.data?.reduce((sum: number, t: any) => sum + Number(t.amount), 0) || 0;
      setStats({ gigs: gigsRes.count || 0, completedOrders: completed, earnings, totalOrders: ordersRes.data?.length || 0 });
    } else {
      const [ordersRes, txRes] = await Promise.all([
        supabase.from('orders').select('id, status').eq('hirer_id', user.id),
        supabase.from('transactions').select('amount').eq('user_id', user.id).eq('type', 'debit').eq('status', 'completed'),
      ]);
      const completed = ordersRes.data?.filter((o: any) => o.status === 'completed').length || 0;
      const spent = txRes.data?.reduce((sum: number, t: any) => sum + Number(t.amount), 0) || 0;
      setStats({ gigs: 0, completedOrders: completed, earnings: spent, totalOrders: ordersRes.data?.length || 0 });
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: fullName,
        bio,
        avatar_url: avatarUrl,
        portfolio_url: portfolioUrl,
        upi_id: upiId,
        skills: skills.split(',').map((s) => s.trim()).filter(Boolean),
      })
      .eq('id', user.id);
    setSaving(false);
    if (error) {
      toast({ title: 'Failed to save profile', variant: 'destructive' });
    } else {
      toast({ title: 'Profile updated!' });
      refreshProfile();
    }
  };

  if (authLoading) {
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

      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <h1 className="mb-8 text-3xl font-bold tracking-tight">Profile</h1>

        {/* Stats */}
        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          {isCreator ? (
            <>
              <StatCard icon={Briefcase} label="Active Gigs" value={stats.gigs.toString()} />
              <StatCard icon={CheckCircle2} label="Completed Orders" value={stats.completedOrders.toString()} />
              <StatCard icon={DollarSign} label="Total Earnings" value={`₹${stats.earnings}`} />
            </>
          ) : (
            <>
              <StatCard icon={CheckCircle2} label="Total Hires" value={stats.totalOrders.toString()} />
              <StatCard icon={CheckCircle2} label="Completed" value={stats.completedOrders.toString()} />
              <StatCard icon={DollarSign} label="Total Spent" value={`₹${stats.earnings}`} />
            </>
          )}
        </div>

        {/* Profile card */}
        <Card className="glass-card mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <User className="h-5 w-5 text-primary" /> Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/15 text-xl font-semibold text-primary">
                {fullName?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div>
                <p className="font-medium">{fullName || 'Your name'}</p>
                <p className="text-sm text-muted-foreground">{profile?.email}</p>
                <span className="mt-1 inline-block rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium capitalize text-primary">
                  {profile?.role}
                </span>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" value={profile?.email || ''} disabled className="opacity-60" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea id="bio" placeholder="Tell clients about yourself..." value={bio} onChange={(e) => setBio(e.target.value)} rows={3} />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="avatar">Avatar URL</Label>
                <Input id="avatar" placeholder="https://..." value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="portfolio">Portfolio URL</Label>
                <Input id="portfolio" placeholder="https://..." value={portfolioUrl} onChange={(e) => setPortfolioUrl(e.target.value)} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="skills">Skills (comma-separated)</Label>
              <Input id="skills" placeholder="Design, Branding, UI/UX" value={skills} onChange={(e) => setSkills(e.target.value)} />
            </div>

            {isCreator && (
              <div className="space-y-2">
                <Label htmlFor="upi">UPI ID (for receiving payments)</Label>
                <Input id="upi" placeholder="yourname@bank" value={upiId} onChange={(e) => setUpiId(e.target.value)} />
                <p className="text-xs text-muted-foreground">
                  This UPI ID will be shown to hirers when they pay for your services.
                </p>
              </div>
            )}

            <div className="pt-2">
              <Button onClick={handleSave} disabled={saving} className="glow-primary">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save Changes
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Skills display */}
        {profile?.skills && profile.skills.length > 0 && (
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-lg">Skills</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {profile.skills.map((skill) => (
                  <span key={skill} className="rounded-md border border-border/60 bg-card/40 px-3 py-1.5 text-sm">
                    {skill}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <Footer />
    </div>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <Card className="glass-card">
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="mt-1 text-2xl font-bold">{value}</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
