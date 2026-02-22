export type UserRole = 
  | 'super_admin' 
  | 'associate_admin' 
  | 'school_head' 
  | 'teacher' 
  | 'student' 
  | 'librarian' 
  | 'accounts_clerk';

export interface User {
  id: number;
  name: string;
  username: string;
  role: UserRole;
  school_id?: number;
  admission_number?: string;
}

export interface School {
  id: number;
  name: string;
  status: 'active' | 'suspended';
  address?: string;
  phone?: string;
  email?: string;
  motto?: string;
}

export interface Mark {
  id: number;
  student_id: number;
  subject_id: number;
  teacher_id: number;
  score: number;
  term: string;
  year: number;
  student_name?: string;
  subject_name?: string;
}

export interface Material {
  id: number;
  school_id: number;
  teacher_id: number;
  title: string;
  type: 'exam' | 'note' | 'marking_scheme';
  content: string;
  status: 'pending' | 'approved';
  created_at: string;
}
