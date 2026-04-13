import { BaseRepository } from './base.repository';
import { Expense } from '../../types';

class ExpenseRepository extends BaseRepository<Expense> {
  protected collectionName = 'expenses';
}

export const expenseRepository = new ExpenseRepository();
