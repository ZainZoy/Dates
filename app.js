// Academic Intelligence Dashboard - Standalone Version
// All functionality in vanilla JavaScript

// State Management
let tasks = [];
let currentView = 'dashboard';
let selectedSubject = null;
let editingTaskId = null;

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    loadTasks();
    initializeTheme();
    initializeEventListeners();
    setDefaultDate();
    render();
});

// Load tasks from localStorage
function loadTasks() {
    const saved = localStorage.getItem('academicTasks');
    if (saved) {
        tasks = JSON.parse(saved);
        cleanupOldTasks();
    }
}

// Save tasks to localStorage
function saveTasks() {
    localStorage.setItem('academicTasks', JSON.stringify(tasks));
}

// Cleanup old completed tasks (7 days)
function cleanupOldTasks() {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    tasks = tasks.filter(task => {
        if (!task.completed) return true;
        return new Date(task.completedAt) > sevenDaysAgo;
    });
    saveTasks();
}

// Theme Management
function initializeTheme() {
    const saved = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = saved || (prefersDark ? 'dark' : 'light');

    if (theme === 'dark') {
        document.body.classList.add('dark-mode');
        document.getElementById('sunIcon').style.display = 'none';
        document.getElementById('moonIcon').style.display = 'block';
    }
}

function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');

    document.getElementById('sunIcon').style.display = isDark ? 'none' : 'block';
    document.getElementById('moonIcon').style.display = isDark ? 'block' : 'none';
}

// Event Listeners
function initializeEventListeners() {
    // Theme toggle
    document.getElementById('themeToggle').addEventListener('click', toggleTheme);

    // Add task buttons
    document.getElementById('addTaskBtn').addEventListener('click', openTaskModal);
    document.getElementById('addTaskBtnMobile').addEventListener('click', openTaskModal);

    // Modal controls
    document.getElementById('closeModal').addEventListener('click', closeTaskModal);
    document.getElementById('cancelBtn').addEventListener('click', closeTaskModal);
    document.getElementById('taskForm').addEventListener('submit', handleTaskSubmit);

    // Help modal
    document.getElementById('helpBtn').addEventListener('click', openHelpModal);
    document.getElementById('closeHelp').addEventListener('click', closeHelpModal);

    // Close modals on outside click
    document.getElementById('taskModal').addEventListener('click', (e) => {
        if (e.target.id === 'taskModal') closeTaskModal();
    });
    document.getElementById('helpModal').addEventListener('click', (e) => {
        if (e.target.id === 'helpModal') closeHelpModal();
    });

    // Navigation
    document.querySelectorAll('.nav-btn, .mobile-nav-btn').forEach(btn => {
        if (btn.dataset.view) {
            btn.addEventListener('click', () => switchView(btn.dataset.view));
        }
    });

    // Task type selection
    document.querySelectorAll('.task-type-btn').forEach(btn => {
        btn.addEventListener('click', () => selectTaskType(btn));
    });

    // Priority selection
    document.querySelectorAll('.priority-btn').forEach(btn => {
        btn.addEventListener('click', () => selectPriority(btn));
    });
}

// Modal Functions
function openTaskModal(taskId = null) {
    editingTaskId = taskId;
    const modal = document.getElementById('taskModal');
    const form = document.getElementById('taskForm');

    if (taskId) {
        const task = tasks.find(t => t.id === taskId);
        if (task) {
            document.getElementById('modalTitle').textContent = 'Edit Task';
            document.getElementById('taskTitle').value = task.title;
            document.getElementById('taskSubject').value = task.subject;
            document.getElementById('taskDate').value = task.dueDate.split('T')[0];
            document.getElementById('taskTime').value = task.dueDate.split('T')[1].substring(0, 5);
            document.getElementById('taskNotes').value = task.notes || '';

            // Set task type
            document.querySelectorAll('.task-type-btn').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.type === task.type);
            });

            // Set priority
            document.querySelectorAll('.priority-btn').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.priority === task.priority);
            });
        }
    } else {
        document.getElementById('modalTitle').textContent = 'Add New Task';
        form.reset();
        setDefaultDate();
        document.querySelector('.task-type-btn').classList.add('active');
        document.querySelector('.priority-btn[data-priority="medium"]').classList.add('active');
    }

    updateSubjectDatalist();
    modal.classList.add('active');
}

function closeTaskModal() {
    document.getElementById('taskModal').classList.remove('active');
    editingTaskId = null;
}

function openHelpModal() {
    document.getElementById('helpModal').classList.add('active');
}

function closeHelpModal() {
    document.getElementById('helpModal').classList.remove('active');
}

function selectTaskType(btn) {
    document.querySelectorAll('.task-type-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
}

function selectPriority(btn) {
    document.querySelectorAll('.priority-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
}

function setDefaultDate() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('taskDate').value = today;
}

function updateSubjectDatalist() {
    const subjects = [...new Set(tasks.map(t => t.subject))];
    const datalist = document.getElementById('subjectList');
    datalist.innerHTML = subjects.map(s => `<option value="${s}">`).join('');
}

// Task Management
function handleTaskSubmit(e) {
    e.preventDefault();

    const type = document.querySelector('.task-type-btn.active').dataset.type;
    const priority = document.querySelector('.priority-btn.active').dataset.priority;
    const title = document.getElementById('taskTitle').value.trim();
    const subject = document.getElementById('taskSubject').value.trim();
    const date = document.getElementById('taskDate').value;
    const time = document.getElementById('taskTime').value;
    const notes = document.getElementById('taskNotes').value.trim();

    const dueDate = `${date}T${time}:00`;

    if (editingTaskId) {
        // Update existing task
        const task = tasks.find(t => t.id === editingTaskId);
        if (task) {
            task.type = type;
            task.title = title;
            task.subject = subject;
            task.dueDate = dueDate;
            task.priority = priority;
            task.notes = notes;
        }
    } else {
        // Create new task
        const newTask = {
            id: Date.now().toString(),
            type,
            title,
            subject,
            dueDate,
            priority,
            notes,
            completed: false,
            createdAt: new Date().toISOString()
        };
        tasks.push(newTask);
    }

    saveTasks();
    closeTaskModal();
    render();
}

function completeTask(id) {
    const task = tasks.find(t => t.id === id);
    if (task) {
        task.completed = true;
        task.completedAt = new Date().toISOString();
        saveTasks();
        render();
    }
}

function deleteTask(id) {
    if (confirm('Delete this task?')) {
        tasks = tasks.filter(t => t.id !== id);
        saveTasks();
        render();
    }
}

function switchView(view) {
    currentView = view;
    selectedSubject = null;

    // Update active states
    document.querySelectorAll('.nav-btn, .mobile-nav-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.view === view);
    });

    render();
}

function filterBySubject(subject) {
    selectedSubject = subject;
    render();
}

// Utility Functions
function getUrgencyClass(dueDate) {
    const now = new Date();
    const due = new Date(dueDate);
    const hoursUntil = (due - now) / (1000 * 60 * 60);

    if (hoursUntil <= 24) return 'urgent';
    if (hoursUntil <= 72) return 'soon';
    return 'later';
}

function isOverdue(dueDate) {
    return new Date(dueDate) < new Date();
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

function getTimeUntilDue(dueDate) {
    const now = new Date();
    const due = new Date(dueDate);
    const diff = due - now;

    if (diff < 0) return 'Overdue';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) return `Due in ${days} day${days !== 1 ? 's' : ''}`;
    if (hours > 0) return `Due in ${hours} hour${hours !== 1 ? 's' : ''}`;
    return 'Due soon';
}

function getTaskIcon(type) {
    const icons = {
        homework: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline>',
        exam: '<rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line>',
        quiz: '<circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline>',
        personal: '<circle cx="12" cy="12" r="10"></circle>'
    };
    return icons[type] || icons.personal;
}

// Filtering Functions
function getFilteredTasks() {
    let filtered = tasks.filter(t => !t.completed);

    if (currentView === 'dashboard') {
        // Tasks due within 24 hours
        const tomorrow = new Date();
        tomorrow.setHours(tomorrow.getHours() + 24);
        filtered = filtered.filter(t => new Date(t.dueDate) <= tomorrow);
    } else if (currentView === 'subjects' && selectedSubject) {
        filtered = filtered.filter(t => t.subject === selectedSubject);
    }

    // Sort by due date, then priority
    return filtered.sort((a, b) => {
        const dateCompare = new Date(a.dueDate) - new Date(b.dueDate);
        if (dateCompare !== 0) return dateCompare;

        const priorityOrder = { high: 0, medium: 1, low: 2 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
}

function getCompletedTasks() {
    return tasks.filter(t => t.completed);
}

function getSubjects() {
    return [...new Set(tasks.map(t => t.subject))].filter(Boolean);
}

function getStats() {
    const pending = tasks.filter(t => !t.completed);
    const completed = tasks.filter(t => t.completed);
    const overdue = pending.filter(t => isOverdue(t.dueDate));

    const total = tasks.length;
    const completionRate = total > 0 ? Math.round((completed.length / total) * 100) : 0;

    return {
        pending: pending.length,
        completed: completed.length,
        overdue: overdue.length,
        completionRate
    };
}

// Render Functions
function render() {
    renderDashboardHeader();
    renderSubjectFilter();
    renderTasks();
    renderCompletedTasks();
    renderCalendar();
    renderProgress();
}

function renderDashboardHeader() {
    const stats = getStats();
    const today = new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    const html = `
        <h2 style="font-size: 1.5rem; font-weight: 700; margin-bottom: 0.5rem;">${today}</h2>
        <p style="color: #6B7280; margin-bottom: 1rem;">
            ${stats.pending > 0
            ? `You have ${stats.pending} pending task${stats.pending !== 1 ? 's' : ''}`
            : 'All caught up! 🎉'
        }
        </p>
        <div class="stats-grid">
            <div class="stat-card pending">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" stroke-width="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
                <div>
                    <div style="font-size: 0.875rem; color: #6B7280;">Pending</div>
                    <div style="font-size: 1.5rem; font-weight: 700; color: #3B82F6;">${stats.pending}</div>
                </div>
            </div>
            <div class="stat-card completed">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
                <div>
                    <div style="font-size: 0.875rem; color: #6B7280;">Completed</div>
                    <div style="font-size: 1.5rem; font-weight: 700; color: #10B981;">${stats.completed}</div>
                </div>
            </div>
            ${stats.overdue > 0 ? `
                <div class="stat-card overdue">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#EF4444" stroke-width="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="12"></line>
                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                    <div>
                        <div style="font-size: 0.875rem; color: #6B7280;">Overdue</div>
                        <div style="font-size: 1.5rem; font-weight: 700; color: #EF4444;">${stats.overdue}</div>
                    </div>
                </div>
            ` : ''}
        </div>
        <div style="margin-top: 1rem;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem; font-size: 0.875rem;">
                <span style="color: #6B7280;">Overall Progress</span>
                <span style="font-weight: 600;">${stats.completionRate}%</span>
            </div>
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${stats.completionRate}%"></div>
            </div>
        </div>
    `;

    document.getElementById('dashboardHeader').innerHTML = html;
}

function renderSubjectFilter() {
    const filter = document.getElementById('subjectFilter');

    if (currentView === 'subjects') {
        const subjects = getSubjects();
        filter.style.display = subjects.length > 0 ? 'flex' : 'none';
        filter.innerHTML = subjects.map(subject => `
            <button class="nav-btn ${selectedSubject === subject ? 'active' : ''}" 
                    onclick="filterBySubject('${subject}')">
                ${subject}
            </button>
        `).join('');
    } else {
        filter.style.display = 'none';
    }
}

function renderTasks() {
    const container = document.getElementById('taskContainer');
    const filtered = getFilteredTasks();

    if (filtered.length === 0) {
        container.innerHTML = renderEmptyState();
        return;
    }

    container.innerHTML = filtered.map(task => renderTaskCard(task)).join('');
}

function renderEmptyState() {
    const messages = {
        dashboard: {
            title: 'All Clear!',
            message: 'No urgent tasks due within 24 hours. Great job staying on top of things!'
        },
        pending: {
            title: 'No Pending Tasks',
            message: "You've completed everything! Time to relax or add new tasks."
        },
        subjects: {
            title: 'No Tasks for This Subject',
            message: 'Select a different subject or add new tasks to get started.'
        }
    };

    const state = messages[currentView] || messages.pending;

    return `
        <div class="empty-state">
            <div class="empty-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
            </div>
            <h3 style="font-size: 1.5rem; font-weight: 700; margin-bottom: 0.5rem;">${state.title}</h3>
            <p style="color: #6B7280;">${state.message}</p>
        </div>
    `;
}

function renderTaskCard(task) {
    const urgency = getUrgencyClass(task.dueDate);
    const overdue = !task.completed && isOverdue(task.dueDate);

    return `
        <div class="task-card ${urgency} ${task.completed ? 'completed' : ''}">
            <div class="task-header">
                <div class="task-icon priority-${task.priority}">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        ${getTaskIcon(task.type)}
                    </svg>
                </div>
                <div class="task-content">
                    <div class="task-title-row">
                        <h3 class="task-title">${task.title}</h3>
                        <span class="priority-badge ${task.priority}">${task.priority.toUpperCase()}</span>
                    </div>
                    <p class="task-subject">${task.subject}</p>
                    <div class="task-meta">
                        <span class="task-meta-item">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                <line x1="16" y1="2" x2="16" y2="6"></line>
                                <line x1="8" y1="2" x2="8" y2="6"></line>
                                <line x1="3" y1="10" x2="21" y2="10"></line>
                            </svg>
                            ${formatDate(task.dueDate)}
                        </span>
                        <span class="task-meta-item">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="12" cy="12" r="10"></circle>
                                <polyline points="12 6 12 12 16 14"></polyline>
                            </svg>
                            ${formatTime(task.dueDate)}
                        </span>
                        ${overdue ? `
                            <span class="overdue-badge">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <line x1="12" y1="8" x2="12" y2="12"></line>
                                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                                </svg>
                                OVERDUE
                            </span>
                        ` : ''}
                    </div>
                    ${!task.completed && !overdue ? `
                        <p style="font-size: 0.875rem; color: #6B7280; margin-top: 0.5rem;">
                            ${getTimeUntilDue(task.dueDate)}
                        </p>
                    ` : ''}
                    ${task.notes ? `
                        <div class="task-notes">${task.notes}</div>
                    ` : ''}
                </div>
            </div>
            <div class="task-actions">
                ${!task.completed ? `
                    <button class="task-btn complete" onclick="completeTask('${task.id}')">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                            <polyline points="22 4 12 14.01 9 11.01"></polyline>
                        </svg>
                        Complete
                    </button>
                    <button class="task-btn edit" onclick="openTaskModal('${task.id}')">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                        Edit
                    </button>
                ` : ''}
                <button class="task-btn delete" onclick="deleteTask('${task.id}')">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                    Delete
                </button>
            </div>
        </div>
    `;
}

function renderCompletedTasks() {
    const completed = getCompletedTasks();
    const section = document.getElementById('completedSection');
    const container = document.getElementById('completedTasks');

    if (completed.length === 0) {
        section.style.display = 'none';
        return;
    }

    section.style.display = 'block';
    document.getElementById('completedCount').textContent = completed.length;
    container.innerHTML = completed.map(task => renderTaskCard(task)).join('');
}

function renderCalendar() {
    const widget = document.getElementById('calendarWidget');
    const today = new Date();
    const days = [];

    for (let i = 0; i < 7; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() + i);

        const dayTasks = tasks.filter(t =>
            !t.completed &&
            new Date(t.dueDate).toDateString() === date.toDateString()
        );

        days.push({
            date,
            dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
            dayNumber: date.getDate(),
            isToday: i === 0,
            taskCount: dayTasks.length,
            hasHighPriority: dayTasks.some(t => t.priority === 'high')
        });
    }

    const totalTasks = days.reduce((sum, day) => sum + day.taskCount, 0);

    widget.innerHTML = `
        <div class="widget-title">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            Upcoming Week
        </div>
        <div class="calendar-grid">
            ${days.map(day => `
                <div class="calendar-day ${day.isToday ? 'today' : ''}">
                    <div style="font-size: 0.75rem; font-weight: 500;">${day.dayName}</div>
                    <div style="font-size: 1.125rem; font-weight: 700;">${day.dayNumber}</div>
                    ${day.taskCount > 0 ? `
                        <div class="task-dots">
                            ${Array(Math.min(day.taskCount, 3)).fill(0).map(() => `
                                <div class="task-dot ${day.hasHighPriority ? 'high-priority' : ''}"></div>
                            `).join('')}
                        </div>
                    ` : ''}
                </div>
            `).join('')}
        </div>
        <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--border-light); display: flex; justify-content: space-between; font-size: 0.875rem;">
            <span style="color: #6B7280;">Next 7 days</span>
            <span style="font-weight: 600;">${totalTasks} tasks</span>
        </div>
    `;
}

function renderProgress() {
    const widget = document.getElementById('progressWidget');
    const subjects = getSubjects();

    if (subjects.length === 0) {
        widget.innerHTML = '';
        return;
    }

    const subjectProgress = subjects.map(subject => {
        const subjectTasks = tasks.filter(t => t.subject === subject);
        const completed = subjectTasks.filter(t => t.completed).length;
        const total = subjectTasks.length;
        const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

        return { subject, completed, total, percentage };
    }).sort((a, b) => b.percentage - a.percentage);

    widget.innerHTML = `
        <div class="widget-title">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
            </svg>
            Progress by Subject
        </div>
        ${subjectProgress.map(({ subject, completed, total, percentage }) => `
            <div class="progress-item">
                <div class="progress-header">
                    <span style="font-weight: 500;">${subject}</span>
                    <span style="color: #6B7280;">${completed}/${total}</span>
                </div>
                <div class="progress-bar-small">
                    <div class="progress-fill" style="width: ${percentage}%"></div>
                </div>
            </div>
        `).join('')}
    `;
}

// Make functions globally accessible
window.openTaskModal = openTaskModal;
window.completeTask = completeTask;
window.deleteTask = deleteTask;
window.filterBySubject = filterBySubject;
