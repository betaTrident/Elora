import { Frame, Page } from '@shopify/polaris'
import type { ComplexAction } from '@shopify/polaris'
import { TitleBar } from '@shopify/app-bridge-react'
import type { ReactNode } from 'react'

interface PageLayoutProps {
  title: string
  titleBarTitle?: string
  children?: ReactNode
  primaryAction?: ComplexAction
}

export function PageLayout({ title, titleBarTitle, children, primaryAction }: PageLayoutProps) {
  return (
    <Frame>
      <TitleBar title={titleBarTitle ?? title} />
      <Page title={title} primaryAction={primaryAction}>
        {children}
      </Page>
    </Frame>
  )
}
