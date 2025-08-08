
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import Layout from '@/components/Layout';
import Dashboard from '@/pages/Dashboard';
import CompanyOKRs from '@/pages/CompanyOKRs';
import DepartmentOKRs from '@/pages/DepartmentOKRs';
import CheckIn from '@/pages/CheckIn';
import OrgChart from '@/pages/OrgChart';
import AdminPanel from '@/pages/AdminPanel';
import ExcelUpload from '@/pages/ExcelUpload';
import AIAnalysis from '@/pages/AIAnalysis';
import Login from '@/pages/Login';
import { AppContextProvider } from '@/context/AppContext';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Toaster } from '@/components/ui/toaster';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Yükleniyor...</div>; // Veya daha şık bir yükleme ekranı bileşeni
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function App() {
  return (
    <>
      <Helmet>
        <title>OKR-AI - DeFacto Yapay Zeka Destekli OKR Takip Sistemi</title>
        <meta name="description" content="DeFacto için yapay zeka destekli OKR takip ve yönetim sistemi. Hedeflerinizi belirleyin, KR'larınızı oluşturun ve başarınızı ölçün." />
      </Helmet>
      <AppContextProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Routes>
                      <Route path="/" element={<Dashboard />} />
                      <Route path="/company-okrs" element={<CompanyOKRs />} />
                      <Route path="/department-okrs" element={<DepartmentOKRs />} />
                      <Route path="/check-in" element={<CheckIn />} />
                      <Route path="/org-chart" element={<OrgChart />} />
                      <Route path="/admin" element={<AdminPanel />} />
                      <Route path="/excel" element={<ExcelUpload />} />
                      <Route path="/ai-analysis" element={<AIAnalysis />} />
                    </Routes>
                  </Layout>
                </ProtectedRoute>
              }
            />
          </Routes>
        </Router>
      </AppContextProvider>
    </>
  );
}

export default App;
