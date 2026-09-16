import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './styles.css'

// 保存されたテーマ設定を、最初の描画前に反映する。
const theme = localStorage.getItem('mk.theme')
if (theme === 'light' || theme === 'dark') {
  document.documentElement.setAttribute('data-theme', theme)
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
