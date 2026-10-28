import { useEffect, type ReactNode } from 'react'
import { I18nextProvider } from 'react-i18next'
import { Provider } from 'react-redux'
import { Toaster } from 'sonner'

import { TooltipProvider } from '@/components/ui/misc'
import i18n from '@/i18n'
import { store, useAppSelector, type AppStore } from '@/store'
import { selectLocale, selectTheme } from '@/store/uiSlice'

/** Keeps <html lang/data-theme> and i18next in sync with the store on first render. */
function DocumentSync() {
  const locale = useAppSelector(selectLocale)
  const theme = useAppSelector(selectTheme)
  useEffect(() => {
    document.documentElement.lang = locale
    if (i18n.language !== locale) void i18n.changeLanguage(locale)
  }, [locale])
  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])
  return null
}

function ThemedToaster() {
  const theme = useAppSelector(selectTheme)
  return (
    <Toaster
      theme={theme}
      position="bottom-right"
      toastOptions={{ classNames: { toast: '!rounded-2xl !border-border/70 !bg-popover/95 !backdrop-blur-xl !text-foreground' } }}
    />
  )
}

export function Providers({ children, appStore = store }: { children: ReactNode; appStore?: AppStore }) {
  return (
    <Provider store={appStore}>
      <I18nextProvider i18n={i18n}>
        <TooltipProvider>
          <DocumentSync />
          {children}
          <ThemedToaster />
        </TooltipProvider>
      </I18nextProvider>
    </Provider>
  )
}
