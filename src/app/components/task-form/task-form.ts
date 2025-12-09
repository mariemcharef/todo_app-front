import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Task } from '../../classes/interfaces/Task';
import { TaskService } from '../../services/task/task-service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-task-form',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './task-form.html',
  styleUrl: './task-form.css',
})
export class TaskForm implements OnInit {
  @Input() task: Task | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  taskForm: FormGroup;
  loading = false;
  errorMessage = '';
  isEditMode = false;


  stateOptions = [
    { value: 'todo', label: 'To Do' },
    { value: 'doing', label: 'In Progress' },
    { value: 'done', label: 'Done' }
  ];

  tagOptions = [
    { value: 'optional', label: 'Optional' },
    { value: 'important', label: 'Important' },
    { value: 'urgent', label: 'Urgent' }
  ];

  constructor(
    private fb: FormBuilder,
    private taskService: TaskService
  ) {
    this.taskForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      description: [''],
      due_date: [''],
      tag: [''],
      state: ['todo'] 
    });
  }

  ngOnInit(): void {
    if (this.task) {
      this.isEditMode = true;
      
      const formValue = { ...this.task };
      if (formValue.due_date) {
        const date = new Date(formValue.due_date);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        formValue.due_date = `${year}-${month}-${day}T${hours}:${minutes}`;
      }
      
      this.taskForm.patchValue(formValue);
    }
  }

  onSubmit(): void {
    if (this.taskForm.invalid) {
      Object.keys(this.taskForm.controls).forEach(key => {
        this.taskForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    const taskData = { ...this.taskForm.value };
    
    if (taskData.due_date) {
      taskData.due_date = new Date(taskData.due_date).toISOString();
    }

    if (!taskData.description) delete taskData.description;
    if (!taskData.due_date) delete taskData.due_date;
    if (!taskData.tag) delete taskData.tag;

    const request = this.isEditMode
      ? this.taskService.updateTask(this.task!.id!, taskData)
      : this.taskService.createTask(taskData);

    request.subscribe({
      next: (response) => {
        if (response.status === 200 || response.status === 201) {
          this.saved.emit();
        } else {
          this.errorMessage = response.message || 'Operation failed';
        }
        this.loading = false;
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'An error occurred';
        this.loading = false;
      }
    });
  }

  onClose(): void {
    this.close.emit();
  }

  get minDateTime(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }
}