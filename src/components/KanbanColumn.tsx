
import { useDraggable, useDroppable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import {
  CalendarDays,
  Circle,
  GripVertical,
  Pencil,
} from 'lucide-react'
import type { CSSProperties } from 'react'
import {
  getDueDateStatus,
  formatDueDate,
} from '../lib/dueDate'

type TaskStatus = 'todo' | 'in_progress' | 'in_review' | 'done'

type Task = {
  id: string
  title: string
  description: string | null
  status: TaskStatus
  priority: 'low' | 'normal' | 'high'
  due_date: string | null
}

type KanbanColumnProps = {
  id: TaskStatus
  title: string
  color: string
  tasks: Task[]
  disabled?: boolean
  onEditTask: (taskId: string) => void
}

function DraggableTask({
  task,
  disabled = false,
  onEditTask,
}: {
  task: Task
  disabled?: boolean
  onEditTask: (taskId: string) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: task.id,
    disabled,
  })

  const dueDateStatus = getDueDateStatus(
    task.due_date,
    task.status === 'done'
  )

  const dueDateLabel = formatDueDate(
    task.due_date,
    dueDateStatus
  )

  const style: CSSProperties = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.55 : 1,
    zIndex: isDragging ? 10 : undefined,
    position: 'relative',
  }

  return (
    <article
      ref={setNodeRef}
      style={style}
      className={`task-card draggable-task ${isDragging ? 'dragging' : ''}`}
    >
      <div className="task-card-top">
        <div className="task-card-controls">
          <button
            type="button"
            className="drag-handle"
            {...attributes}
            {...listeners}
            disabled={disabled}
            aria-label={`Drag ${task.title}`}
          >
            <GripVertical size={16} />
          </button>
          <span className="task-type">TASK</span>
        </div>

        <span className={`priority-badge ${task.priority}`}>
          <span className="priority-dot" />
          {task.priority}
        </span>
      </div>

      <h4>{task.title}</h4>

      {task.description && (
        <p className="task-description">{task.description}</p>
      )}

      <div className="task-card-footer">
        <span
          className={`task-date due-${dueDateStatus}`}
          title={task.due_date ?? 'No due date'}
        >
          <CalendarDays size={13} />
          {dueDateLabel}
        </span>

        <div className="task-footer-actions">
          <button
            type="button"
            className="task-edit-button"
            onClick={() => onEditTask(task.id)}
            disabled={disabled}
            aria-label={`Edit ${task.title}`}
          >
            <Pencil size={14} />
          </button>
          <div className="task-avatar">G</div>
        </div>
      </div>
    </article>
  )
}

export default function KanbanColumn({
  id,
  title,
  color,
  tasks,
  disabled = false,
  onEditTask,
}: KanbanColumnProps) {
  const { isOver, setNodeRef } = useDroppable({ id })

  return (
    <section className="kanban-column">
      <div className="column-header">
        <div className="column-title">
          <span
            className="column-dot"
            style={{ background: color }}
          />
          <h3>{title}</h3>
          <span className="task-count">{tasks.length}</span>
        </div>
      </div>

      <div
        ref={setNodeRef}
        className={`column-body droppable-column ${isOver ? 'column-over' : ''}`}
      >
        {tasks.length === 0 ? (
          <div className="empty-column">
            <Circle size={22} strokeWidth={1.5} />
            <span>
              {isOver ? 'Release to move task' : 'No tasks yet'}
            </span>
          </div>
        ) : (
          tasks.map((task) => (
            <DraggableTask
              key={task.id}
              task={task}
              disabled={disabled}
              onEditTask={onEditTask}
            />
          ))
        )}
      </div>
    </section>
  )
}
