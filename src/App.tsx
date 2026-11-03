
import { useEffect, useState, type FormEvent } from 'react'
import {
  LayoutDashboard,
  Layers3,
  Plus,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Clock3,
  ListFilter,
  X,
} from 'lucide-react'
import { supabase } from './lib/supabase'
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'

import KanbanColumn from './components/KanbanColumn'
import './App.css'

type TaskStatus = 'todo' | 'in_progress' | 'in_review' | 'done'
type TaskPriority = 'low' | 'normal' | 'high'

type Task = {
  id: string
  title: string
  description: string | null
  status: TaskStatus
  priority: TaskPriority
  due_date: string | null
  user_id: string
  created_at: string
}

const columns: {
  id: TaskStatus
  title: string
  color: string
}[] = [
  { id: 'todo', title: 'To Do', color: '#9295a5' },
  { id: 'in_progress', title: 'In Progress', color: '#7c9bff' },
  { id: 'in_review', title: 'In Review', color: '#e5ac66' },
  { id: 'done', title: 'Done', color: '#6ac5a6' },
]

function App() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [refreshCount, setRefreshCount] = useState(0)
  const [movingTaskId, setMovingTaskId] = useState<string | null>(null)
  const [moveError, setMoveError] = useState('')

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [taskTitle, setTaskTitle] = useState('')
  const [taskDescription, setTaskDescription] = useState('')
  const [taskPriority, setTaskPriority] = useState<TaskPriority>('normal')
  const [taskDueDate, setTaskDueDate] = useState('')
  const [creatingTask, setCreatingTask] = useState(false)
  const [taskError, setTaskError] = useState('')

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 6,
      },
    }),
    useSensor(KeyboardSensor)
  )

  useEffect(() => {
    let active = true

    async function initialize() {
      setLoading(true)
      setError('')

      try {
        const { data: sessionData, error: sessionError } =
          await supabase.auth.getSession()

        if (sessionError) throw sessionError

        let user = sessionData.session?.user ?? null

        if (!user) {
          const { data, error: authError } =
            await supabase.auth.signInAnonymously()

          if (authError) throw authError
          user = data.user
        }

        if (!user) {
          throw new Error('Unable to create a guest session')
        }

        if (!active) return

        setUserId(user.id)

        const { data, error: fetchError } = await supabase
          .from('tasks')
          .select('*')
          .order('created_at', { ascending: false })

        if (fetchError) throw fetchError

        if (active) {
          setTasks((data ?? []) as Task[])
        }
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error ? err.message : 'Something went wrong'
          )
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    initialize()

    return () => {
      active = false
    }
  }, [refreshCount])

  function closeTaskModal() {
    if (creatingTask) return

    setIsModalOpen(false)
    setTaskError('')
  }

  async function createTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const trimmedTitle = taskTitle.trim()

    if (!trimmedTitle) {
      setTaskError('Please enter a task title.')
      return
    }

    if (!userId) {
      setTaskError('Your guest session is not ready.')
      return
    }

    setCreatingTask(true)
    setTaskError('')

    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert({
          title: trimmedTitle,
          description: taskDescription.trim() || null,
          status: 'todo',
          priority: taskPriority,
          due_date: taskDueDate || null,
          user_id: userId,
        })
        .select()
        .single()

      if (error) throw error

      setTasks((previousTasks) => [data as Task, ...previousTasks])

      setTaskTitle('')
      setTaskDescription('')
      setTaskPriority('normal')
      setTaskDueDate('')
      setIsModalOpen(false)
    } catch (err) {
      setTaskError(
        err instanceof Error ? err.message : 'Failed to create task.'
      )
    } finally {
      setCreatingTask(false)
    }
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event

    if (!over || movingTaskId) return

    const taskId = String(active.id)
    const newStatus = String(over.id) as TaskStatus

    const validStatuses: TaskStatus[] = [
      'todo',
      'in_progress',
      'in_review',
      'done',
    ]

    if (!validStatuses.includes(newStatus)) return

    const task = tasks.find((task) => task.id === taskId)

    if (!task || task.status === newStatus) return

    const previousStatus = task.status

    setMovingTaskId(taskId)
    setMoveError('')

    setTasks((currentTasks) =>
      currentTasks.map((currentTask) =>
        currentTask.id === taskId
          ? { ...currentTask, status: newStatus }
          : currentTask
      )
    )

    try {
      const { data, error } = await supabase
        .from('tasks')
        .update({ status: newStatus })
        .eq('id', taskId)
        .eq('user_id', task.user_id)
        .select('id')
        .single()

      if (error) throw error
      if (!data) throw new Error('Task update was not saved')
    } catch (err) {
      setTasks((currentTasks) =>
        currentTasks.map((currentTask) =>
          currentTask.id === taskId
            ? { ...currentTask, status: previousStatus }
            : currentTask
        )
      )

      setMoveError(
        err instanceof Error
          ? err.message
          : 'Failed to move task. Please try again.'
      )
    } finally {
      setMovingTaskId(null)
    }
  }

  const completedTasks = tasks.filter(
    (task) => task.status === 'done'
  ).length

  const inProgressTasks = tasks.filter(
    (task) => task.status === 'in_progress'
  ).length

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">
            <Layers3 size={20} />
          </div>
          <span>TaskFlow</span>
        </div>

        <div className="sidebar-section-label">WORKSPACE</div>

        <nav className="sidebar-nav" aria-label="Main navigation">
          <div className="nav-item active">
            <LayoutDashboard size={18} />
            <span>My Board</span>
          </div>
        </nav>

        <div className="sidebar-bottom">
          <div className="guest-avatar">G</div>
          <div>
            <div className="guest-name">Guest Workspace</div>
            <div className="guest-status">
              {userId ? 'Connected' : 'Connecting...'}
            </div>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="breadcrumb">
            Workspace <span>/</span> My Board
          </div>

          <div className="topbar-actions">
            <span className="guest-badge">
              <span className="online-dot" />
              Guest session
            </span>
          </div>
        </header>

        <div className="board-content">
          <div className="page-header">
            <div>
              <div className="page-eyebrow">YOUR WORKSPACE</div>
              <h1>My Board</h1>
              <p>Manage your work, one task at a time.</p>
            </div>

            <div className="header-actions">
              <button
                className="secondary-button"
                onClick={() => setRefreshCount((n) => n + 1)}
                disabled={loading}
              >
                <RefreshCw size={16} />
                Refresh
              </button>

              <button
                className="primary-button"
                onClick={() => {
                  setTaskError('')
                  setIsModalOpen(true)
                }}
                disabled={loading || !!error || !userId}
              >
                <Plus size={18} />
                New Task
              </button>
            </div>
          </div>

          <div className="stats-row">
            <div className="stat-card">
              <div className="stat-icon purple">
                <ListFilter size={19} />
              </div>
              <div>
                <div className="stat-value">{tasks.length}</div>
                <div className="stat-label">Total tasks</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon blue">
                <Clock3 size={19} />
              </div>
              <div>
                <div className="stat-value">{inProgressTasks}</div>
                <div className="stat-label">In progress</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon green">
                <CheckCircle2 size={19} />
              </div>
              <div>
                <div className="stat-value">{completedTasks}</div>
                <div className="stat-label">Completed</div>
              </div>
            </div>
          </div>

          <div className="board-heading">
            <h2>Board overview</h2>
            <span>{tasks.length} tasks</span>
          </div>

          {loading ? (
            <div className="message-state">
              <div className="spinner" />
              <p>Loading your workspace...</p>
            </div>
          ) : error ? (
            <div className="message-state">
              <AlertCircle size={28} />
              <h3>Couldn't load your workspace</h3>
              <p>{error}</p>
              <button
                className="secondary-button"
                onClick={() => setRefreshCount((n) => n + 1)}
              >
                Try again
              </button>
            </div>
          ) : (
            <>
              {moveError && (
                <div className="board-error" role="alert">
                  <AlertCircle size={16} />
                  <span>{moveError}</span>
                  <button
                    type="button"
                    onClick={() => setMoveError('')}
                    aria-label="Dismiss error"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}

              <DndContext
                sensors={sensors}
                collisionDetection={closestCorners}
                onDragEnd={handleDragEnd}
              >
                <div className="kanban-board">
                  {columns.map((column) => (
                    <KanbanColumn
                      key={column.id}
                      id={column.id}
                      title={column.title}
                      color={column.color}
                      tasks={tasks.filter(
                        (task) => task.status === column.id
                      )}
                      disabled={movingTaskId !== null}
                    />
                  ))}
                </div>
              </DndContext>
            </>
          )}
        </div>
      </main>

      {isModalOpen && (
        <div
          className="modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeTaskModal()
            }
          }}
        >
          <div
            className="task-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-task-title"
          >
            <div className="modal-header">
              <div>
                <h2 id="create-task-title">Create new task</h2>
                <p>Add a task to your workspace.</p>
              </div>

              <button
                type="button"
                className="modal-close"
                onClick={closeTaskModal}
                disabled={creatingTask}
                aria-label="Close dialog"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={createTask}>
              <div className="form-field">
                <label htmlFor="task-title">Task title *</label>
                <input
                  id="task-title"
                  type="text"
                  placeholder="What needs to be done?"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  maxLength={200}
                  required
                  autoFocus
                />
              </div>

              <div className="form-field">
                <label htmlFor="task-description">
                  Description
                </label>
                <textarea
                  id="task-description"
                  placeholder="Add more details about this task..."
                  value={taskDescription}
                  onChange={(e) => setTaskDescription(e.target.value)}
                  rows={4}
                />
              </div>

              <div className="form-row">
                <div className="form-field">
                  <label htmlFor="task-priority">Priority</label>
                  <select
                    id="task-priority"
                    value={taskPriority}
                    onChange={(e) =>
                      setTaskPriority(e.target.value as TaskPriority)
                    }
                  >
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                  </select>
                </div>

                <div className="form-field">
                  <label htmlFor="task-due-date">Due date</label>
                  <input
                    id="task-due-date"
                    type="date"
                    value={taskDueDate}
                    onChange={(e) => setTaskDueDate(e.target.value)}
                  />
                </div>
              </div>

              {taskError && (
                <div className="form-error" role="alert">
                  <AlertCircle size={16} />
                  <span>{taskError}</span>
                </div>
              )}

              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={closeTaskModal}
                  disabled={creatingTask}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="primary-button"
                  disabled={creatingTask}
                >
                  <Plus size={16} />
                  {creatingTask ? 'Creating...' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
