import { MenuIcon, SearchIcon } from 'lucide-react'
import { Suspense } from 'react'
import { Outlet, useLocation } from 'react-router'
import { useTranslation } from 'react-i18next'

import { Logo } from '@/components/kit'
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/misc'
import { GlobalDialogs } from '@/features/dialogs/GlobalDialogs'
import { useAppDispatch, useAppSelector } from '@/store'
import { setCommandPaletteOpen, setMobileNavOpen } from '@/store/uiSlice'

import { CommandPalette } from './CommandPalette'
import { NAV_ITEMS } from './navItems'
import { SidebarContent, Sidebar } from './Sidebar'
import { LanguageSwitch, NotificationsBell, QuickAddMenu, ThemeToggle, UserMenu } from './TopbarControls'

function usePageName(): string {
  const { t } = useTranslation('nav')
  const { pathname } = useLocation()
  if (pathname.startsWith('/profile')) return t('profile')
  const item = [...NAV_ITEMS].sort((a, b) => b.to.length - a.to.length).find((i) => pathname.startsWith(i.to))
  return item ? t(item.label) : ''
}

function Topbar() {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const pageName = usePageName()
  return (
    <header className="sticky top-0 z-40 h-16 border-b border-border/50 bg-background/60 backdrop-blur-xl">
      <div className="mx-auto flex h-full max-w-[1600px] items-center gap-3 px-4 sm:px-6">
        <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => dispatch(setMobileNavOpen(true))} aria-label={t('a11y.openMenu')}>
          <MenuIcon />
        </Button>
        <Logo compact className="lg:hidden" />
        <p className="hidden truncate font-mono text-[11px] tracking-[0.25em] text-muted-foreground uppercase md:block lg:w-[244px]">{pageName}</p>

        <button
          type="button"
          onClick={() => dispatch(setCommandPaletteOpen(true))}
          className="ml-auto flex h-9 min-w-0 items-center gap-2.5 rounded-full border border-border/70 bg-secondary/30 px-3.5 text-[12.5px] text-muted-foreground transition hover:border-primary/40 md:ml-0 md:flex-1 md:max-w-md"
          aria-label={t('search.label')}
        >
          <SearchIcon className="size-4 shrink-0" aria-hidden />
          <span className="hidden truncate md:inline">{t('search.placeholder')}</span>
          <kbd className="ml-auto hidden rounded-md border border-border px-1.5 font-mono text-[10px] md:inline">{t('search.shortcut')}</kbd>
        </button>

        <div className="flex items-center gap-1.5 md:ml-auto">
          <LanguageSwitch className="hidden sm:flex" />
          <ThemeToggle />
          <QuickAddMenu />
          <NotificationsBell />
          <UserMenu />
        </div>
      </div>
    </header>
  )
}

function Footer() {
  const { t } = useTranslation()
  return (
    <footer className="mx-auto flex max-w-[1600px] flex-col gap-1 px-4 py-6 font-mono text-[10px] tracking-[0.18em] text-muted-foreground uppercase sm:flex-row sm:justify-between sm:px-6">
      <span>{t('brand.footer', { version: 'v5' })}</span>
      <span>{t('brand.footerPlace', { year: new Date().getFullYear() })}</span>
    </footer>
  )
}

function PageFallback() {
  return (
    <div className="flex flex-col gap-4">
      <Skeleton className="h-36 rounded-[28px]" />
      <Skeleton className="h-80 rounded-[26px]" />
    </div>
  )
}

export function AppShell() {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const mobileOpen = useAppSelector((s) => s.ui.mobileNavOpen)
  const { pathname } = useLocation()

  return (
    <div className="min-h-dvh">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-full focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground">
        {t('a11y.skipToContent')}
      </a>
      <Topbar />
      <div className="mx-auto flex max-w-[1600px] gap-6 px-4 pt-4 sm:px-6">
        <Sidebar />
        <main id="main" aria-label={t('a11y.mainContent')} className="min-w-0 flex-1 pb-6">
          <Suspense fallback={<PageFallback />}>
            <div key={pathname} className="animate-fade-up">
              <Outlet />
            </div>
          </Suspense>
        </main>
      </div>
      <Footer />

      <Sheet open={mobileOpen} onOpenChange={(o) => dispatch(setMobileNavOpen(o))}>
        <SheetContent side="left" className="w-[300px] overflow-y-auto">
          <SheetTitle className="sr-only">{t('brand.name')}</SheetTitle>
          <SheetDescription className="sr-only">{t('brand.tagline')}</SheetDescription>
          <SidebarContent onNavigate={() => dispatch(setMobileNavOpen(false))} />
        </SheetContent>
      </Sheet>
      <CommandPalette />
      <GlobalDialogs />
    </div>
  )
}
