import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil, finalize } from 'rxjs';
import { Task, TaskStats } from '../../classes/interfaces/Task';
import { TaskService } from '../../services/task/task-service';
import { State } from '../../classes/enums/State';
import { TaskForm } from '../task-form/task-form';

import { ChangeDetectorRef, NgZone } from '@angular/core';


@Component({
  selector: 'app-task-list',
  templateUrl: './task-list.html',
  styleUrls: ['./task-list.css'],
  standalone: true,
  imports: [CommonModule, TaskForm]
})
export class TaskList implements OnInit, OnDestroy {
  tasks: Task[] = [];
  loading = false;
  statsLoading = false;
  errorMessage = '';
  successMessage = '';
  currentPage = 1;
  pageSize = 10;
  totalPages = 0;
  totalRecords = 0;
  showModal = false;
  editingTask: Task | null = null;
  stats: TaskStats = new TaskStats();
  private destroy$ = new Subject<void>();
  readonly State = State;
  readonly today = new Date();

  constructor(private taskService: TaskService, private cd: ChangeDetectorRef, private ngZone: NgZone) {}

  ngOnInit(): void {
    this.refreshData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  refreshData(): void {
    this.loadTasks();
    this.loadStats();
  }

loadTasks(): void {
  this.loading = true;

  this.taskService
    .getTasks({ page_number: this.currentPage, page_size: this.pageSize })
    .pipe(
      takeUntil(this.destroy$),
      finalize(() => {
        this.loading = false;
        this.cd.detectChanges();
      })
    )
    .subscribe({
      next: (res) => {
        if (res.status === 200) {
          this.tasks = res.list || [];
          this.totalPages = res.total_pages || 0;
          this.totalRecords = res.total_records || 0;
        } else {
          this.errorMessage = res.message || 'Failed to load tasks';
        }
      },
      error: (error) => {
        this.errorMessage = this.extractErrorMessage(error);
      }
    });
}


  loadStats(): void {
    if (this.statsLoading) return;

    this.statsLoading = true;

    this.taskService
      .getStats()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.statsLoading = false))
      )
      .subscribe({
        next: (res) => {
          if (res.status === 200 && res.data) {
            this.stats = {
              total: res.data.total || 0,
              todo: res.data.todo || 0,
              doing: res.data.doing || 0,
              done: res.data.done || 0,
              overdue: res.data.overdue || 0,
              completion_rate: res.data.completion_rate || 0
            };
          }
        },
        error: () => {}
      });
  }

  openCreateModal(): void {
    this.editingTask = null;
    this.showModal = true;
  }

  openEditModal(task: Task): void {
    this.editingTask = { ...task };
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.editingTask = null;
  }

  onTaskSaved(): void {
    this.closeModal();
    this.showSuccess('Task saved successfully!');
    this.refreshData();
  }

  onRefresh(): void {
    this.refreshData();
  }

  deleteTask(id: number): void {
    if (!confirm('Are you sure you want to delete this task?')) return;

    this.taskService
      .deleteTask(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          if (res.status === 200) {
            this.showSuccess('Task deleted successfully!');
            this.refreshData();
          } else {
            this.showError(res.message || 'Failed to delete task');
          }
        },
        error: (error) => this.showError(this.extractErrorMessage(error))
      });
  }

  toggleTaskState(task: Task): void {
    if (!task.id) return;

    this.taskService
      .toggleState(task.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          if (res.status === 200) {
            const messages = {
              [State.TODO]: '📋 Task moved to Todo',
              [State.DOING]: '⚡ Task in progress!',
              [State.DONE]: '✅ Task completed!'
            };
            this.refreshData();
          }
        },
        error: (error) => this.showError(this.extractErrorMessage(error))
      });
  }

  toggleComplete(task: Task, event: Event): void {
    event.stopPropagation();
    if (!task.id) return;

    if (task.state !== State.DONE) {
      this.taskService
        .markAsDone(task.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (res) => {
            if (res.status === 200) {
              this.showSuccess('✅ Task completed!');
              this.refreshData();
            }
          },
          error: (error) => this.showError(this.extractErrorMessage(error))
        });
    } else {
      this.taskService
        .toggleState(task.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.showSuccess('Task reopened!');
            this.refreshData();
          },
          error: (error) => this.showError(this.extractErrorMessage(error))
        });
    }
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
      this.currentPage = page;
      this.loadTasks();
    }
  }

  get pages(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  get hasTasks(): boolean {
    return this.tasks.length > 0;
  }

  isOverdue(task: Task): boolean {
    if (!task.due_date || task.state === State.DONE) return false;
    return new Date(task.due_date) < this.today;
  }

  getStateInfo(state: string) {
    return {
      [State.TODO]: { label: 'To Do', icon: '📋', class: 'state-todo' },
      [State.DOING]: { label: 'In Progress', icon: '⚡', class: 'state-doing' },
      [State.DONE]: { label: 'Done', icon: '✅', class: 'state-done' }
    }[state] || { label: state, icon: '❓', class: 'state-unknown' };
  }

  getNextState(current: string): string {
    return {
      [State.TODO]: State.DOING,
      [State.DOING]: State.DONE,
      [State.DONE]: State.TODO
    }[current] || State.TODO;
  }

  formatDate(dateString?: string): string {
    if (!dateString) return 'No date';
    const d = new Date(dateString);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  getStateClass(state: string): string {
    return `state-${state.toLowerCase()}`;
  }

  getTagClass(tag?: string): string {
    return tag ? `tag-${tag.toLowerCase()}` : '';
  }

  private extractErrorMessage(error: any): string {
    return error?.error?.message || error?.message || 'An error occurred';
  }

  private showError(message: string): void {
    this.errorMessage = message;
    this.successMessage = '';
    setTimeout(() => (this.errorMessage = ''), 5000);
  }

  private showSuccess(message: string): void {
    this.successMessage = message;
    this.errorMessage = '';
    setTimeout(() => (this.successMessage = ''), 3000);
  }

  trackByTaskId(index: number, task: Task): number {
    return task.id || index;
  }
}
