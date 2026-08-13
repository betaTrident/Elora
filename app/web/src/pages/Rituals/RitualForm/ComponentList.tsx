import { BlockStack, Button, Card, Text } from '@shopify/polaris'
import { ComponentRow } from './ComponentRow'
import type { Component } from '../../../types'

interface ComponentListProps {
  components: Component[]
  onChange: (components: Component[]) => void
}

export function ComponentList({ components, onChange }: ComponentListProps) {
  async function handleAddProducts() {
    const selection = await shopify.resourcePicker({
      type: 'product',
      multiple: true,
      action: 'add',
    })
    if (!selection) return

    const newComponents: Component[] = selection.map((product, index) => ({
      shopifyProductId: product.id,
      shopifyVariantId: product.variants?.[0]?.id ?? null,
      productTitleCache: product.title,
      role: 'cleanse',
      quantity: 1,
      sortOrder: components.length + index,
    }))
    onChange([...components, ...newComponents])
  }

  return (
    <Card>
      <BlockStack gap="300">
        <Text as="h2" variant="headingMd">Routine products</Text>
        {components.map((component, index) => (
          <ComponentRow
            key={`${component.shopifyProductId}-${index}`}
            component={component}
            onChange={(updated) => {
              const next = [...components]
              next[index] = updated
              onChange(next)
            }}
            onRemove={() =>
              onChange(components.filter((_, componentIndex) => componentIndex !== index))
            }
          />
        ))}
        <Button onClick={() => void handleAddProducts()}>Add product</Button>
      </BlockStack>
    </Card>
  )
}
