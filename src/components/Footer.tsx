import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-zinc-50 dark:bg-zinc-900/50 border-t border-zinc-200 dark:border-zinc-800 mt-20 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2 space-y-4">
            <Link href="/" className="font-extrabold text-xl tracking-tight text-zinc-900 dark:text-white flex items-center gap-2">
              <span className="bg-emerald-600 text-white px-2 py-0.5 rounded text-base font-black">F</span>
              <span>Fabelo</span>
            </Link>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 max-w-sm">
              Personal finance tips, career strategies, and AI tool reviews for ambitious professionals.
            </p>
            <div className="pt-2 text-xs text-zinc-500">
              Built with Next.js 15 & Payload CMS v3 · Ultra-fast ISR & AEO Ready
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-white mb-3">
              Categories
            </h4>
            <ul className="space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
              <li><Link href="/tag/personal-finance" className="hover:text-emerald-600">Personal Finance</Link></li>
              <li><Link href="/tag/career" className="hover:text-emerald-600">Career</Link></li>
              <li><Link href="/tag/ai-tech" className="hover:text-emerald-600">AI & Tech</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-white mb-3">
              Legal & Info
            </h4>
            <ul className="space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
              <li><Link href="/about" className="hover:text-emerald-600">About</Link></li>
              <li><Link href="/advertise" className="hover:text-emerald-600">Advertise</Link></li>
              <li><Link href="/sponsor" className="hover:text-emerald-600">Sponsor</Link></li>
              <li><Link href="/terms-and-conditions" className="hover:text-emerald-600">Terms & Conditions</Link></li>
              <li><Link href="/data-and-privacy" className="hover:text-emerald-600">Data & Privacy</Link></li>
              <li><a href="/sitemap.xml" className="hover:text-emerald-600">Sitemap XML</a></li>
              <li><a href="/llms.txt" className="hover:text-emerald-600">LLMS.txt (AEO)</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-zinc-200 dark:border-zinc-800 mt-8 pt-6 flex flex-col sm:flex-row justify-between items-center text-xs text-zinc-500">
          <p>© {new Date().getFullYear()} Fabelo. All rights reserved.</p>
          <p className="mt-2 sm:mt-0">Powered by Panicworkz & WpCare</p>
        </div>
      </div>
    </footer>
  );
}
