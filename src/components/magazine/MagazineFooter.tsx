'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Mail, Check, ArrowRight, Sparkles, Globe } from 'lucide-react';
import { toast } from 'sonner';

export function MagazineFooter() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      toast.error('Please enter a valid email address.');
      return;
    }
    setSubscribed(true);
    toast.success('Thank you for subscribing to Fabelo VIP Dispatch!');
  };

  return (
    <footer className="border-t border-border/80 bg-card/60 text-foreground transition-colors duration-200 mt-28">
      {/* Top Magazine Newsletter Banner (1920px container) */}
      <div className="border-b border-border/60 bg-gradient-to-b from-primary/5 via-transparent to-transparent py-16">
        <div className="max-w-[1920px] mx-auto px-6 lg:px-12">
          <div className="max-w-[1536px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-7 space-y-3">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-mono font-bold">
                <Sparkles className="size-3.5" />
                <span>The Fabelo VIP Dispatch</span>
              </div>
              <h3 className="text-3xl sm:text-4xl font-extrabold font-serif tracking-tight text-foreground">
                Get the highest-leverage AI tools and finance playbooks every week.
              </h3>
              <p className="text-muted-foreground text-sm sm:text-base max-w-xl leading-relaxed">
                Join 18,000+ ambitious professionals, founders, and engineers. Zero fluff, 100% actionable guides.
              </p>
            </div>

            <div className="lg:col-span-5">
              {subscribed ? (
                <div className="p-5 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center gap-3 shadow-sm">
                  <Check className="size-5 shrink-0" />
                  <span className="text-sm font-semibold">You’re on the VIP list! Check your inbox for your first curated dispatch.</span>
                </div>
              ) : (
                <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3 max-w-md lg:ml-auto">
                  <div className="relative flex-1">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email..."
                      required
                      className="w-full h-12 pl-11 pr-4 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/40 transition shadow-xs"
                    />
                  </div>
                  <button
                    type="submit"
                    className="h-12 px-7 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition flex items-center justify-center gap-2 cursor-pointer shadow-md active:scale-98"
                  >
                    <span>Subscribe</span>
                    <ArrowRight className="size-4" />
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links (1920px container with 1536px inner layout) */}
      <div className="max-w-[1920px] mx-auto px-6 lg:px-12 py-16">
        <div className="max-w-[1536px] mx-auto grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-10 lg:gap-16">
          {/* Brand Col */}
          <div className="col-span-2 space-y-4">
            <Link href="/" className="inline-block">
              <img
                src="/images/fabelo-logo.webp"
                alt="Fabelo"
                className="h-9 w-auto object-contain"
              />
            </Link>
            <p className="text-muted-foreground text-sm max-w-md leading-relaxed">
              Fabelo is a modern editorial publication covering AI productivity workflows, personal finance growth, and high-income career engineering.
            </p>
            <div className="flex items-center gap-4 text-xs font-mono text-muted-foreground pt-2">
              <span className="flex items-center gap-1.5 font-semibold">
                <Globe className="size-3.5 text-emerald-500" />
                <span>Global Editorial</span>
              </span>
              <span>•</span>
              <span>100% Independent</span>
            </div>
          </div>

          {/* Topics Col */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono uppercase tracking-widest text-primary font-bold">Editorial Topics</h4>
            <ul className="space-y-2.5 text-sm text-muted-foreground font-medium">
              <li><Link href="/tag/ai-tech" className="hover:text-foreground transition">AI &amp; Tech Systems</Link></li>
              <li><Link href="/tag/personal-finance" className="hover:text-foreground transition">Personal Finance</Link></li>
              <li><Link href="/tag/career" className="hover:text-foreground transition">Career Acceleration</Link></li>
              <li><Link href="/store" className="hover:text-foreground transition">Digital Store &amp; Tools</Link></li>
            </ul>
          </div>

          {/* Company Col */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono uppercase tracking-widest text-primary font-bold">Company</h4>
            <ul className="space-y-2.5 text-sm text-muted-foreground font-medium">
              <li><Link href="/about" className="hover:text-foreground transition">About Fabelo</Link></li>
              <li><Link href="/advertise" className="hover:text-foreground transition">Advertise &amp; Media Kit</Link></li>
              <li><Link href="/sponsor" className="hover:text-foreground transition">Sponsor a Guide</Link></li>
              <li><Link href="/panic" className="hover:text-foreground transition">Panic Studio CMS</Link></li>
            </ul>
          </div>

          {/* Legal / AI View Col */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono uppercase tracking-widest text-primary font-bold">Intelligence &amp; Legal</h4>
            <ul className="space-y-2.5 text-sm text-muted-foreground font-medium">
              <li><Link href="/llms.txt" className="hover:text-foreground transition flex items-center gap-1.5"><Sparkles className="size-3 text-primary" /><span>llms.txt (AEO)</span></Link></li>
              <li><Link href="/sitemap.xml" className="hover:text-foreground transition">XML Sitemap</Link></li>
              <li><Link href="/terms-and-conditions" className="hover:text-foreground transition">Terms of Service</Link></li>
              <li><Link href="/data-and-privacy" className="hover:text-foreground transition">Privacy Policy</Link></li>
            </ul>
          </div>
        </div>

        {/* Copyright Bottom Bar */}
        <div className="max-w-[1536px] mx-auto border-t border-border/60 mt-14 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground font-medium">
          <p>© {new Date().getFullYear()} Fabelo. Engineered on Panic CMS. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link href="/" className="hover:text-foreground transition">Home</Link>
            <Link href="/store" className="hover:text-foreground transition">Store</Link>
            <Link href="/panic" className="text-primary hover:underline font-bold">Panic CMS</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
