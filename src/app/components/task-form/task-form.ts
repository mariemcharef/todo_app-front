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

  constructor(
    private fb: FormBuilder,
    private taskService: TaskService
  ) {
    this.taskForm = this.fb.group({
      title: ['', [Validators.required]],
      description: [''],
      completed: [false]
    });
  }

  ngOnInit(): void {
    if (this.task) {
      this.isEditMode = true;
      this.taskForm.patchValue(this.task);
    }
  }

  onSubmit(): void {
    if (this.taskForm.invalid) {
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    const taskData = this.taskForm.value;

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
}