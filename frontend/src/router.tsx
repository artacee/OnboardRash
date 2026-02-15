// ============================================================
// OnboardRash — Router Configuration
// ============================================================

import { createBrowserRouter } from 'react-router-dom'
import { Landing } from '@/pages/Landing'
import { Login } from '@/pages/Login'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Dashboard } from '@/pages/Dashboard'
import { Events } from '@/pages/Events'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Landing />,
  },
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/dashboard',
    element: <DashboardLayout />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: 'events', element: <Events /> },
    ],
  },
])
