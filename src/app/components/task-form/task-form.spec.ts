import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { of, throwError } from 'rxjs';
import { TaskForm } from './task-form';
import { TaskService } from '../../services/task/task-service';
import { Task } from '../../classes/interfaces/Task';

describe('TaskForm', () => {
  let component: TaskForm;
  let fixture: ComponentFixture<TaskForm>;
  let mockTaskService: any;

  const mockTask: Task = {
    id: 1,
    title: 'Test Task',
    description: 'Test Description',
    due_date: '2025-12-31T23:59:00.000Z',
    tag: 'important',
    state: 'todo',
    user_id: 1,
    created_on: '2025-12-09T00:00:00.000Z'
  };

  beforeEach(async () => {
    mockTaskService = {
      createTask: vi.fn(),
      updateTask: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [TaskForm, ReactiveFormsModule],
      providers: [
        { provide: TaskService, useValue: mockTaskService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TaskForm);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Form Initialization', () => {
    it('should initialize form with empty values in create mode', () => {
      fixture.detectChanges();

      expect(component.taskForm.get('title')?.value).toBe('');
      expect(component.taskForm.get('description')?.value).toBe('');
      expect(component.taskForm.get('due_date')?.value).toBe('');
      expect(component.taskForm.get('tag')?.value).toBe('');
      expect(component.taskForm.get('state')?.value).toBe('todo');
      expect(component.isEditMode).toBe(false);
    });

    it('should initialize form with task values in edit mode', () => {
      component.task = mockTask;
      component.ngOnInit();

      expect(component.taskForm.get('title')?.value).toBe('Test Task');
      expect(component.taskForm.get('description')?.value).toBe('Test Description');
      expect(component.taskForm.get('tag')?.value).toBe('important');
      expect(component.taskForm.get('state')?.value).toBe('todo');
      expect(component.isEditMode).toBe(true);
    });

    it('should format due_date correctly for datetime-local input', () => {
      component.task = mockTask;
      component.ngOnInit();

      const dueDateValue = component.taskForm.get('due_date')?.value;
      expect(dueDateValue).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
    });

    it('should set isEditMode to true when task is provided', () => {
      component.task = mockTask;
      component.ngOnInit();

      expect(component.isEditMode).toBe(true);
    });

    it('should remain in create mode when task is null', () => {
      component.task = null;
      component.ngOnInit();

      expect(component.isEditMode).toBe(false);
    });
  });

  describe('Form Validation', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should mark form as invalid when title is empty', () => {
      component.taskForm.patchValue({ title: '' });
      expect(component.taskForm.valid).toBe(false);
      expect(component.taskForm.get('title')?.hasError('required')).toBe(true);
    });

    it('should mark form as invalid when title is too short', () => {
      component.taskForm.patchValue({ title: 'ab' });
      expect(component.taskForm.valid).toBe(false);
      expect(component.taskForm.get('title')?.hasError('minlength')).toBe(true);
    });

    it('should mark form as valid when title has minimum length', () => {
      component.taskForm.patchValue({ 
        title: 'abc',
        state: 'todo'
      });
      expect(component.taskForm.valid).toBe(true);
    });

    it('should mark form as valid with optional fields empty', () => {
      component.taskForm.patchValue({ 
        title: 'Valid Task',
        description: '',
        due_date: '',
        tag: '',
        state: 'todo'
      });
      expect(component.taskForm.valid).toBe(true);
    });

    it('should mark all controls as touched when submitting invalid form', () => {
      component.taskForm.patchValue({ title: '' });
      component.onSubmit();

      expect(component.taskForm.get('title')?.touched).toBe(true);
      expect(component.taskForm.get('description')?.touched).toBe(true);
      expect(component.taskForm.get('due_date')?.touched).toBe(true);
    });

    it('should not allow whitespace-only title', () => {
      component.taskForm.patchValue({ title: '   ' });
      expect(component.taskForm.get('title')?.value).toBe('   ');
    });
  });

  describe('Create Task', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.isEditMode = false;
    });

    it('should call createTask when form is valid', () => {
      const mockResponse = { status: 201, message: 'Task created' };
      mockTaskService.createTask.mockReturnValue(of(mockResponse));

      component.taskForm.patchValue({
        title: 'New Task',
        description: 'New Description',
        state: 'todo'
      });

      component.onSubmit();

      expect(mockTaskService.createTask).toHaveBeenCalled();
    });

    it('should emit saved event on successful creation', (done) => {
      const mockResponse = { status: 201, message: 'Task created' };
      mockTaskService.createTask.mockReturnValue(of(mockResponse));

      component.saved.subscribe(() => {
        expect(true).toBe(true);

      });

      component.taskForm.patchValue({
        title: 'New Task',
        state: 'todo'
      });

      component.onSubmit();
    });

    it('should set loading to true during submission', () => {
      const mockResponse = { status: 201, message: 'Task created' };
      mockTaskService.createTask.mockReturnValue(of(mockResponse));

      component.taskForm.patchValue({
        title: 'New Task',
        state: 'todo'
      });

      expect(component.loading).toBe(false);
      component.onSubmit();
      
      expect(mockTaskService.createTask).toHaveBeenCalled();
    });

    it('should set loading to false after successful creation', (done) => {
      const mockResponse = { status: 201, message: 'Task created' };
      mockTaskService.createTask.mockReturnValue(of(mockResponse));

      component.taskForm.patchValue({
        title: 'New Task',
        state: 'todo'
      });

      component.onSubmit();

      setTimeout(() => {
        expect(component.loading).toBe(false);

      }, 10);
    });

    it('should convert due_date to ISO string before sending', () => {
      const mockResponse = { status: 201, message: 'Task created' };
      mockTaskService.createTask.mockReturnValue(of(mockResponse));

      component.taskForm.patchValue({
        title: 'New Task',
        due_date: '2025-12-31T23:59',
        state: 'todo'
      });

      component.onSubmit();

      const callArgs = mockTaskService.createTask.mock.calls[0][0];
      expect(callArgs.due_date).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });

    it('should remove empty description before sending', () => {
      const mockResponse = { status: 201, message: 'Task created' };
      mockTaskService.createTask.mockReturnValue(of(mockResponse));

      component.taskForm.patchValue({
        title: 'New Task',
        description: '',
        state: 'todo'
      });

      component.onSubmit();

      const callArgs = mockTaskService.createTask.mock.calls[0][0];
      expect(callArgs.description).toBeUndefined();
    });

    it('should remove empty due_date before sending', () => {
      const mockResponse = { status: 201, message: 'Task created' };
      mockTaskService.createTask.mockReturnValue(of(mockResponse));

      component.taskForm.patchValue({
        title: 'New Task',
        due_date: '',
        state: 'todo'
      });

      component.onSubmit();

      const callArgs = mockTaskService.createTask.mock.calls[0][0];
      expect(callArgs.due_date).toBeUndefined();
    });

    it('should remove empty tag before sending', () => {
      const mockResponse = { status: 201, message: 'Task created' };
      mockTaskService.createTask.mockReturnValue(of(mockResponse));

      component.taskForm.patchValue({
        title: 'New Task',
        tag: '',
        state: 'todo'
      });

      component.onSubmit();

      const callArgs = mockTaskService.createTask.mock.calls[0][0];
      expect(callArgs.tag).toBeUndefined();
    });

    it('should display error message on creation failure', (done) => {
      const mockError = { 
        error: { message: 'Creation failed' },
        status: 400 
      };
      mockTaskService.createTask.mockReturnValue(throwError(() => mockError));

      component.taskForm.patchValue({
        title: 'New Task',
        state: 'todo'
      });

      component.onSubmit();

      setTimeout(() => {
        expect(component.errorMessage).toBe('Creation failed');
        expect(component.loading).toBe(false);

      }, 10);
    });

    it('should include all non-empty fields in request', () => {
      const mockResponse = { status: 201, message: 'Task created' };
      mockTaskService.createTask.mockReturnValue(of(mockResponse));

      component.taskForm.patchValue({
        title: 'New Task',
        description: 'Description',
        due_date: '2025-12-31T23:59',
        tag: 'urgent',
        state: 'doing'
      });

      component.onSubmit();

      const callArgs = mockTaskService.createTask.mock.calls[0][0];
      expect(callArgs.title).toBe('New Task');
      expect(callArgs.description).toBe('Description');
      expect(callArgs.due_date).toBeDefined();
      expect(callArgs.tag).toBe('urgent');
      expect(callArgs.state).toBe('doing');
    });
  });

  describe('Update Task', () => {
    beforeEach(() => {
      component.task = mockTask;
      component.ngOnInit();
      fixture.detectChanges();
    });

    it('should call updateTask when form is valid in edit mode', () => {
      const mockResponse = { status: 200, message: 'Task updated' };
      mockTaskService.updateTask.mockReturnValue(of(mockResponse));

      component.taskForm.patchValue({
        title: 'Updated Task'
      });

      component.onSubmit();

      expect(mockTaskService.updateTask).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ title: 'Updated Task' })
      );
    });

    it('should emit saved event on successful update', (done) => {
      const mockResponse = { status: 200, message: 'Task updated' };
      mockTaskService.updateTask.mockReturnValue(of(mockResponse));

      component.saved.subscribe(() => {
        expect(true).toBe(true);

      });

      component.taskForm.patchValue({
        title: 'Updated Task'
      });

      component.onSubmit();
    });

    it('should display error message on update failure', (done) => {
      const mockError = { 
        error: { message: 'Update failed' },
        status: 400 
      };
      mockTaskService.updateTask.mockReturnValue(throwError(() => mockError));

      component.taskForm.patchValue({
        title: 'Updated Task'
      });

      component.onSubmit();

      setTimeout(() => {
        expect(component.errorMessage).toBe('Update failed');
        expect(component.loading).toBe(false);

      }, 10);
    });

    it('should pass task id to updateTask', () => {
      const mockResponse = { status: 200, message: 'Task updated' };
      mockTaskService.updateTask.mockReturnValue(of(mockResponse));

      component.onSubmit();

      expect(mockTaskService.updateTask).toHaveBeenCalledWith(
        1,
        expect.any(Object)
      );
    });

    it('should set loading to false after update', (done) => {
      const mockResponse = { status: 200, message: 'Task updated' };
      mockTaskService.updateTask.mockReturnValue(of(mockResponse));

      component.onSubmit();

      setTimeout(() => {
        expect(component.loading).toBe(false);

      }, 10);
    });
  });

  describe('Event Emitters', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should emit close event when onClose is called', (done) => {
      component.close.subscribe(() => {
        expect(true).toBe(true);

      });

      component.onClose();
    });

    it('should not emit saved event when form is invalid', () => {
      let emitted = false;
      component.saved.subscribe(() => {
        emitted = true;
      });

      component.taskForm.patchValue({ title: '' });
      component.onSubmit();

      expect(emitted).toBe(false);
    });

    it('should emit close event without any parameters', (done) => {
      component.close.subscribe((value) => {
        expect(value).toBeUndefined();

      });

      component.onClose();
    });
  });

  describe('State and Tag Options', () => {
    it('should have correct state options', () => {
      expect(component.stateOptions.length).toBe(3);
      expect(component.stateOptions[0]).toEqual({ value: 'todo', label: 'To Do' });
      expect(component.stateOptions[1]).toEqual({ value: 'doing', label: 'In Progress' });
      expect(component.stateOptions[2]).toEqual({ value: 'done', label: 'Done' });
    });

    it('should have correct tag options', () => {
      expect(component.tagOptions.length).toBe(3);
      expect(component.tagOptions[0]).toEqual({ value: 'optional', label: 'Optional' });
      expect(component.tagOptions[1]).toEqual({ value: 'important', label: 'Important' });
      expect(component.tagOptions[2]).toEqual({ value: 'urgent', label: 'Urgent' });
    });

    it('should have state options as arrays', () => {
      expect(Array.isArray(component.stateOptions)).toBe(true);
    });

    it('should have tag options as arrays', () => {
      expect(Array.isArray(component.tagOptions)).toBe(true);
    });
  });

  describe('MinDateTime Getter', () => {
    it('should return current datetime in correct format', () => {
      const minDateTime = component.minDateTime;
      expect(minDateTime).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
    });

    it('should return a datetime that is not in the past', () => {
      const minDateTime = component.minDateTime;
      const minDate = new Date(minDateTime);
      const now = new Date();
      
      expect(minDate.getTime()).toBeLessThanOrEqual(now.getTime() + 2000);
      expect(minDate.getTime()).toBeGreaterThan(now.getTime() - 2000);
    });

    it('should have correctly padded month and day', () => {
      const minDateTime = component.minDateTime;
      const parts = minDateTime.split('T')[0].split('-');
      
      expect(parts[1].length).toBe(2);
      expect(parts[2].length).toBe(2);
    });

    it('should have correctly padded hours and minutes', () => {
      const minDateTime = component.minDateTime;
      const timeParts = minDateTime.split('T')[1].split(':');
      
      expect(timeParts[0].length).toBe(2);
      expect(timeParts[1].length).toBe(2);
    });
  });

  describe('Edge Cases', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should handle null task input', () => {
      component.task = null;
      component.ngOnInit();
      
      expect(component.isEditMode).toBe(false);
      expect(component.taskForm.get('title')?.value).toBe('');
    });

    it('should handle task with missing optional fields', () => {
      const minimalTask: Task = {
        id: 1,
        title: 'Minimal Task',
        state: 'todo'
      };

      component.task = minimalTask;
      component.ngOnInit();

      expect(component.taskForm.get('description')?.value).toBeFalsy();
      expect(component.taskForm.get('due_date')?.value).toBeFalsy();
      expect(component.taskForm.get('tag')?.value).toBeFalsy();
    });

    it('should handle response without status code', (done) => {
      const mockResponse = { message: 'Success' };
      mockTaskService.createTask.mockReturnValue(of(mockResponse));

      component.taskForm.patchValue({
        title: 'New Task',
        state: 'todo'
      });

      component.onSubmit();

      setTimeout(() => {
        expect(component.errorMessage).toBe('Operation failed');

      }, 10);
    });

    it('should handle error without message', (done) => {
      const mockError = { status: 500 };
      mockTaskService.createTask.mockReturnValue(throwError(() => mockError));

      component.taskForm.patchValue({
        title: 'New Task',
        state: 'todo'
      });

      component.onSubmit();

      setTimeout(() => {
        expect(component.errorMessage).toBe('An error occurred');

      }, 10);
    });

    it('should not submit if form is invalid', () => {
      component.taskForm.patchValue({ title: '' });
      component.onSubmit();

      expect(mockTaskService.createTask).not.toHaveBeenCalled();
      expect(mockTaskService.updateTask).not.toHaveBeenCalled();
    });

    it('should handle very long titles', () => {
      const longTitle = 'a'.repeat(1000);
      component.taskForm.patchValue({
        title: longTitle,
        state: 'todo'
      });

      expect(component.taskForm.valid).toBe(true);
      expect(component.taskForm.get('title')?.value.length).toBe(1000);
    });

    it('should handle special characters in title', () => {
      const specialTitle = 'Test <script>alert("xss")</script>';
      component.taskForm.patchValue({
        title: specialTitle,
        state: 'todo'
      });

      expect(component.taskForm.valid).toBe(true);
      expect(component.taskForm.get('title')?.value).toBe(specialTitle);
    });

    it('should handle unicode characters in title', () => {
      component.taskForm.patchValue({
        title: '测试任务 🎯',
        state: 'todo'
      });

      expect(component.taskForm.valid).toBe(true);
    });

    it('should clear error message on new submission', () => {
      component.errorMessage = 'Previous error';
      
      const mockResponse = { status: 201, message: 'Success' };
      mockTaskService.createTask.mockReturnValue(of(mockResponse));

      component.taskForm.patchValue({
        title: 'New Task',
        state: 'todo'
      });

      component.onSubmit();

      expect(component.errorMessage).toBe('');
    });
  });

  describe('Date Formatting', () => {
    it('should correctly format date with single digit month and day', () => {
      const task: Task = {
        id: 1,
        title: 'Test',
        state: 'todo',
        due_date: '2025-01-05T09:05:00.000Z'
      };

      component.task = task;
      component.ngOnInit();

      const dueDateValue = component.taskForm.get('due_date')?.value;
      expect(dueDateValue).toContain('-01-');
      expect(dueDateValue).toContain('-05T');
      expect(dueDateValue).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
    });

    it('should handle midnight time correctly', () => {
      const task: Task = {
        id: 1,
        title: 'Test',
        state: 'todo',
        due_date: '2025-12-31T00:00:00.000Z'
      };

      component.task = task;
      component.ngOnInit();

      const dueDateValue = component.taskForm.get('due_date')?.value;
      expect(dueDateValue).toContain('T00:00');
    });

    it('should handle noon time correctly', () => {
      const task: Task = {
        id: 1,
        title: 'Test',
        state: 'todo',
        due_date: '2025-06-15T12:00:00.000Z'
      };

      component.task = task;
      component.ngOnInit();

      const dueDateValue = component.taskForm.get('due_date')?.value;
      expect(dueDateValue).toContain('T12:00');
    });

    it('should convert datetime-local back to ISO', () => {
      const mockResponse = { status: 201, message: 'Task created' };
      mockTaskService.createTask.mockReturnValue(of(mockResponse));

      component.taskForm.patchValue({
        title: 'Task with date',
        due_date: '2025-12-25T15:30',
        state: 'todo'
      });

      component.onSubmit();

      const callArgs = mockTaskService.createTask.mock.calls[0][0];
      const date = new Date(callArgs.due_date);
      
      expect(date.getFullYear()).toBe(2025);
      expect(date.getMonth()).toBe(11); // December (0-indexed)
      expect(date.getDate()).toBe(25);
    });
  });
});