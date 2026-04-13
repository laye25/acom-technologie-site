import { BaseRepository } from './base.repository';
import { MerchantExpense } from '../../types';

class MerchantExpenseRepository extends BaseRepository<MerchantExpense> {
  protected collectionName = 'merchant_expenses';
}

export const merchantExpenseRepository = new MerchantExpenseRepository();
