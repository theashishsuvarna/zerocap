'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Shield, LayoutDashboard, LogOut, User, Briefcase, Upload, ClipboardList } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function Navbar() {
  const { user, profile, signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-400 to-teal-600 glow-sm transition-all group-hover:glow-primary">
            <Shield className="h-5 w-5 text-background" strokeWidth={2.5} />
          </div>
          <span className="text-lg font-bold tracking-tight">
            Zero<span className="text-gradient-primary">Cap</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          <Link href="/gig">
            <Button variant="ghost" size="sm">Browse Gigs</Button>
          </Link>
          <Link href="/post-job">
            <Button variant="ghost" size="sm">Post a Job</Button>
          </Link>
          <Link href="/about">
            <Button variant="ghost" size="sm">About</Button>
          </Link>
          {user && (
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">Dashboard</Button>
            </Link>
          )}
          {user && (
            <Link href="/dashboard/orders">
              <Button variant="ghost" size="sm">Orders</Button>
            </Link>
          )}
          {user && profile?.role === 'creator' && (
            <Link href="/upload">
              <Button variant="ghost" size="sm">Upload</Button>
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-3">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-lg border border-border/60 bg-card/40 px-2.5 py-1.5 transition-colors hover:bg-card/80">
                  <Avatar className="h-7 w-7">
                    <AvatarFallback className="bg-primary/20 text-primary text-xs font-semibold">
                      {profile?.full_name?.charAt(0)?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden text-sm font-medium sm:inline">
                    {profile?.full_name || 'User'}
                  </span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">{profile?.full_name}</p>
                  <p className="truncate text-xs text-muted-foreground">{profile?.email}</p>
                  <span className="mt-1 inline-block rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary capitalize">
                    {profile?.role}
                  </span>
                </div>
                <DropdownMenuSeparator />
                <Link href="/dashboard">
                  <DropdownMenuItem>
                    <LayoutDashboard className="mr-2 h-4 w-4" /> Dashboard
                  </DropdownMenuItem>
                </Link>
                <Link href="/dashboard/orders">
                  <DropdownMenuItem>
                    <ClipboardList className="mr-2 h-4 w-4" /> Orders
                  </DropdownMenuItem>
                </Link>
                <Link href="/about">
                  <DropdownMenuItem>
                    <Shield className="mr-2 h-4 w-4" /> About
                  </DropdownMenuItem>
                </Link>
                <Link href="/profile">
                  <DropdownMenuItem>
                    <User className="mr-2 h-4 w-4" /> Profile
                  </DropdownMenuItem>
                </Link>
                {profile?.role === 'creator' && (
                  <>
                    <Link href="/portfolio">
                      <DropdownMenuItem>
                        <Briefcase className="mr-2 h-4 w-4" /> Portfolio
                      </DropdownMenuItem>
                    </Link>
                    <Link href="/upload">
                      <DropdownMenuItem>
                        <Upload className="mr-2 h-4 w-4" /> Upload Deliverable
                      </DropdownMenuItem>
                    </Link>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" /> Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/auth/sign-in">
                <Button variant="ghost" size="sm">Sign In</Button>
              </Link>
              <Link href="/auth/sign-up">
                <Button size="sm">Get Started</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
