import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import { ExperimentPage } from './pages/ExperimentPage';
import { StatsView } from './components/StatsView';
import { Activity, BarChart2 } from 'lucide-react';
import './index.css';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen">
        <div className="max-w-2xl mx-auto px-6">
          {/* Header & Nav */}
          <header className="py-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <Activity className="w-5 h-5" />
                <span className="font-semibold text-zinc-900 tracking-tight">Reverse Turing</span>
              </div>
              <p className="text-zinc-500 text-sm">
                AI vs AI Deception Experiment
              </p>
            </div>

            <div className="flex bg-zinc-100 p-1 rounded-lg self-start md:self-auto">
              <NavLink
                to="/"
                className={({ isActive }) => `flex items-center gap-2 px-4 py-1.5 text-xs font-medium rounded-md transition-all ${isActive
                  ? 'bg-white text-zinc-900 shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-700'
                  }`}
              >
                <Activity className="w-3.5 h-3.5" />
                Experiment
              </NavLink>
              <NavLink
                to="/results"
                className={({ isActive }) => `flex items-center gap-2 px-4 py-1.5 text-xs font-medium rounded-md transition-all ${isActive
                  ? 'bg-white text-zinc-900 shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-700'
                  }`}
              >
                <BarChart2 className="w-3.5 h-3.5" />
                Results
              </NavLink>
            </div>
          </header>

          <main>
            <Routes>
              <Route path="/" element={<ExperimentPage />} />
              <Route path="/results" element={<StatsView />} />
            </Routes>
          </main>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;
