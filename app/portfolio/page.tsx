'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase/client';
import type { Gig, PortfolioItem } from '@/lib/types';
import { GIG_CATEGORIES } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Plus, Trash2, Edit3, Star, Image as ImageIcon, ExternalLink, Briefcase } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type Tab = 'gigs' | 'projects';

export default function PortfolioPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [tab, setTab] = useState<Tab>('gigs');
  const [gigs, setGigs] = useState<Gig[]>([]);
  const [projects, setProjects] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showGigForm, setShowGigForm] = useState(false);
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [editingGig, setEditingGig] = useState<Gig | null>(null);
  const [editingProject, setEditingProject] = useState<PortfolioItem | null>(null);
  const [saving, setSaving] = useState(false);

  // Gig form state
  const [gigTitle, setGigTitle] = useState('');
  const [gigDesc, setGigDesc] = useState('');
  const [gigPrice, setGigPrice] = useState('');
  const [gigCategory, setGigCategory] = useState(GIG_CATEGORIES[0]);
  const [gigImage, setGigImage] = useState('');
  const [gigDelivery, setGigDelivery] = useState('3 days');
  const [gigTags, setGigTags] = useState('');

  // Project form state
  const [projTitle, setProjTitle] = useState('');
  const [projDesc, setProjDesc] = useState('');
  const [projLink, setProjLink] = useState('');
  const [projSkills, setProjSkills] = useState('');
  const [projImage, setProjImage] = useState<File | null>(null);
  const [projImageUrl, setProjImageUrl] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.push('/auth/sign-in');
  }, [authLoading, user, router]);

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    const [gigsRes, projRes] = await Promise.all([
      supabase.from('gigs').select('*').eq('creator_id', user.id).order('created_at', { ascending: false }),
      supabase.from('portfolio_items').select('*').eq('creator_id', user.id).order('created_at', { ascending: false }),
    ]);
    if (gigsRes.data) setGigs(gigsRes.data as Gig[]);
    if (projRes.data) setProjects(projRes.data as PortfolioItem[]);
    setLoading(false);
  };

  const resetGigForm = () => {
    setGigTitle(''); setGigDesc(''); setGigPrice(''); setGigCategory(GIG_CATEGORIES[0]);
    setGigImage(''); setGigDelivery('3 days'); setGigTags('');
    setEditingGig(null); setShowGigForm(false);
  };

  const resetProjectForm = () => {
    setProjTitle(''); setProjDesc(''); setProjLink(''); setProjSkills('');
    setProjImage(null); setProjImageUrl(''); setEditingProject(null); setShowProjectForm(false);
  };

  const handleSaveGig = async () => {
    if (!user || !gigTitle.trim() || !gigDesc.trim() || !gigPrice) return;
    setSaving(true);
    const gigData = {
      creator_id: user.id,
      title: gigTitle.trim(),
      description: gigDesc.trim(),
      price: parseFloat(gigPrice),
      category: gigCategory.toLowerCase(),
      image_url: gigImage || null,
      delivery_time: gigDelivery,
      tags: gigTags.split(',').map((t) => t.trim()).filter(Boolean),
      is_active: true,
    };
    const { error } = editingGig
      ? await supabase.from('gigs').update(gigData).eq('id', editingGig.id)
      : await supabase.from('gigs').insert(gigData);
    if (error) {
      toast({ title: 'Failed to save gig', variant: 'destructive' });
    } else {
      toast({ title: editingGig ? 'Gig updated!' : 'Gig created!' });
      resetGigForm();
      loadData();
    }
    setSaving(false);
  };

  const handleEditGig = (gig: Gig) => {
    setEditingGig(gig);
    setGigTitle(gig.title); setGigDesc(gig.description); setGigPrice(gig.price.toString());
    setGigCategory(gig.category.charAt(0).toUpperCase() + gig.category.slice(1));
    setGigImage(gig.image_url || ''); setGigDelivery(gig.delivery_time);
    setGigTags(gig.tags?.join(', ') || '');
    setShowGigForm(true);
  };

  const handleDeleteGig = async (id: string) => {
    const { error } = await supabase.from('gigs').delete().eq('id', id);
    if (error) toast({ title: 'Failed to delete gig', variant: 'destructive' });
    else { toast({ title: 'Gig deleted' }); loadData(); }
  };

  const handleUploadProjectImage = async () => {
    if (!user || !projImage) return;
    setUploadingImage(true);
    const path = `portfolio/${user.id}/${Date.now()}-${projImage.name}`;
    const { error } = await supabase.storage.from('previews').upload(path, projImage);
    if (error) {
      toast({ title: 'Image upload failed', variant: 'destructive' });
    } else {
      const url = supabase.storage.from('previews').getPublicUrl(path).data.publicUrl;
      setProjImageUrl(url);
      toast({ title: 'Image uploaded!' });
    }
    setUploadingImage(false);
  };

  const handleSaveProject = async () => {
    if (!user || !projTitle.trim()) return;
    setSaving(true);
    const projData = {
      creator_id: user.id,
      title: projTitle.trim(),
      description: projDesc.trim(),
      image_url: projImageUrl || null,
      project_link: projLink || null,
      skills_used: projSkills.split(',').map((s) => s.trim()).filter(Boolean),
    };
    const { error } = editingProject
      ? await supabase.from('portfolio_items').update(projData).eq('id', editingProject.id)
      : await supabase.from('portfolio_items').insert(projData);
    if (error) {
      toast({ title: 'Failed to save project', variant: 'destructive' });
    } else {
      toast({ title: editingProject ? 'Project updated!' : 'Project added!' });
      resetProjectForm();
      loadData();
    }
    setSaving(false);
  };

  const handleEditProject = (proj: PortfolioItem) => {
    setEditingProject(proj);
    setProjTitle(proj.title); setProjDesc(proj.description);
    setProjLink(proj.project_link || ''); setProjSkills(proj.skills_used?.join(', ') || '');
    setProjImageUrl(proj.image_url || '');
    setShowProjectForm(true);
  };

  const handleDeleteProject = async (id: string) => {
    const { error } = await supabase.from('portfolio_items').delete().eq('id', id);
    if (error) toast({ title: 'Failed to delete project', variant: 'destructive' });
    else { toast({ title: 'Project deleted' }); loadData(); }
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
          <p className="text-lg font-medium">Only creators can manage portfolio</p>
          <p className="mt-2 text-sm text-muted-foreground">Switch to a creator account to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Portfolio & Gigs</h1>
          <p className="mt-2 text-muted-foreground">Manage your services and showcase your work</p>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex gap-1 rounded-lg border border-border/60 bg-card/40 p-1">
          <button
            onClick={() => setTab('gigs')}
            className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              tab === 'gigs' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Briefcase className="mr-2 inline h-4 w-4" /> Gigs ({gigs.length})
          </button>
          <button
            onClick={() => setTab('projects')}
            className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              tab === 'projects' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <ImageIcon className="mr-2 inline h-4 w-4" /> Projects ({projects.length})
          </button>
        </div>

        {/* GIGS TAB */}
        {tab === 'gigs' && (
          <>
            {!showGigForm && (
              <Button onClick={() => setShowGigForm(true)} className="mb-6 glow-primary">
                <Plus className="mr-2 h-4 w-4" /> Create Gig
              </Button>
            )}

            {showGigForm && (
              <Card className="glass-card mb-6">
                <CardHeader>
                  <CardTitle className="text-lg">{editingGig ? 'Edit Gig' : 'Create New Gig'}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="gig-title">Title</Label>
                    <Input id="gig-title" placeholder="I will design a modern logo..." value={gigTitle} onChange={(e) => setGigTitle(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gig-desc">Description</Label>
                    <Textarea id="gig-desc" placeholder="Describe your service in detail..." value={gigDesc} onChange={(e) => setGigDesc(e.target.value)} rows={4} />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="gig-price">Price (₹)</Label>
                      <Input id="gig-price" type="number" placeholder="500" value={gigPrice} onChange={(e) => setGigPrice(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="gig-cat">Category</Label>
                      <select id="gig-cat" value={gigCategory} onChange={(e) => setGigCategory(e.target.value)}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                        {GIG_CATEGORIES.map((cat) => (<option key={cat} value={cat}>{cat}</option>))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="gig-delivery">Delivery Time</Label>
                      <Input id="gig-delivery" placeholder="3 days" value={gigDelivery} onChange={(e) => setGigDelivery(e.target.value)} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gig-image">Cover Image URL (optional)</Label>
                    <Input id="gig-image" placeholder="https://..." value={gigImage} onChange={(e) => setGigImage(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gig-tags">Tags (comma-separated)</Label>
                    <Input id="gig-tags" placeholder="logo, branding, minimal" value={gigTags} onChange={(e) => setGigTags(e.target.value)} />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <Button onClick={handleSaveGig} disabled={saving || !gigTitle.trim() || !gigDesc.trim() || !gigPrice} className="glow-primary">
                      {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : editingGig ? 'Update Gig' : 'Create Gig'}
                    </Button>
                    <Button variant="outline" onClick={resetGigForm}>Cancel</Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {gigs.length === 0 && !showGigForm ? (
              <Card className="glass-card">
                <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                  <Star className="mb-4 h-12 w-12 text-muted-foreground/40" />
                  <p className="text-lg font-medium">No gigs yet</p>
                  <p className="text-sm text-muted-foreground">Create your first gig to start receiving orders</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {gigs.map((gig) => (
                  <Card key={gig.id} className="glass-card overflow-hidden">
                    <div className="relative h-32 overflow-hidden bg-gradient-to-br from-secondary/40 to-card">
                      {gig.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={gig.image_url} alt={gig.title} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center"><Star className="h-8 w-8 text-muted-foreground/30" /></div>
                      )}
                    </div>
                    <CardContent className="p-4">
                      <h3 className="mb-1 font-medium line-clamp-1">{gig.title}</h3>
                      <p className="mb-3 text-sm text-muted-foreground line-clamp-2">{gig.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold text-primary">₹{gig.price}</span>
                        <div className="flex gap-2">
                          <Button size="sm" variant="ghost" onClick={() => handleEditGig(gig)}><Edit3 className="h-3.5 w-3.5" /></Button>
                          <Button size="sm" variant="ghost" onClick={() => handleDeleteGig(gig.id)} className="text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}

        {/* PROJECTS TAB */}
        {tab === 'projects' && (
          <>
            {!showProjectForm && (
              <Button onClick={() => setShowProjectForm(true)} className="mb-6 glow-primary">
                <Plus className="mr-2 h-4 w-4" /> Add Project
              </Button>
            )}

            {showProjectForm && (
              <Card className="glass-card mb-6">
                <CardHeader>
                  <CardTitle className="text-lg">{editingProject ? 'Edit Project' : 'Add Portfolio Project'}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="proj-title">Title</Label>
                    <Input id="proj-title" placeholder="E-commerce Website Redesign" value={projTitle} onChange={(e) => setProjTitle(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="proj-desc">Description</Label>
                    <Textarea id="proj-desc" placeholder="Describe the project..." value={projDesc} onChange={(e) => setProjDesc(e.target.value)} rows={3} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="proj-link">Project Link (optional)</Label>
                    <Input id="proj-link" placeholder="https://..." value={projLink} onChange={(e) => setProjLink(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="proj-skills">Skills Used (comma-separated)</Label>
                    <Input id="proj-skills" placeholder="React, Figma, Tailwind" value={projSkills} onChange={(e) => setProjSkills(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="proj-image">Project Image</Label>
                    <div className="flex gap-2">
                      <Input id="proj-image" type="file" accept="image/*" onChange={(e) => setProjImage(e.target.files?.[0] || null)} className="flex-1" />
                      <Button onClick={handleUploadProjectImage} disabled={!projImage || uploadingImage} variant="outline">
                        {uploadingImage ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Upload'}
                      </Button>
                    </div>
                    {projImageUrl && (
                      <div className="mt-2 overflow-hidden rounded-lg border border-border/60">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={projImageUrl} alt="Preview" className="h-32 w-full object-cover" />
                      </div>
                    )}
                  </div>
                  <div className="flex gap-3 pt-2">
                    <Button onClick={handleSaveProject} disabled={saving || !projTitle.trim()} className="glow-primary">
                      {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : editingProject ? 'Update Project' : 'Add Project'}
                    </Button>
                    <Button variant="outline" onClick={resetProjectForm}>Cancel</Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {projects.length === 0 && !showProjectForm ? (
              <Card className="glass-card">
                <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                  <ImageIcon className="mb-4 h-12 w-12 text-muted-foreground/40" />
                  <p className="text-lg font-medium">No projects yet</p>
                  <p className="text-sm text-muted-foreground">Showcase your past work to attract more hirers</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {projects.map((proj) => (
                  <Card key={proj.id} className="glass-card overflow-hidden">
                    <div className="relative h-40 overflow-hidden bg-gradient-to-br from-secondary/40 to-card">
                      {proj.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={proj.image_url} alt={proj.title} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center"><ImageIcon className="h-8 w-8 text-muted-foreground/30" /></div>
                      )}
                    </div>
                    <CardContent className="p-4">
                      <h3 className="mb-1 font-medium line-clamp-1">{proj.title}</h3>
                      <p className="mb-2 text-sm text-muted-foreground line-clamp-2">{proj.description}</p>
                      {proj.skills_used && proj.skills_used.length > 0 && (
                        <div className="mb-3 flex flex-wrap gap-1">
                          {proj.skills_used.slice(0, 3).map((s) => (
                            <span key={s} className="rounded-md border border-border/60 bg-card/40 px-1.5 py-0.5 text-xs">{s}</span>
                          ))}
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <div className="flex gap-1">
                          {proj.project_link && (
                            <a href={proj.project_link} target="_blank" rel="noopener noreferrer">
                              <Button size="sm" variant="ghost"><ExternalLink className="h-3.5 w-3.5" /></Button>
                            </a>
                          )}
                          <Button size="sm" variant="ghost" onClick={() => handleEditProject(proj)}><Edit3 className="h-3.5 w-3.5" /></Button>
                          <Button size="sm" variant="ghost" onClick={() => handleDeleteProject(proj.id)} className="text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <Footer />
    </div>
  );
}
