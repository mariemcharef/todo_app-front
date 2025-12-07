import { State } from "../enums/State";
import { Tag } from "../enums/Tag";

export interface Task {
  id?: number;
  title: string;
  description?: string;
  due_date?: string;
  tag?: string;
  state: string;
  user_id?: number;
  created_on?: string;
  updated_on?: string;
  message?: string | null;
  status?: number | null;
}

export interface TaskCreate {
  title: string;
  description?: string;
  due_date?: string;
  tag?: string;
  state?: string;
}

export interface TaskStats {
  total: number;
  todo: number;
  doing: number;
  done: number;
  overdue: number;
  completion_rate: number;
}