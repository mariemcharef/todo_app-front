import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TaskService, TaskFilters } from './task-service';
import { HttpClientService } from '../HttpClient/http-client-service';
import { Task, TaskCreate, TaskStats } from '../../classes/interfaces/Task';
import { State } from '../../classes/enums/State';
import { Tag } from '../../classes/enums/Tag';
import { PagedResponse, BaseResponse } from '../../classes/interfaces/Response';
import { environment } from '../../../environments/environment';

describe('TaskService', () => {
  let service: TaskService;
  let httpMock: HttpTestingController;
  let httpClientService: HttpClientService;
  const apiUrl = `${environment.apiUrl}/task`;

  const mockTask: Task = {
    id: 1,
    title: 'Test Task',
    description: 'Test Description',
    state: State.TODO,
    tag: Tag.URGENT,
    due_date: '2025-12-31',
    created_on: '2025-12-01',
    updated_on: '2025-12-01'
  };

  const mockTaskCreate: TaskCreate = {
    title: 'New Task',
    description: 'New Description',
    state: State.TODO,
    tag: Tag.IMPORTANT,
    due_date: '2025-12-31'
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [TaskService, HttpClientService]
    });
    
    service = TestBed.inject(TaskService);
    httpMock = TestBed.inject(HttpTestingController);
    httpClientService = TestBed.inject(HttpClientService);
  });

  afterEach(() => {
    httpMock.verify();
    service.clearCache();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getTasks', () => {
    it('should fetch tasks with default filters', (done) => {
      const mockResponse: PagedResponse<Task> = {
        status: 200,
        message: 'Success',
        list: [mockTask],
        total_pages: 1,
        page_number: 1,
        page_size: 10,
        total_records: 0
      };

      service.getTasks().subscribe(response => {
        expect(response.status).toBe(200);
        expect(response.list.length).toBe(1);
        expect(response.list[0]).toEqual(mockTask);
        expect(service.getTaskFromCache(1)).toEqual(mockTask);
        
      });

      const req = httpMock.expectOne(apiUrl);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should fetch tasks with filters', (done) => {
      const filters: TaskFilters = {
        page_size: 20,
        page_number: 2,
        state: State.DONE,
        tag: Tag.URGENT,
        search: 'test',
        sort_by: 'created_on',
        sort_order: 'desc'
      };

      const mockResponse: PagedResponse<Task> = {
        status: 200,
        message: 'Success',
        list: [mockTask],
        total_pages: 1,
        page_number: 2,
        page_size: 20,
        total_records: 0
      };

      service.getTasks(filters).subscribe(response => {
        expect(response.list.length).toBe(1);
        
      });

      const req = httpMock.expectOne(request => request.url === apiUrl);
      expect(req.request.params.get('page_size')).toBe('20');
      expect(req.request.params.get('state')).toBe(State.DONE);
      req.flush(mockResponse);
    });

    it('should handle error when fetching tasks', (done) => {
      service.getTasks().subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.message).toBeTruthy();
          
        }
      });

      const req = httpMock.expectOne(apiUrl);
      req.flush({ message: 'Error fetching tasks' }, { status: 500, statusText: 'Server Error' });
    });
  });

  describe('getTask', () => {
    it('should fetch a single task by id', (done) => {
      const mockResponse: Task & BaseResponse = {
        ...mockTask,
        status: 200,
        message: 'Success'
      };

      service.getTask(1).subscribe(response => {
        expect(response.id).toBe(1);
        expect(response.title).toBe('Test Task');
        expect(service.getTaskFromCache(1)).toBeTruthy();
        
      });

      const req = httpMock.expectOne(`${apiUrl}/1`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should handle error when fetching task', (done) => {
      service.getTask(999).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.message).toBeTruthy();
          
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/999`);
      req.flush({ message: 'Task not found' }, { status: 404, statusText: 'Not Found' });
    });
  });

  describe('createTask', () => {
    it('should create a new task', (done) => {
      const mockResponse: Task & BaseResponse = {
        ...mockTask,
        status: 201,
        message: 'Task created'
      };

      service.tasksUpdated$.subscribe(updated => {
        if (updated) {
          expect(updated).toBe(true);
        }
      });

      service.createTask(mockTaskCreate).subscribe(response => {
        expect(response.status).toBe(201);
        expect(response.id).toBe(1);
        expect(service.getTaskFromCache(1)).toBeTruthy();
        
      });

      const req = httpMock.expectOne(apiUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(mockTaskCreate);
      req.flush(mockResponse);
    });

    it('should handle error when creating task', (done) => {
      service.createTask(mockTaskCreate).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.message).toBeTruthy();

        }
      });

      const req = httpMock.expectOne(apiUrl);
      req.flush({ message: 'Validation error' }, { status: 400, statusText: 'Bad Request' });
    });
  });

  describe('updateTask', () => {
    it('should update an existing task', (done) => {
      const updateData: Partial<TaskCreate> = { title: 'Updated Task' };
      const mockResponse: Task & BaseResponse = {
        ...mockTask,
        title: 'Updated Task',
        status: 200,
        message: 'Task updated'
      };

      service.updateTask(1, updateData).subscribe(response => {
        expect(response.status).toBe(200);
        expect(response.title).toBe('Updated Task');
      });

      const req = httpMock.expectOne(`${apiUrl}/1`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(updateData);
      req.flush(mockResponse);
    });
  });

  describe('deleteTask', () => {
    it('should delete a task', (done) => {
      const mockResponse: BaseResponse = {
        status: 200,
        message: 'Task deleted'
      };

      service['tasksCache'].set(1, mockTask);
      expect(service.getTaskFromCache(1)).toBeTruthy();

      service.deleteTask(1).subscribe(response => {
        expect(response.status).toBe(200);
        expect(service.getTaskFromCache(1)).toBeUndefined();

      });

      const req = httpMock.expectOne(`${apiUrl}/1`);
      expect(req.request.method).toBe('DELETE');
      req.flush(mockResponse);
    });
  });

  describe('markAsDone', () => {
    it('should mark a task as done', (done) => {
      const mockResponse: Task & BaseResponse = {
        ...mockTask,
        state: State.DONE,
        status: 200,
        message: 'Task marked as done'
      };

      service.markAsDone(1).subscribe(response => {
        expect(response.status).toBe(200);
        expect(response.state).toBe(State.DONE);

      });

      const req = httpMock.expectOne(`${apiUrl}/mark_as_done/1`);
      expect(req.request.method).toBe('PUT');
      req.flush(mockResponse);
    });
  });

  describe('toggleState', () => {
    it('should toggle task state', (done) => {
      const mockResponse: Task & BaseResponse = {
        ...mockTask,
        state: State.DOING,
        status: 200,
        message: 'Task state toggled'
      };

      service.toggleState(1).subscribe(response => {
        expect(response.status).toBe(200);
        expect(response.state).toBe(State.DOING);
 
      });

      const req = httpMock.expectOne(`${apiUrl}/toggle_state/1`);
      expect(req.request.method).toBe('PUT');
      req.flush(mockResponse);
    });
  });

  describe('getStats', () => {
    it('should fetch task statistics', async () => {
      const mockStats: TaskStats = {
        total: 10,
        done: 5,
        doing: 3,
        todo: 2,
        overdue: 1,
        completion_rate: 50
      };

      const mockResponse = {
        status: 200,
        message: 'Success',
        data: mockStats
      };

      service.getStats().subscribe(response => {
        expect(response.status).toBe(200);
        expect(response.data.total).toBe(10);
        expect(response.data.done).toBe(5);
        expect(response.data.overdue).toBe(1);
        expect(response.data.completion_rate).toBe(50);
      });

      const req = httpMock.expectOne(`${apiUrl}/stats/summary`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('Cache Management', () => {
    it('should store tasks in cache', async () => {
      const mockResponse: PagedResponse<Task> = {
        status: 200,
        message: 'Success',
        list: [mockTask],
        page_number: 1,
        page_size: 10,
        total_pages: 0,
        total_records: 0
      };

      service.getTasks().subscribe(() => {
        expect(service.getTaskFromCache(1)).toEqual(mockTask);
      });

      const req = httpMock.expectOne(apiUrl);
      req.flush(mockResponse);
    });

    it('should clear cache', () => {
      service['tasksCache'].set(1, mockTask);
      expect(service.getTaskFromCache(1)).toBeTruthy();
      
      service.clearCache();
      expect(service.getTaskFromCache(1)).toBeUndefined();
    });
  });

});

function fail(arg0: string): void {
  throw new Error('Function not implemented.');
}
