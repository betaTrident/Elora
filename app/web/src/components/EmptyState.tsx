import { EmptyState as PolarisEmptyState } from '@shopify/polaris'

const DEFAULT_IMAGE =
  'https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png'

interface EmptyStateAction {
  content: string
  url?: string
  onAction?: () => void
}

interface EmptyStateProps {
  heading: string
  description: string
  action?: EmptyStateAction
  image?: string
}

export function EmptyState({ heading, description, action, image }: EmptyStateProps) {
  return (
    <PolarisEmptyState
      heading={heading}
      image={image ?? DEFAULT_IMAGE}
      action={action}
    >
      <p>{description}</p>
    </PolarisEmptyState>
  )
}
