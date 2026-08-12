import { Routes, Route, Navigate } from 'react-router-dom'
import { NavMenu } from '@shopify/app-bridge-react'
import { Dashboard } from './pages/Dashboard'
import { Rituals } from './pages/Rituals'
import { RitualForm } from './pages/Rituals/RitualForm'
import { Activity } from './pages/Activity'
import { Settings } from './pages/Settings'

export function AppRoutes() {
  return (
    <>
      <NavMenu>
        <a href="/" rel="home">
          Dashboard
        </a>
        <a href="/rituals">Routines</a>
        <a href="/activity">Activity</a>
        <a href="/settings">Settings</a>
      </NavMenu>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/rituals" element={<Rituals />} />
        <Route path="/rituals/new" element={<RitualForm />} />
        <Route path="/rituals/:id/edit" element={<RitualForm />} />
        <Route path="/activity" element={<Activity />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}
