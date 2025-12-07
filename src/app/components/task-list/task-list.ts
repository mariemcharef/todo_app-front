import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil, finalize } from 'rxjs';
import { Task } from '../../classes/interfaces/Task';
import { TaskService } from '../../services/task/task-service';
import { State } from '../../classes/enums/State';
import { TaskForm } from '../task-form/task-form';

interface TaskStats {
  total: number;
  todo: number;
  doing: number;
  done: number;
  overdue: number;
  completion_rate: number;
}

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
  
  // Pagination
  currentPage = 1;
  pageSize = 10;
  totalPages = 0;
  totalRecords = 0;
  
  // Modal
  showModal = false;
  editingTask: Task | null = null;

  // Stats with default values
  stats: TaskStats = {
    total: 0,
    todo: 0,
    doing: 0,
    done: 0,
    overdue: 0,
    completion_rate: 0
  };

  // Cleanup
  private destroy$ = new Subject<void>();

  // State enum for template
  readonly State = State;
  
  // Current date for overdue check
  readonly today = new Date();

  constructor(private taskService: TaskService) {}

  ngOnInit(): void {
    this.subscribeToTaskUpdates(); 
    this.refreshData();
    
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Refresh all data (tasks and stats)
   */
  refreshData(): void {
    this.loadTasks();
    this.loadStats();
  }

  /**
   * Subscribe to task updates from the service
   */
  private subscribeToTaskUpdates(): void {
    this.taskService.tasksUpdated$
      .pipe(takeUntil(this.destroy$))
      .subscribe(updated => {
        if (updated) {
          console.log('Tasks updated notification received - refreshing...');
          this.refreshData();
        }
      });
  }

  /**
   * Load tasks with current pagination settings
   */
  loadTasks(): void {
    this.loading = false;
    this.errorMessage = '';
    console.log(`Loading tasks: page ${this.currentPage}, size ${this.pageSize}`);

    this.taskService
      .getTasks({ 
        page_number: this.currentPage, 
        page_size: this.pageSize 
      })
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.loading = false;
          console.log('Loading completed');
        })
      )
      .subscribe({
        next: (response) => {
          console.log('Tasks response:', response);
          
          if (response.status === 200) {
            this.tasks = response.list || [];
            this.totalPages = response.total_pages || 0;
            this.totalRecords = response.total_records || 0;
            this.currentPage = response.page_number || 1;
            
            console.log(`Loaded ${this.tasks.length} tasks (${this.totalRecords} total)`);
          } else {
            this.errorMessage = response.message || 'Failed to load tasks';
            console.error('Failed to load tasks:', response);
          }
        },
        error: (error) => {
          this.errorMessage = this.extractErrorMessage(error);
          console.error('Error loading tasks:', error);
        }
      });
  }

  /**
   * Load task statistics
   */
  loadStats(): void {
    this.statsLoading = true;
    console.log('Loading statistics...');

    this.taskService
      .getStats()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.statsLoading = false;
          console.log('Stats loading completed');
        })
      )
      .subscribe({
        next: (res) => {
          console.log('Stats response:', res);
          
          if (res.status === 200 && res.data) {
            this.stats = {
              total: res.data.total || 0,
              todo: res.data.todo || 0,
              doing: res.data.doing || 0,
              done: res.data.done || 0,
              overdue: res.data.overdue || 0,
              completion_rate: res.data.completion_rate || 0
            };
            console.log('Stats loaded:', this.stats);
          }
        },
        error: (error) => {
          console.error('Failed to load task statistics:', error);
          // Keep default stats on error
        }
      });
  }

  /**
   * Open modal to create a new task
   */
  openCreateModal(): void {
    this.editingTask = null;
    this.showModal = true;
  }

  /**
   * Open modal to edit an existing task
   */
  openEditModal(task: Task): void {
    this.editingTask = { ...task };
    this.showModal = true;
  }

  /**
   * Close the task modal
   */
  closeModal(): void {
    this.showModal = false;
    this.editingTask = null;
  }

  /**
   * Handle task saved event from modal
   */
  onTaskSaved(): void {
    this.closeModal();
    this.showSuccess('Task saved successfully!');
    this.refreshData();
  }

  /**
   * Manual refresh button handler
   */
  onRefresh(): void {
    this.refreshData();
  }

  /**
   * Delete a task with confirmation
   */
  deleteTask(id: number): void {
    if (!confirm('Are you sure you want to delete this task?')) {
      return;
    }

    console.log('Deleting task:', id);

    this.taskService
      .deleteTask(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.status === 200) {
            this.showSuccess('Task deleted successfully!');
            this.refreshData();
          } else {
            this.showError(response.message || 'Failed to delete task');
          }
        },
        error: (error) => {
          this.showError(this.extractErrorMessage(error));
        }
      });
  }

  /**
   * Toggle task completion status
   */
  toggleComplete(task: Task): void {
    if (!task.id) {
      return;
    }

    console.log('Toggling task:', task.id, 'current state:', task.state);

    // If not done, mark as done
    if (task.state !== State.DONE) {
      this.taskService
        .markAsDone(task.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            if (response.status === 200) {
              this.showSuccess('Task marked as done!');
              this.refreshData();
            }
          },
          error: (error) => {
            this.showError(this.extractErrorMessage(error));
          }
        });
    } else {
      // If done, toggle back
      this.taskService
        .toggleState(task.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            if (response.status === 200) {
              this.showSuccess('Task status updated!');
              this.refreshData();
            }
          },
          error: (error) => {
            this.showError(this.extractErrorMessage(error));
          }
        });
    }
  }

  /**
   * Navigate to a specific page
   */
  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
      console.log('Navigating to page:', page);
      this.currentPage = page;
      this.loadTasks();
    }
  }

  /**
   * Get array of page numbers for pagination
   */
  get pages(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  /**
   * Check if there are any tasks
   */
  get hasTasks(): boolean {
    return this.tasks && this.tasks.length > 0;
  }

  /**
   * Check if a task is overdue
   */
  isOverdue(task: Task): boolean {
    if (!task.due_date || task.state === State.DONE) {
      return false;
    }
    const dueDate = new Date(task.due_date);
    return dueDate < this.today;
  }

  /**
   * Format date for display
   */
  formatDate(dateString?: string): string {
    if (!dateString) return 'No date';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }

  /**
   * Get state display class
   */
  getStateClass(state: string): string {
    return `state-${state.toLowerCase()}`;
  }

  /**
   * Get tag display class
   */
  getTagClass(tag?: string): string {
    if (!tag) return '';
    return `tag-${tag.toLowerCase()}`;
  }

  /**
   * Extract error message from error object
   */
  private extractErrorMessage(error: any): string {
    return error?.error?.message || error?.message || 'An error occurred';
  }

  /**
   * Show error message to user
   */
  private showError(message: string): void {
    this.errorMessage = message;
    this.successMessage = '';
    console.error('Error:', message);
    
    // Auto-clear after 5 seconds
    setTimeout(() => {
      this.errorMessage = '';
    }, 5000);
  }

  /**
   * Show success message to user
   */
  private showSuccess(message: string): void {
    this.successMessage = message;
    this.errorMessage = '';
    console.log('Success:', message);
    
    // Auto-clear after 3 seconds
    setTimeout(() => {
      this.successMessage = '';
    }, 3000);
  }

  /**
   * Track by function for ngFor optimization
   */
  trackByTaskId(index: number, task: Task): number {
    return task.id || index;
  }
}