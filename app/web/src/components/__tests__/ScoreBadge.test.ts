import { describe, it, expect } from 'vitest'
import { getScoreStatus } from '../../utils/scoreStatus'

describe('getScoreStatus', () => {
  it('returns not-scored for null score', () => {
    expect(getScoreStatus(null, 70)).toBe('not-scored')
  })

  it('returns healthy when score >= threshold and >= 80', () => {
    expect(getScoreStatus(90, 70)).toBe('healthy')
    expect(getScoreStatus(80, 70)).toBe('healthy')
    expect(getScoreStatus(80, 80)).toBe('healthy')
  })

  it('returns at-risk when score >= threshold but < 80', () => {
    expect(getScoreStatus(75, 70)).toBe('at-risk')
    expect(getScoreStatus(70, 70)).toBe('at-risk')
  })

  it('returns broken when score < threshold', () => {
    expect(getScoreStatus(50, 70)).toBe('broken')
    expect(getScoreStatus(69, 70)).toBe('broken')
  })
})
