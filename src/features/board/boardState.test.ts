import { describe, expect, it } from 'vitest'

import { afterIdFor, columnDroppableId, findColumn, moveBetween, reorderWithin, type ColumnIds } from './boardState'

const cols = (): ColumnIds => ({ todo: [1, 2], progress: [3], review: [], blocked: [], done: [4] })

describe('boardState', () => {
  it('finds the column of an issue or a column droppable', () => {
    expect(findColumn(cols(), 3)).toBe('progress')
    expect(findColumn(cols(), columnDroppableId('review'))).toBe('review')
    expect(findColumn(cols(), 99)).toBeNull()
  })

  it('moves a card before the card it is over in another column', () => {
    const next = moveBetween(cols(), 1, 3)
    expect(next.todo).toEqual([2])
    expect(next.progress).toEqual([1, 3])
  })

  it('appends to an empty column when dropped on the column itself', () => {
    expect(moveBetween(cols(), 2, columnDroppableId('review')).review).toEqual([2])
  })

  it('reorders within a column', () => {
    expect(reorderWithin(cols(), 'todo', 1, 2).todo).toEqual([2, 1])
  })

  it('computes after_id as the card directly above (null at the top)', () => {
    expect(afterIdFor(cols(), 1)).toEqual({ status: 'todo', afterId: null })
    expect(afterIdFor(cols(), 2)).toEqual({ status: 'todo', afterId: 1 })
    expect(afterIdFor(moveBetween(cols(), 3, 2), 3)).toEqual({ status: 'todo', afterId: 1 })
  })
})
