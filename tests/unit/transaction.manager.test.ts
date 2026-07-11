import transactionManager from '../../src/database/transaction.manager';
import db from '../../src/database/connection';

jest.mock('../../src/database/connection', () => ({
  __esModule: true,
  default: {
    query: jest.fn()
  }
}));

describe('Database Transaction Manager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('commits successful operation', async () => {
    const result = await transactionManager.execute(async () => {
      return 'success';
    });

    expect(result).toBe('success');

    expect(db.query).toHaveBeenCalledWith('BEGIN');
    expect(db.query).toHaveBeenCalledWith('COMMIT');
  });

  test('rolls back failed operation', async () => {
    await expect(
      transactionManager.execute(async () => {
        throw new Error('failure');
      })
    ).rejects.toThrow('failure');

    expect(db.query).toHaveBeenCalledWith('ROLLBACK');
  });
});