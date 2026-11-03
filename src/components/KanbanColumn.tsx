
import { useDraggable, useDroppable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { CalendarDays, Circle, GripVertical } from 'lucide-react'
import type { CSSProperties } from 'react'

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
}

function DraggableTask({
  task,
  disabled = false,
}: {
  task: Task
  disabled?: boolean
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
      {...attributes}
      {...listeners}
      aria-label={`Drag ${task.title}`}
    >
      <div className="task-card-top">
        <span className="task-type">
          <GripVertical size={13} />
          TASK
        </span>

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
        <span className="task-date">
          <CalendarDays size={13} />
          {task.due_date ?? 'No due date'}
        </span>

        <div className="task-avatar">G</div>
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
}: KanbanColumnProps) {
  const { isOver, setNodeRef } = useDroppable({
    id,
  })

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
            />
          ))
        )}
      </div>
    </section>
  )
}
