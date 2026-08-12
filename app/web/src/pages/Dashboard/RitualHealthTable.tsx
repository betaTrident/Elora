import { BlockStack, IndexTable, Link, Text } from '@shopify/polaris'
import type { RitualSummary } from '../../types'
import { ScoreBadge } from '../../components/ScoreBadge'
import { formatRelativeTime } from '../../utils/formatRelativeTime'

interface RitualHealthTableProps {
  rituals: RitualSummary[]
}

export function RitualHealthTable({ rituals }: RitualHealthTableProps) {
  return (
    <BlockStack gap="300">
      <Text as="h2" variant="headingMd">Routines needing attention</Text>
      <IndexTable
        resourceName={{ singular: 'routine', plural: 'routines' }}
        itemCount={rituals.length}
        headings={[
          { title: 'Routine name' },
          { title: 'Score' },
          { title: 'Threshold' },
          { title: 'Last checked' },
        ]}
        selectable={false}
      >
        {rituals.map((ritual, index) => (
          <IndexTable.Row key={ritual.id} id={ritual.id} position={index}>
            <IndexTable.Cell>
              <Link url={`/rituals/${ritual.id}/edit`}>{ritual.title}</Link>
            </IndexTable.Cell>
            <IndexTable.Cell>
              <ScoreBadge score={ritual.lastScore} threshold={ritual.scoreThreshold} />
            </IndexTable.Cell>
            <IndexTable.Cell>{ritual.scoreThreshold}</IndexTable.Cell>
            <IndexTable.Cell>
              {ritual.lastScoredAt
                ? formatRelativeTime(new Date(ritual.lastScoredAt as string))
                : '\u2014'}
            </IndexTable.Cell>
          </IndexTable.Row>
        ))}
      </IndexTable>
    </BlockStack>
  )
}
