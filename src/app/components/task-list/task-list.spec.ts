import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { of, throwError } from 'rxjs';
import { TaskList } from './task-list';
import { TaskService } from '../../services/task/task-service';
import { Task, TaskStats } from '../../classes/interfaces/Task';
import { State } from '../../classes/enums/State';

describe('TaskList', () => {
  let component: TaskList;
  let fixture: ComponentFixture<TaskList>;
  let mockTaskService: any;

  const mockTask: Task = {
    id: 1,
    title: 'Test Task',
    description: 'Test Description',
    due_date: '2025-12-31T23:59:00',
    tag: 'important',
    state: 'todo',
    user_id: 1,
    created_on: '2025-12-09T00:00:00'
  };

  const mockStats: TaskStats = {
    total: 10,
    todo: 3,
    doing: 4,
    done: 3,
    overdue: 1,
    completion_rate: 30
  };

 beforeEach(async () => {
  mockTaskService = {
    getTasks: vi.fn().mockReturnValue(
        of({
          status: 200,
          list: [],
          total_pages: 1,
          total_records: 0
        })
      ),
      getStats: vi.fn().mockReturnValue(
        of({
          status: 200,
          data: {
            total: 0,
            completed: 0,
            pending: 0
          }
        })
      ),
      deleteTask: vi.fn().mockReturnValue(of({ status: 200 })),
      toggleState: vi.fn().mockReturnValue(of({ status: 200 })),
      toggleComplete: vi.fn().mockReturnValue(of({ status: 200 }))
    };
    Object.defineProperty(window, "confirm", {
      value: vi.fn(),
      writable: true,
    });
    vi.spyOn(window, "confirm").mockReturnValue(true);

    await TestBed.configureTestingModule({
      imports: [TaskList],
      providers: [{ provide: TaskService, useValue: mockTaskService }]
    }).compileComponents();

    fixture = TestBed.createComponent(TaskList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });


  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Component Initialization', () => {
    it('should initialize with default values', () => {
      expect(component.tasks).toEqual([]);
      expect(component.loading).toBe(false);
      expect(component.statsLoading).toBe(false);
      expect(component.errorMessage).toBe('');
      expect(component.successMessage).toBe('');
      expect(component.currentPage).toBe(1);
      expect(component.pageSize).toBe(10);
      expect(component.totalPages).toBe(1);
      expect(component.totalRecords).toBe(0);
      expect(component.showModal).toBe(false);
      expect(component.editingTask).toBeNull();
    });

    it('should call refreshData on ngOnInit', () => {
      const mockResponse = {
        status: 200,
        list: [mockTask],
        total_pages: 1,
        total_records: 1
      };
      const mockStatsResponse = {
        status: 200,
        data: mockStats
      };

      mockTaskService.getTasks.mockReturnValue(of(mockResponse));
      mockTaskService.getStats.mockReturnValue(of(mockStatsResponse));

      component.ngOnInit();

      expect(mockTaskService.getTasks).toHaveBeenCalled();
      expect(mockTaskService.getStats).toHaveBeenCalled();
    });

    it('should have today date initialized', () => {
      expect(component.today).toBeInstanceOf(Date);
    });
  });

  describe('Loading Tasks', () => {
    it('should load tasks successfully', async () => {
      const mockResponse = {
        status: 200,
        list: [mockTask],
        total_pages: 5,
        total_records: 50
      };

      mockTaskService.getTasks.mockReturnValue(of(mockResponse));

      component.loadTasks();
      await fixture.whenStable();

      expect(component.tasks).toEqual([mockTask]);
      expect(component.totalPages).toBe(5);
      expect(component.totalRecords).toBe(50);
      expect(component.loading).toBe(false);
    });

    it('should set loading to true during task load', () => {
      const mockResponse = {
        status: 200,
        list: [],
        total_pages: 0,
        total_records: 0
      };

      mockTaskService.getTasks.mockReturnValue(of(mockResponse));

      component.loadTasks();

      expect(mockTaskService.getTasks).toHaveBeenCalledWith({
        page_number: 1,
        page_size: 10
      });
    });

    it('should handle empty task list', async () => {
      const mockResponse = {
        status: 200,
        list: [],
        total_pages: 0,
        total_records: 0
      };

      mockTaskService.getTasks.mockReturnValue(of(mockResponse));

      component.loadTasks();
      await fixture.whenStable();

      expect(component.tasks).toEqual([]);
      expect(component.totalPages).toBe(0);
      expect(component.totalRecords).toBe(0);
    });

    it('should handle error response with status', async () => {
      const mockResponse = {
        status: 400,
        message: 'Failed to load tasks'
      };

      mockTaskService.getTasks.mockReturnValue(of(mockResponse));

      component.loadTasks();
      await fixture.whenStable();

      expect(component.errorMessage).toBe('Failed to load tasks');
    });

    it('should handle getTasks error', async () => {
      const mockError = {
        error: { message: 'Network error' }
      };

      mockTaskService.getTasks.mockReturnValue(throwError(() => mockError));

      component.loadTasks();
      await fixture.whenStable();

      expect(component.errorMessage).toBe('Network error');
      expect(component.loading).toBe(false);
    });

    it('should pass current page and page size to getTasks', () => {
      const mockResponse = {
        status: 200,
        list: [],
        total_pages: 0,
        total_records: 0
      };

      mockTaskService.getTasks.mockReturnValue(of(mockResponse));

      component.currentPage = 3;
      component.pageSize = 20;
      component.loadTasks();

      expect(mockTaskService.getTasks).toHaveBeenCalledWith({
        page_number: 3,
        page_size: 20
      });
    });
  });

  describe('Loading Stats', () => {
    it('should load stats successfully', async () => {
      const mockResponse = {
        status: 200,
        data: mockStats
      };

      mockTaskService.getStats.mockReturnValue(of(mockResponse));

      component.loadStats();
      await fixture.whenStable();

      expect(component.stats.total).toBe(10);
      expect(component.stats.todo).toBe(3);
      expect(component.stats.doing).toBe(4);
      expect(component.stats.done).toBe(3);
      expect(component.stats.overdue).toBe(1);
      expect(component.stats.completion_rate).toBe(30);
      expect(component.statsLoading).toBe(false);
    });

    it('should handle getStats error silently', async () => {
      const mockError = { error: { message: 'Stats error' } };

      mockTaskService.getStats.mockReturnValue(throwError(() => mockError));

      component.loadStats();
      await fixture.whenStable();

      expect(component.statsLoading).toBe(false);
      expect(component.errorMessage).toBe('');
    });

    it('should handle stats with missing fields', async () => {
      const mockResponse = {
        status: 200,
        data: {
          total: 5,
          todo: 2
          // Missing other fields
        }
      };

      mockTaskService.getStats.mockReturnValue(of(mockResponse));

      component.loadStats();
      await fixture.whenStable();

      expect(component.stats.total).toBe(5);
      expect(component.stats.todo).toBe(2);
      expect(component.stats.doing).toBe(0);
      expect(component.stats.done).toBe(0);
      expect(component.stats.overdue).toBe(0);
      expect(component.stats.completion_rate).toBe(0);
    });
  });

  describe('Modal Operations', () => {
    it('should open create modal', () => {
      component.openCreateModal();

      expect(component.showModal).toBe(true);
      expect(component.editingTask).toBeNull();
    });

    it('should open edit modal with task', () => {
      component.openEditModal(mockTask);

      expect(component.showModal).toBe(true);
      expect(component.editingTask).toEqual(mockTask);
    });

    it('should create a copy of task when editing', () => {
      component.openEditModal(mockTask);

      expect(component.editingTask).not.toBe(mockTask);
      expect(component.editingTask).toEqual(mockTask);
    });

    it('should close modal', () => {
      component.showModal = true;
      component.editingTask = mockTask;

      component.closeModal();

      expect(component.showModal).toBe(false);
      expect(component.editingTask).toBeNull();
    });

    it('should handle task saved', () => {
      const mockTasksResponse = {
        status: 200,
        list: [mockTask],
        total_pages: 1,
        total_records: 1
      };
      const mockStatsResponse = {
        status: 200,
        data: mockStats
      };

      mockTaskService.getTasks.mockReturnValue(of(mockTasksResponse));
      mockTaskService.getStats.mockReturnValue(of(mockStatsResponse));

      component.showModal = true;
      component.onTaskSaved();

      expect(component.showModal).toBe(false);
      expect(component.successMessage).toBe('Task saved successfully!');
      expect(mockTaskService.getTasks).toHaveBeenCalled();
      expect(mockTaskService.getStats).toHaveBeenCalled();
    });
  });

  describe('Delete Task', () => {
    beforeEach(() => {
    });

    it('should not delete if user cancels confirmation', () => {
      vi.spyOn(window, 'confirm').mockReturnValue(false);

      component.deleteTask(1);
      fixture.detectChanges();

      expect(mockTaskService.deleteTask).not.toHaveBeenCalled();
    });


    it('should handle delete error with message', async () => {

      const mockResponse = {
        status: 400,
        message: 'Cannot delete task'
      };

      mockTaskService.deleteTask.mockReturnValue(of(mockResponse));

      component.deleteTask(1);
      await fixture.whenStable();

      expect(component.errorMessage).toBe('Cannot delete task');
    });

    it('should handle delete error without status', async () => {

      const mockError = {
        error: { message: 'Delete failed' }
      };

      mockTaskService.deleteTask.mockReturnValue(throwError(() => mockError));

      component.deleteTask(1);
      await fixture.whenStable();

      expect(component.errorMessage).toBe('Delete failed');
    });
  });

  describe('Toggle Task State', () => {
    it('should not toggle if task has no id', () => {
      const taskWithoutId: Task = { ...mockTask, id: undefined };

      component.toggleTaskState(taskWithoutId);

      expect(mockTaskService.toggleState).not.toHaveBeenCalled();
    });

    it('should handle toggle state error', async () => {
      const mockError = {
        error: { message: 'Toggle failed' }
      };

      mockTaskService.toggleState.mockReturnValue(throwError(() => mockError));

      component.toggleTaskState(mockTask);
      await fixture.whenStable();

      expect(component.errorMessage).toBe('Toggle failed');
    });
  });

 

  describe('Pagination', () => {
    beforeEach(() => {
      const mockResponse = {
        status: 200,
        list: [mockTask],
        total_pages: 5,
        total_records: 50
      };

      mockTaskService.getTasks.mockReturnValue(of(mockResponse));
    });

    it('should go to valid page', () => {
      component.totalPages = 5;
      component.currentPage = 1;

      component.goToPage(3);

      expect(component.currentPage).toBe(3);
      expect(mockTaskService.getTasks).toHaveBeenCalled();
    });

    it('should not go to page less than 1', () => {
      component.totalPages = 5;
      component.currentPage = 1;

      component.goToPage(0);

      expect(component.currentPage).toBe(1);
    });

    it('should not go to page greater than totalPages', () => {
      component.totalPages = 5;
      component.currentPage = 1;

      component.goToPage(10);

      expect(component.currentPage).toBe(1);
    });

    it('should not reload if already on the page', () => {
      component.totalPages = 5;
      component.currentPage = 3;

      mockTaskService.getTasks.mockClear();

      component.goToPage(3);

      expect(mockTaskService.getTasks).not.toHaveBeenCalled();
    });

    it('should generate correct pages array', () => {
      component.totalPages = 5;

      expect(component.pages).toEqual([1, 2, 3, 4, 5]);
    });

    it('should return empty array when no pages', () => {
      component.totalPages = 0;

      expect(component.pages).toEqual([]);
    });
  });

  describe('Helper Methods', () => {
    it('should detect if has tasks', () => {
      component.tasks = [];
      expect(component.hasTasks).toBe(false);

      component.tasks = [mockTask];
      expect(component.hasTasks).toBe(true);
    });

    it('should detect overdue tasks', () => {
      const overdueTask = {
        ...mockTask,
        due_date: '2020-01-01T00:00:00',
        state: 'todo'
      };

      expect(component.isOverdue(overdueTask)).toBe(true);
    });

    it('should not mark done tasks as overdue', () => {
      const overdueButDoneTask = {
        ...mockTask,
        due_date: '2020-01-01T00:00:00',
        state: 'done'
      };

      expect(component.isOverdue(overdueButDoneTask)).toBe(false);
    });

    it('should not mark tasks without due date as overdue', () => {
      const taskWithoutDate = {
        ...mockTask,
        due_date: undefined
      };

      expect(component.isOverdue(taskWithoutDate)).toBe(false);
    });

    it('should return correct state info for todo', () => {
      const info = component.getStateInfo('todo');

      expect(info.label).toBe('To Do');
      expect(info.icon).toBe('📋');
      expect(info.class).toBe('state-todo');
    });

    it('should return correct state info for doing', () => {
      const info = component.getStateInfo('doing');

      expect(info.label).toBe('In Progress');
      expect(info.icon).toBe('⚡');
      expect(info.class).toBe('state-doing');
    });

    it('should return correct state info for done', () => {
      const info = component.getStateInfo('done');

      expect(info.label).toBe('Done');
      expect(info.icon).toBe('✅');
      expect(info.class).toBe('state-done');
    });

    it('should return default info for unknown state', () => {
      const info = component.getStateInfo('unknown');

      expect(info.label).toBe('unknown');
      expect(info.icon).toBe('❓');
      expect(info.class).toBe('state-unknown');
    });

    it('should get next state correctly', () => {
      expect(component.getNextState('todo')).toBe('doing');
      expect(component.getNextState('doing')).toBe('done');
      expect(component.getNextState('done')).toBe('todo');
    });

    it('should return todo for unknown state', () => {
      expect(component.getNextState('unknown')).toBe('todo');
    });

    it('should format date correctly', () => {
      const formatted = component.formatDate('2025-12-31T23:59:00');

      expect(formatted).toContain('12/31/2025');
      expect(formatted).toContain(':');
    });

    it('should handle missing date', () => {
      expect(component.formatDate()).toBe('No date');
      expect(component.formatDate(undefined)).toBe('No date');
    });

    it('should get state class', () => {
      expect(component.getStateClass('todo')).toBe('state-todo');
      expect(component.getStateClass('DOING')).toBe('state-doing');
    });

    it('should get tag class', () => {
      expect(component.getTagClass('urgent')).toBe('tag-urgent');
      expect(component.getTagClass('IMPORTANT')).toBe('tag-important');
      expect(component.getTagClass()).toBe('');
      expect(component.getTagClass(undefined)).toBe('');
    });
  });

  describe('Message Management', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should show error message and clear after 5 seconds', () => {
      component['showError']('Test error');

      expect(component.errorMessage).toBe('Test error');
      expect(component.successMessage).toBe('');

      vi.advanceTimersByTime(5000);

      expect(component.errorMessage).toBe('');
    });

    it('should show success message and clear after 3 seconds', () => {
      component['showSuccess']('Test success');

      expect(component.successMessage).toBe('Test success');
      expect(component.errorMessage).toBe('');

      vi.advanceTimersByTime(3000);

      expect(component.successMessage).toBe('');
    });

    it('should clear opposite message type', () => {
      component.errorMessage = 'Error';
      component['showSuccess']('Success');

      expect(component.errorMessage).toBe('');
      expect(component.successMessage).toBe('Success');
    });
  });

  describe('Track By Function', () => {
    it('should track by task id', () => {
      const result = component.trackByTaskId(0, mockTask);

      expect(result).toBe(1);
    });

    it('should use index if no task id', () => {
      const taskWithoutId = { ...mockTask, id: undefined };
      const result = component.trackByTaskId(5, taskWithoutId);

      expect(result).toBe(5);
    });
  });

  describe('Refresh Data', () => {
    it('should refresh both tasks and stats', () => {
      const mockTasksResponse = {
        status: 200,
        list: [mockTask],
        total_pages: 1,
        total_records: 1
      };
      const mockStatsResponse = {
        status: 200,
        data: mockStats
      };

      mockTaskService.getTasks.mockReturnValue(of(mockTasksResponse));
      mockTaskService.getStats.mockReturnValue(of(mockStatsResponse));

      component.refreshData();

      expect(mockTaskService.getTasks).toHaveBeenCalled();
      expect(mockTaskService.getStats).toHaveBeenCalled();
    });

    it('should handle onRefresh', () => {
      const mockTasksResponse = {
        status: 200,
        list: [mockTask],
        total_pages: 1,
        total_records: 1
      };
      const mockStatsResponse = {
        status: 200,
        data: mockStats
      };

      mockTaskService.getTasks.mockReturnValue(of(mockTasksResponse));
      mockTaskService.getStats.mockReturnValue(of(mockStatsResponse));

      component.onRefresh();

      expect(mockTaskService.getTasks).toHaveBeenCalled();
      expect(mockTaskService.getStats).toHaveBeenCalled();
    });
  });

  describe('Component Cleanup', () => {
    it('should complete destroy$ subject on ngOnDestroy', () => {
      const nextSpy = vi.spyOn(component['destroy$'], 'next');
      const completeSpy = vi.spyOn(component['destroy$'], 'complete');

      component.ngOnDestroy();

      expect(nextSpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });
  });

  describe('Error Extraction', () => {
    it('should extract error message from error.error.message', () => {
      const error = {
        error: { message: 'Specific error' }
      };

      const message = component['extractErrorMessage'](error);

      expect(message).toBe('Specific error');
    });

    it('should extract error message from error.message', () => {
      const error = {
        message: 'General error'
      };

      const message = component['extractErrorMessage'](error);

      expect(message).toBe('General error');
    });

    it('should return default message for unknown error', () => {
      const message = component['extractErrorMessage']({});

      expect(message).toBe('An error occurred');
    });

    it('should handle null/undefined error', () => {
      expect(component['extractErrorMessage'](null)).toBe('An error occurred');
      expect(component['extractErrorMessage'](undefined)).toBe('An error occurred');
    });
  });
});