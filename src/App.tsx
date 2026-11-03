
import { useEffect, useState } from 'react'
import {
  LayoutDashboard,
  Layers3,
  Plus,
  RefreshCw,
  CalendarDays,
  AlertCircle,
  CheckCircle2,
  Circle,
  Clock3,
  ListFilter,
} from 'lucide-react'
import { supabase } from './lib/supabase'
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

              <button className="primary-button" disabled>
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
            <div className="kanban-board">
              {columns.map((column) => {
                const columnTasks = tasks.filter(
                  (task) => task.status === column.id
                )

                return (
                  <section className="kanban-column" key={column.id}>
                    <div className="column-header">
                      <div className="column-title">
                        <span
                          className="column-dot"
                          style={{ background: column.color }}
                        />
                        <h3>{column.title}</h3>
                        <span className="task-count">
                          {columnTasks.length}
                        </span>
                      </div>
                    </div>

                    <div className="column-body">
                      {columnTasks.length === 0 ? (
                        <div className="empty-column">
                          <Circle size={22} strokeWidth={1.5} />
                          <span>No tasks yet</span>
                        </div>
                      ) : (
                        columnTasks.map((task) => (
                          <article className="task-card" key={task.id}>
                            <div className="task-card-top">
                              <span className="task-type">
                                TASK
                              </span>
                              <span
                                className={`priority-badge ${task.priority}`}
                              >
                                <span className="priority-dot" />
                                {task.priority}
                              </span>
                            </div>

                            <h4>{task.title}</h4>

                            {task.description && (
                              <p className="task-description">
                                {task.description}
                              </p>
                            )}

                            <div className="task-card-footer">
                              <span className="task-date">
                                <CalendarDays size={13} />
                                {task.due_date ?? 'No due date'}
                              </span>

                              <div className="task-avatar">G</div>
                            </div>
                          </article>
                        ))
                      )}
                    </div>
                  </section>
                )
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default App
