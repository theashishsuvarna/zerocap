'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase/client';
import { GIG_CATEGORIES } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Briefcase, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

export default function PostJobPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [budget, setBudget] = useState('');
  const [category, setCategory] = useState(GIG_CATEGORIES[0]);
  const [skills, setSkills] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.push('/auth/sign-in');
  }, [authLoading, user, router]);

  const handlePost = async () => {
    if (!user || !title.trim() || !description.trim() || !budget) return;
    setSaving(true);

    const { error } = await supabase.from('jobs').insert({
      hirer_id: user.id,
      title: title.trim(),
      description: description.trim(),
      budget: parseFloat(budget),
      category: category.toLowerCase(),
      skills_required: skills.split(',').map((s) => s.trim()).filter(Boolean),
      status: 'open',
    });

    setSaving(false);
    if (error) {
      toast({ title: 'Failed to post job', variant: 'destructive' });
    } else {
      toast({ title: 'Job posted successfully!' });
      router.push('/dashboard');
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

  if (profile?.role === 'creator') {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="mx-auto max-w-3xl px-4 py-20 text-center">
          <p className="text-lg font-medium">Only hirers can post jobs</p>
          <p className="mt-2 text-sm text-muted-foreground">Switch to a hirer account to post a job.</p>
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

        <h1 className="mb-8 text-3xl font-bold tracking-tight">Post a Job</h1>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Briefcase className="h-5 w-5 text-primary" /> Job Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="job-title">Title</Label>
              <Input id="job-title" placeholder="Need a modern logo design" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="job-desc">Description</Label>
              <Textarea id="job-desc" placeholder="Describe your project in detail..." value={description} onChange={(e) => setDescription(e.target.value)} rows={5} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="job-budget">Budget (₹)</Label>
                <Input id="job-budget" type="number" placeholder="5000" value={budget} onChange={(e) => setBudget(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="job-cat">Category</Label>
                <select
                  id="job-cat"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  {GIG_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="job-skills">Skills Required (comma-separated)</Label>
              <Input id="job-skills" placeholder="Photoshop, Illustrator, Branding" value={skills} onChange={(e) => setSkills(e.target.value)} />
            </div>
            <Button onClick={handlePost} disabled={saving || !title.trim() || !description.trim() || !budget} className="glow-primary w-full">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Post Job'}
            </Button>
          </CardContent>
        </Card>
      </div>

      <Footer />
    </div>
  );
}
