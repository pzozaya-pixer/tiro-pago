import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './components/AppShell';
import { Dashboard } from './pages/Dashboard';
import { History } from './pages/History';
import { NewRound } from './pages/NewRound';
import { NewSession } from './pages/NewSession';
import { Sessions } from './pages/Sessions';

export default function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/nueva-tanda" element={<NewRound />} />
        <Route path="/nueva-sesion" element={<NewSession />} />
        <Route path="/sesiones" element={<Sessions />} />
        <Route path="/historial" element={<History />} />
        <Route path="/armas" element={<Sessions mode="weapons" />} />
        <Route path="/ajustes" element={<Sessions mode="settings" />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppShell>
  );
}
