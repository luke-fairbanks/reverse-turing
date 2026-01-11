import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { ExperimentPage } from './pages/ExperimentPage'
import { StatsView } from './components/StatsView'

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<App />}>
                    <Route index element={<ExperimentPage />} />
                    <Route path="history" element={<StatsView />} />
                </Route>
            </Routes>
        </BrowserRouter>
    </StrictMode>,
)
