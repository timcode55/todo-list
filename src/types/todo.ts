export interface Todo {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface TodoFormData {
  title: string;
  description: string;
}

export interface EmailFormData {
  email: string;
  subject: string;
  message: string;
}
