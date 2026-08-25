'use client';

import { useEffect, useState } from 'react';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Search, Loader2, Star, Clock } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import type { Gig } from '@/lib/types';
import { GIG_CATEGORIES } from '@/lib/types';
import Link from 'next/link';

export default function GigPage() {
  const [gigs, setGigs] = useState<Gig[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string>('all');

  useEffect(() => {
    loadGigs();
  }, [search, category]);

  const loadGigs = async () => {
    setLoading(true);
    let query = supabase
      .from('gigs')
      .select('*, creator:profiles!gigs_creator_id_fkey(*)')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (category !== 'all') {
      query = query.eq('category', category.toLowerCase());
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }

    const { data, error } = await query;
    if (!error && data) {
      setGigs(data as Gig[]);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Browse Gigs</h1>
          <p className="mt-2 text-muted-foreground">Discover services from verified creators</p>
        </div>

        {/* Search */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search gigs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Category filter */}
        <div className="mb-8 flex flex-wrap gap-2">
          <button
            onClick={() => setCategory('all')}
            className={`rounded-full border px-3.5 py-1.5 text-sm transition-colors ${
              category === 'all'
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border bg-card/40 text-muted-foreground hover:text-foreground'
            }`}
          >
            All
          </button>
          {GIG_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`rounded-full border px-3.5 py-1.5 text-sm transition-colors ${
                category === cat
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border bg-card/40 text-muted-foreground hover:text-foreground'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : gigs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Search className="mb-4 h-12 w-12 text-muted-foreground/50" />
            <p className="text-lg font-medium">No gigs found</p>
            <p className="text-sm text-muted-foreground">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {gigs.map((gig) => (
              <Link key={gig.id} href={`/gig/${gig.id}`}>
                <Card className="glass-card group h-full overflow-hidden transition-all hover:glow-sm hover:border-primary/30">
                  <div className="relative h-40 overflow-hidden bg-gradient-to-br from-secondary/40 to-card">
                    {gig.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={gig.image_url}
                        alt={gig.title}
                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <Star className="h-10 w-10 text-muted-foreground/30" />
                      </div>
                    )}
                    <div className="absolute right-3 top-3 rounded-md bg-background/80 px-2 py-1 text-xs font-medium capitalize backdrop-blur-sm">
                      {gig.category}
                    </div>
                  </div>
                  <CardContent className="p-5">
                    <h3 className="mb-1 font-semibold leading-tight line-clamp-1">{gig.title}</h3>
                    <p className="mb-3 text-sm text-muted-foreground line-clamp-2">{gig.description}</p>
                    <div className="mb-3 flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" />
                      {gig.delivery_time}
                    </div>
                    <div className="flex items-center justify-between border-t border-border/40 pt-3">
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary">
                          {gig.creator?.full_name?.charAt(0)?.toUpperCase() || 'C'}
                        </div>
                        <span className="text-xs text-muted-foreground">{gig.creator?.full_name}</span>
                      </div>
                      <span className="text-lg font-bold text-primary">₹{gig.price}</span>
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
