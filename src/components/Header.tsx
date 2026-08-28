import Link from 'next/link';
import ThemeToggle from './ThemeToggle';

export default function Header() {
  return (
    <header className="sticky top-0 z-50 bg-white/90 dark:bg-zinc-950/90 backdrop-blur border-b border-zinc-200 dark:border-zinc-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="font-extrabold text-2xl tracking-tight text-zinc-900 dark:text-white flex items-center gap-2">
            <span className="bg-emerald-600 text-white px-2 py-0.5 rounded text-lg font-black">F</span>
            <span>Fabelo</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-zinc-600 dark:text-zinc-300">
            <Link href="/tag/personal-finance" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition">
              Personal Finance
            </Link>
            <Link href="/tag/career" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition">
              Career
            </Link>
            <Link href="/tag/ai-tech" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition">
              AI & Tech
            </Link>
            <Link href="/about" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition">
              About
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link
            href="/admin"
            className="hidden sm:inline-flex text-xs font-semibold px-3 py-1.5 rounded-md bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 transition"
          >
            Payload Admin
          </Link>
          <a
            href="#newsletter"
            className="text-xs font-semibold px-3.5 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white transition shadow-sm"
          >
            Subscribe
          </a>
        </div>
      </div>
    </header>
  );
}
