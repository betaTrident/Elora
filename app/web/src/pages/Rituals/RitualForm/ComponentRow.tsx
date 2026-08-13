import { InlineStack, Select, TextField, Button, Text } from '@shopify/polaris'
import type { Component } from '../../../types'

const ROLE_OPTIONS = [
  { label: 'Cleanse', value: 'cleanse' },
  { label: 'Treat', value: 'treat' },
  { label: 'Seal / Moisturize', value: 'seal' },
  { label: 'Scent / Mist', value: 'scent' },
]

interface ComponentRowProps {
  component: Component
  onChange: (component: Component) => void
  onRemove: () => void
}

export function ComponentRow({ component, onChange, onRemove }: ComponentRowProps) {
  return (
    <InlineStack gap="300" align="start" blockAlign="center" wrap>
      <Text as="p" variant="bodyMd">
        {component.productTitleCache ?? component.shopifyProductId}
      </Text>
      <Select
        label="Role"
        labelHidden
        options={ROLE_OPTIONS}
        value={component.role}
        onChange={(role) =>
          onChange({ ...component, role: role as Component['role'] })
        }
      />
      <TextField
        label="Quantity"
        labelHidden
        type="number"
        value={String(component.quantity)}
        min={1}
        onChange={(value) =>
          onChange({ ...component, quantity: Number(value) || 1 })
        }
        autoComplete="off"
      />
      <Button tone="critical" variant="plain" onClick={onRemove}>
        Remove
      </Button>
    </InlineStack>
  )
}
