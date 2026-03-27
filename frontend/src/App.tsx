import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import MainApp from './pages/MainApp';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import HistoryPage from './pages/HistoryPage';
import ProtectedRoute from './components/ProtectedRoute';
import { ROUTES } from './utils/constants';

export default function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="bottom-center"
        toastOptions={{
          style: {
            background: 'var(--surface)',
            color: 'var(--text)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            fontSize: '13px',
            padding: '10px 14px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          },
          success: { iconTheme: { primary: 'var(--accent)', secondary: '#fff' } },
          duration: 2500,
        }}
      />
      <Routes>
        <Route path={ROUTES.HOME} element={<MainApp />} />
        <Route path={ROUTES.SIGNIN} element={<SignIn />} />
        <Route path={ROUTES.SIGNUP} element={<SignUp />} />
        <Route
          path={ROUTES.HISTORY}
          element={
            <ProtectedRoute>
              <HistoryPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to={ROUTES.HOME} replace />} />
      </Routes>
    </BrowserRouter>
  );
}
