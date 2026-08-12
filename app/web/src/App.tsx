import { BrowserRouter } from 'react-router-dom'
import { AppProvider } from '@shopify/polaris'
import '@shopify/polaris/build/esm/styles.css'
import enTranslations from '@shopify/polaris/locales/en.json'
import { AppRoutes } from './routes'

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider i18n={enTranslations}>
        <AppRoutes />
      </AppProvider>
    </BrowserRouter>
  )
}
