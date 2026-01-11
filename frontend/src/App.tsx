import { Outlet, NavLink } from 'react-router-dom';
import { BrainCircuit } from 'lucide-react';
import { ThemeToggle } from './components/ThemeToggle';
import './index.css';

function App() {
  return (
    <div className="min-h-screen bg-[var(--bg-page)] text-[var(--text-primary)] transition-colors duration-300">
      <header className="border-b border-[var(--border-line)] bg-[var(--bg-card)] sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2 tracking-tight">
              <BrainCircuit className="w-4 h-4 text-emerald-600" />
              <span>Reverse Turing</span>
            </div>

            <nav className="flex gap-1">
              <NavLink
                to="/"
                className={({ isActive }) => `px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${isActive
                  ? 'bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100'
                  : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:text-zinc-200 dark:hover:bg-zinc-800/50'
                  }`}
              >
                New Experiment
              </NavLink>
              <NavLink
                to="/history"
                className={({ isActive }) => `px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${isActive
                  ? 'bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100'
                  : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:text-zinc-200 dark:hover:bg-zinc-800/50'
                  }`}
              >
                History
              </NavLink>
            </nav>
          </div>

          <ThemeToggle />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 pt-8">
        <Outlet />
      </main>
    </div>
  );
}

export default App;
