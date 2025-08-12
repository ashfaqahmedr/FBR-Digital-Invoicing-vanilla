import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { HeroUIProvider } from '@heroui/react'
import { InvoiceProvider } from './context/InvoiceContext'
import { ReferenceProvider } from './context/ReferenceContext'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HeroUIProvider>
      <InvoiceProvider>
        <ReferenceProvider>
          <App />
        </ReferenceProvider>
      </InvoiceProvider>
    </HeroUIProvider>
  </React.StrictMode>,
)