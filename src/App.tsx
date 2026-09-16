import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { ToastProvider } from './components/Toast'
import { StoreProvider, useStore } from './lib/store'
import { Admin } from './pages/admin/Admin'
import { Landing } from './pages/Landing'
import { VendorShell } from './pages/vendor/VendorShell'

function ErrorBanner() {
  const { error } = useStore()
  if (!error) return null
  return (
    <div className="mx-auto mb-2 max-w-[560px] px-4 pt-3">
      <p className="rounded-[var(--radius-sm)] bg-warn-soft px-4 py-3 text-[13px] leading-relaxed text-warn">
        データの読み込みに問題が起きました：{error}
      </p>
    </div>
  )
}

export default function App() {
  return (
    <HashRouter>
      <ToastProvider>
        <StoreProvider>
          <ErrorBanner />
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/vendor" element={<VendorShell />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </StoreProvider>
      </ToastProvider>
    </HashRouter>
  )
}
