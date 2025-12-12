import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, tap, catchError, throwError } from 'rxjs';
import { HttpParams } from '@angular/common/http';

import { State } from '../../classes/enums/State';
import { Tag } from '../../classes/enums/Tag';
import { environment } from '../../../environments/environment';
import { BaseResponse, PagedResponse } from '../../classes/interfaces/Response';
import { Task, TaskCreate, TaskStats } from '../../classes/interfaces/Task';
import { HttpClientService } from '../HttpClient/http-client-service';

export interface TaskFilters {
  page_size?: number;
  page_number?: number;
  state?: State | string;
  tag?: Tag | string;
  search?: string;
  sort_by?: 'created_on' | 'due_date' | 'title' | 'state';
  sort_order?: 'asc' | 'desc';
}

@Injectable({
  providedIn: 'root',
})
export class TaskService {
  private readonly apiUrl = `${environment.apiUrl}/task`;
  
  private tasksUpdated = new BehaviorSubject<boolean>(false);
  public readonly tasksUpdated$ = this.tasksUpdated.asObservable();

  private tasksCache = new Map<number, Task>();

  constructor(private http: HttpClientService) {}


  private notifyTasksUpdated(): void {
    this.tasksUpdated.next(true);
  }

  private buildParams(filters: TaskFilters = {}): HttpParams {
    let params = new HttpParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, value.toString());
      }
    });
    
    return params;
  }


  private handleError(operation: string) {
    return (error: any): Observable<never> => {
      
      const errorMessage = error?.error?.message || error?.message || `${operation} failed`;
      
      return throwError(() => ({
        message: errorMessage,
        originalError: error
      }));
    };
  }
  
  getTasks(filters: TaskFilters = {}): Observable<PagedResponse<Task>> {
    const params = this.buildParams(filters);
    
    return this.http.get<PagedResponse<Task>>(this.apiUrl, params).pipe(
      tap(response => {

        if (response.status === 200 && response.list) {
          response.list.forEach(task => {
            if (task.id) {
              this.tasksCache.set(task.id, task);
            }
          });
        }
      }),
      catchError(this.handleError('Get tasks'))
    );
  }

  getTask(id: number): Observable<Task & BaseResponse> {
    return this.http.get<Task & BaseResponse>(`${this.apiUrl}/${id}`).pipe(
      tap(response => {
        if (response.status === 200 && response.id) {
          this.tasksCache.set(response.id, response as Task);
        }
      }),
      catchError(this.handleError(`Get task ${id}`))
    );
  }

  createTask(task: TaskCreate): Observable<Task & BaseResponse> {
    return this.http.post<Task & BaseResponse>(this.apiUrl, task).pipe(
      tap(response => {
        if (response.status === 200 || response.status === 201) {
          this.notifyTasksUpdated();

          if (response.id) {
            this.tasksCache.set(response.id, response as Task);
          }
        }
      }),
      catchError(this.handleError('Create task'))
    );
  }

  updateTask(id: number, task: Partial<TaskCreate>): Observable<Task & BaseResponse> {
    return this.http.put<Task & BaseResponse>(`${this.apiUrl}/${id}`, task).pipe(
      tap(response => {
        if (response.status === 200) {
          this.notifyTasksUpdated();
          

          if (response.id) {
            this.tasksCache.set(response.id, response as Task);
          }
        }
      }),
      catchError(this.handleError(`Update task ${id}`))
    );
  }


  deleteTask(id: number): Observable<BaseResponse> {
    return this.http.delete<BaseResponse>(`${this.apiUrl}/${id}`).pipe(
      tap(response => {
        if (response.status === 200) {
          this.notifyTasksUpdated();
          
          this.tasksCache.delete(id);
        }
      }),
      catchError(this.handleError(`Delete task ${id}`))
    );
  }

  markAsDone(id: number): Observable<Task & BaseResponse> {
    return this.http.put<Task & BaseResponse>(`${this.apiUrl}/mark_as_done/${id}`, {}).pipe(
      tap(response => {
        if (response.status === 200) {
          this.notifyTasksUpdated();
          

          if (response.id) {
            this.tasksCache.set(response.id, response as Task);
          }
        }
      }),
      catchError(this.handleError(`Mark task ${id} as done`))
    );
  }

  toggleState(id: number): Observable<Task & BaseResponse> {
    return this.http.put<Task & BaseResponse>(`${this.apiUrl}/toggle_state/${id}`, {}).pipe(
      tap(response => {
        if (response.status === 200) {
          this.notifyTasksUpdated();
          
         
          if (response.id) {
            this.tasksCache.set(response.id, response as Task);
          }
        }
      }),
      catchError(this.handleError(`Toggle task ${id} state`))
    );
  }
  getStats(): Observable<{ status: number; message: string; data: TaskStats }> {
    return this.http.get<{ status: number; message: string; data: TaskStats }>(
      `${this.apiUrl}/stats/summary`
    ).pipe(
      catchError(this.handleError('Get task statistics'))
    );
  }

  getTaskFromCache(id: number): Task | undefined {
    return this.tasksCache.get(id);
  }

  clearCache(): void {
    this.tasksCache.clear();
  }

  
}