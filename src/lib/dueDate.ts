
export type DueDateStatus =
  | 'overdue'
  | 'today'
  | 'soon'
  | 'upcoming'
  | 'none'

export function getDueDateStatus(
  dueDate: string | null,
  completed = false
): DueDateStatus {
  if (!dueDate) return 'none'

  const [year, month, day] = dueDate.split('-').map(Number)

  if (!year || !month || !day) return 'none'

  const today = new Date()

  const todayDay = Date.UTC(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  )

  const dueDay = Date.UTC(year, month - 1, day)
  const daysUntilDue = Math.round(
    (dueDay - todayDay) / 86400000
  )

  if (completed) return 'upcoming'
  if (daysUntilDue < 0) return 'overdue'
  if (daysUntilDue === 0) return 'today'
  if (daysUntilDue <= 3) return 'soon'

  return 'upcoming'
}

export function formatDueDate(
  dueDate: string | null,
  status: DueDateStatus
): string {
  if (!dueDate) return 'No due date'

  if (status === 'overdue') return 'Overdue'
  if (status === 'today') return 'Due today'

  const [year, month, day] = dueDate.split('-').map(Number)

  if (status === 'soon') {
    const today = new Date()
    const todayDay = Date.UTC(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    )

    const days = Math.round(
      (Date.UTC(year, month - 1, day) - todayDay) / 86400000
    )

    if (days === 1) return 'Due tomorrow'
    return `Due in ${days} days`
  }

  return new Date(year, month - 1, day).toLocaleDateString(
    'en-US',
    { month: 'short', day: 'numeric' }
  )
}
