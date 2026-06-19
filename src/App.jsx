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
import ResetData from './pages/ResetData';
import Deposits from './pages/Deposits';
import Owners from './pages/Owners';
import CashFlow from './pages/CashFlow';
import Dues from './pages/Dues';
import PropertyFinder from './pages/PropertyFinder';

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
              <Route path="/deposits" element={<Deposits />} />
              <Route path="/owners" element={<Owners />} />
              <Route path="/cashflow" element={<CashFlow />} />
              <Route path="/dues" element={<Dues />} />
              <Route path="/property-finder" element={<PropertyFinder />} />
              <Route path="/import-data" element={<ImportData />} />
              <Route path="/reset-data" element={<ResetData />} />
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
