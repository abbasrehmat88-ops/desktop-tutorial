import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Tenants from './pages/Tenants';
import Financial from './pages/Financial';
import Reminders from './pages/Reminders';
import Properties from './pages/Properties';
import ImportData from './pages/ImportData';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/tenants" element={<Tenants />} />
              <Route path="/financial" element={<Financial />} />
              <Route path="/reminders" element={<Reminders />} />
              <Route path="/properties" element={<Properties />} />
              <Route path="/import-data" element={<ImportData />} />
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
