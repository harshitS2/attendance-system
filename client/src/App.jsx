import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Admin from './pages/Admin';
import ShiftManagement from './pages/ShiftManagement';
import Team from './pages/Team';
import Profile from './pages/Profile';
import History from './pages/History';
import ProtectedRoute from './components/ProtectedRoute';

function AppContent() {
  const location = useLocation();
  const hideNavbar = ['/dashboard', '/team', '/profile', '/history'].includes(location.pathname);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {!hideNavbar && <Navbar />}
      <main className="flex-grow">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
             path="/team" 
             element={
               <ProtectedRoute>
                 <Team />
               </ProtectedRoute>
             } 
           />
           <Route 
             path="/profile" 
             element={
               <ProtectedRoute>
                 <Profile />
               </ProtectedRoute>
             } 
           />
           {/* History can reuse Dashboard for now or be a separate page, mapping /history to Dashboard for simplicity as user requested "History... pages" */}
           <Route 
             path="/history" 
             element={
               <ProtectedRoute>
                 <History />
               </ProtectedRoute>
             } 
           />
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute roles={['Admin', 'SuperAdmin']}>
                <Admin />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/shifts" 
            element={
              <ProtectedRoute roles={['TeamLead', 'Admin', 'SuperAdmin']}>
                <ShiftManagement />
              </ProtectedRoute>
            } 
          />
          <Route path="/" element={<Navigate to="/dashboard" />} />
          {/* Fallback for unknown routes */}
           <Route path="*" element={<Navigate to="/dashboard" />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;
