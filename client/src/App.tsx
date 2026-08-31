import React, { useEffect, Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore.js';
import { useThemeStore, applyTheme } from './stores/themeStore.js';
import { DashboardLayout } from './components/layout/DashboardLayout.js';
import { LoadingSpinner } from './components/shared/LoadingSpinner.js';

// Lazy-loaded pages for fast initial bundle and instant mobile loads
const LoginPage = lazy(() => import('./pages/LoginPage.js').then((m) => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('./pages/RegisterPage.js').then((m) => ({ default: m.RegisterPage })));
const FeedPage = lazy(() => import('./pages/FeedPage.js').then((m) => ({ default: m.FeedPage })));
const ExplorePage = lazy(() => import('./pages/ExplorePage.js').then((m) => ({ default: m.ExplorePage })));
const ProfilePage = lazy(() => import('./pages/ProfilePage.js').then((m) => ({ default: m.ProfilePage })));
const MessagesPage = lazy(() => import('./pages/MessagesPage.js').then((m) => ({ default: m.MessagesPage })));
const StoriesPage = lazy(() => import('./pages/StoriesPage.js').then((m) => ({ default: m.StoriesPage })));
const GroupsPage = lazy(() => import('./pages/GroupsPage.js').then((m) => ({ default: m.GroupsPage })));
const GroupDetailPage = lazy(() => import('./pages/GroupDetailPage.js').then((m) => ({ default: m.GroupDetailPage })));
const CallsPage = lazy(() => import('./pages/CallsPage.js').then((m) => ({ default: m.CallsPage })));
const NotificationsPage = lazy(() => import('./pages/NotificationsPage.js').then((m) => ({ default: m.NotificationsPage })));
const SearchPage = lazy(() => import('./pages/SearchPage.js').then((m) => ({ default: m.SearchPage })));
const SettingsPage = lazy(() => import('./pages/SettingsPage.js').then((m) => ({ default: m.SettingsPage })));

const PageLoader = () => (
  <div className="flex items-center justify-center p-12 min-h-[50vh]">
    <LoadingSpinner size="md" />
  </div>
);

// Protected Route Guard
const ProtectedRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { user, accessToken, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#171A1C]">
        <LoadingSpinner size="lg" label="Entering Orbit..." />
      </div>
    );
  }

  if (!accessToken || !user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Public Route Guard (Redirects to / if logged in)
const PublicRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { user, accessToken, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#171A1C]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (accessToken && user) {
    return <Navigate to="/" replace />;
  }

  return children;
};


export const App: React.FC = () => {
  const { initializeAuth } = useAuthStore();
  const { theme } = useThemeStore();

  useEffect(() => {
    initializeAuth();
    applyTheme(theme);
  }, [initializeAuth, theme]);

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public Auth Routes */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicRoute>
              <RegisterPage />
            </PublicRoute>
          }
        />

        {/* Protected Dashboard Routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<FeedPage />} />
          <Route path="explore" element={<ExplorePage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="profile/:id" element={<ProfilePage />} />
          <Route path="messages" element={<MessagesPage />} />
          <Route path="stories" element={<StoriesPage />} />
          <Route path="groups" element={<GroupsPage />} />
          <Route path="groups/:id" element={<GroupDetailPage />} />
          <Route path="calls" element={<CallsPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="search" element={<SearchPage />} />
          <Route path="settings" element={<SettingsPage />} />
          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </Suspense>
  );
};
