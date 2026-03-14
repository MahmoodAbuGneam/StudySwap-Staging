import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import AdminRoute from './components/AdminRoute'
import AppLayout from './components/AppLayout'

import Home      from './pages/Home'
import Login     from './pages/Login'
import Register  from './pages/Register'
import Dashboard from './pages/Dashboard'
import ProfileMe from './pages/ProfileMe'
import ProfileView from './pages/ProfileView'
import Browse    from './pages/Browse'
import Matches   from './pages/Matches'
import Swaps     from './pages/Swaps'
import Favorites from './pages/Favorites'
import AdminUsers      from './pages/admin/AdminUsers'
import AdminCategories from './pages/admin/AdminCategories'
import AdminSwaps      from './pages/admin/AdminSwaps'
import AdminRatings    from './pages/admin/AdminRatings'

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* ── Public standalone pages (no sidebar) ── */}
        <Route path="/"         element={<Home />}     />
        <Route path="/login"    element={<Login />}    />
        <Route path="/register" element={<Register />} />

        {/* ── App layout (sidebar) ─────────────────── */}
        <Route element={<AppLayout />}>
          <Route
            path="/dashboard"
            element={<ProtectedRoute><Dashboard /></ProtectedRoute>}
          />
          <Route
            path="/profile/me"
            element={<ProtectedRoute><ProfileMe /></ProtectedRoute>}
          />
          <Route path="/profile/:id" element={<ProfileView />} />
          <Route path="/browse"      element={<Browse />}      />
          <Route
            path="/matches"
            element={<ProtectedRoute><Matches /></ProtectedRoute>}
          />
          <Route
            path="/swaps"
            element={<ProtectedRoute><Swaps /></ProtectedRoute>}
          />
          <Route
            path="/favorites"
            element={<ProtectedRoute><Favorites /></ProtectedRoute>}
          />

          {/* ── Admin routes ─────────────────────────── */}
          <Route path="/admin/users"      element={<AdminRoute><AdminUsers /></AdminRoute>} />
          <Route path="/admin/categories" element={<AdminRoute><AdminCategories /></AdminRoute>} />
          <Route path="/admin/swaps"      element={<AdminRoute><AdminSwaps /></AdminRoute>} />
          <Route path="/admin/ratings"    element={<AdminRoute><AdminRatings /></AdminRoute>} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  )
}
