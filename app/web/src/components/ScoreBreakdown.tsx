import { BlockStack, Box, Text, ProgressBar } from '@shopify/polaris'

export interface BreakdownItem {
  label: string
  value: number
  max: number
  description: string
}

interface ScoreBreakdownProps {
  breakdown: BreakdownItem[]
}

export function ScoreBreakdown({ breakdown }: ScoreBreakdownProps) {
  return (
    <BlockStack gap="300">
      {breakdown.map((item) => (
        <Box key={item.label}>
          <BlockStack gap="100">
            <Text as="span" variant="bodyMd">
              {item.label} — {item.value}/{item.max}
            </Text>
            <ProgressBar progress={(item.value / item.max) * 100} size="small" />
            <Text as="p" variant="bodySm" tone="subdued">
              {item.description}
            </Text>
          </BlockStack>
        </Box>
      ))}
    </BlockStack>
  )
}
