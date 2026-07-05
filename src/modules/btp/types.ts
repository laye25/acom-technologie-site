export interface Task {
  id: string;
  title: string;
  status: 'todo' | 'doing' | 'done';
  createdAt: number;
  assignedTo?: string;
  dueDate?: string;
}

export interface ConstructionLog {
  id: string;
  date: string;
  weather: 'sunny' | 'cloudy' | 'rainy' | 'windy' | 'stormy';
  notes: string;
  incidents: string;
  workersCount: number;
  author: string;
  createdAt: number;
}

export interface BudgetItem {
  id: string;
  category: 'materials' | 'labor' | 'equipment' | 'subcontracting' | 'other';
  description: string;
  allocated: number; // Planned budget
  spent: number;     // Actual money spent
  date: string;
}

export interface BtpProject {
  id: string;
  merchantId: string;
  name: string;
  description?: string;
  status: 'planned' | 'active' | 'on-hold' | 'completed';
  startDate: string;
  endDate?: string;
  budget: number; // Total global pre-allocated budget
  location: string;
  tasks?: Task[];
  logs?: ConstructionLog[];
  budgets?: BudgetItem[];
  updatedAt: any;
}
