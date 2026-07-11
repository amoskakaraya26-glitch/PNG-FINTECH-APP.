import { WalletService } from '../../src/api/services/wallet.service';

import { db } from '../../src/database/connection';



let querySpy: jest.SpyInstance;





describe('WalletService',()=>{


let walletService:WalletService;





beforeEach(()=>{


jest.clearAllMocks();


querySpy =
jest.spyOn(

db,

'query'

);



walletService =
new WalletService();


});









describe('createWallet',()=>{


it('should create a wallet with initial balance',async()=>{


const mockWallet = {

id:'wallet-123',

user_id:'user123',

balance:'100.00',

currency:'PGK',

status:'active',

created_at:new Date(),

updated_at:new Date()

};





querySpy.mockResolvedValueOnce({

rows:[mockWallet],

command:'INSERT',

rowCount:1,

oid:0,

fields:[]

});







const wallet =

await walletService.createWallet(

'user123',

100

);







expect(querySpy)

.toHaveBeenCalled();





expect(wallet)

.toBeDefined();





expect(wallet.userId)

.toBe('user123');





expect(wallet.balance)

.toBe(100);





expect(wallet.currency)

.toBe('PGK');





});










it('should create wallet with zero default balance',async()=>{


const mockWallet = {

id:'wallet-456',

user_id:'user456',

balance:'0.00',

currency:'PGK',

status:'active',

created_at:new Date(),

updated_at:new Date()

};





querySpy.mockResolvedValueOnce({

rows:[mockWallet],

command:'INSERT',

rowCount:1,

oid:0,

fields:[]

});







const wallet =

await walletService.createWallet(

'user456'

);






expect(wallet.balance)

.toBe(0);


});



});












describe('getWallet',()=>{



it('should return wallet if exists',async()=>{


const mockWallet = {

id:'wallet-789',

user_id:'user789',

balance:'50.00',

currency:'PGK',

status:'active',

created_at:new Date(),

updated_at:new Date()

};






querySpy.mockResolvedValueOnce({

rows:[mockWallet],

command:'SELECT',

rowCount:1,

oid:0,

fields:[]

});








const wallet =

await walletService.getWallet(

'wallet-789'

);








// Do not compare SQL formatting.
// Production queries may contain spacing/newlines.

expect(querySpy)

.toHaveBeenCalled();





expect(

querySpy.mock.calls[0][1]

)

.toEqual(

['wallet-789']

);








expect(wallet)

.toBeDefined();





expect(wallet!.id)

.toBe('wallet-789');





expect(wallet!.balance)

.toBe(50);



});










it('should return null if wallet does not exist',async()=>{


querySpy.mockResolvedValueOnce({

rows:[],

command:'SELECT',

rowCount:0,

oid:0,

fields:[]

});






const wallet =

await walletService.getWallet(

'unknown-wallet'

);





expect(wallet)

.toBeNull();



});



});









describe('topup',()=>{


it('should add amount to wallet balance', async () => {
  const mockClient = {
    query: jest.fn(),
    release: jest.fn()
  };

  jest.spyOn(db, 'getClient').mockResolvedValue(mockClient as any);

  mockClient.query
    .mockResolvedValueOnce({}) // BEGIN
    .mockResolvedValueOnce({}) // UPDATE wallets
    .mockResolvedValueOnce({}) // INSERT transaction
    .mockResolvedValueOnce({}); // COMMIT

  const transaction = await walletService.topup(
    'wallet-123',
    50
  );

  expect(db.getClient).toHaveBeenCalled();

  expect(mockClient.query).toHaveBeenCalledWith('BEGIN');

  expect(mockClient.query).toHaveBeenCalledWith(
    expect.stringContaining('UPDATE wallets'),
    [50, 'wallet-123']
  );

  expect(mockClient.query).toHaveBeenCalledWith(
    expect.stringContaining('INSERT INTO transactions'),
    expect.any(Array)
  );

  expect(mockClient.query).toHaveBeenCalledWith('COMMIT');

  expect(mockClient.release).toHaveBeenCalled();

  expect(transaction.walletId).toBe('wallet-123');
  expect(transaction.amount).toBe(50);
  expect(transaction.type).toBe('topup');
  expect(transaction.status).toBe('completed');
  expect(transaction.currency).toBe('PGK');
});


it('should reject missing wallet', async () => {
  const mockClient = {
    query: jest.fn(),
    release: jest.fn()
  };

  jest.spyOn(db, 'getClient').mockResolvedValue(mockClient as any);

  mockClient.query
    .mockResolvedValueOnce({}) // BEGIN
    .mockRejectedValueOnce(new Error('Wallet not found')) // UPDATE fails
    .mockResolvedValueOnce({}); // ROLLBACK

  await expect(
    walletService.topup(
      'missing-wallet',
      50
    )
  ).rejects.toThrow('Wallet not found');

  expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
  expect(mockClient.release).toHaveBeenCalled();
});


});







describe('transfer',()=>{


it('should transfer between wallets', async () => {
  const mockClient = {
    query: jest.fn(),
    release: jest.fn()
  };

  jest.spyOn(db, 'getClient').mockResolvedValue(mockClient as any);

  mockClient.query
    .mockResolvedValueOnce({}) // BEGIN
    .mockResolvedValueOnce({
      rows: [
        {
          id: 'wallet-a',
          user_id: 'user-a',
          balance: '500.00'
        },
        {
          id: 'wallet-b',
          user_id: 'user-b',
          balance: '100.00'
        }
      ]
    }) // SELECT wallets FOR UPDATE
    .mockResolvedValueOnce({
      rows: [
        {
          id: 'user-a',
          full_name: 'Alice'
        }
      ]
    }) // sender
    .mockResolvedValueOnce({
      rows: [
        {
          id: 'user-b',
          full_name: 'Bob'
        }
      ]
    }) // receiver
    .mockResolvedValueOnce({}) // UPDATE wallets
    .mockResolvedValueOnce({}) // INSERT sender transaction
    .mockResolvedValueOnce({}) // INSERT receiver transaction
    .mockResolvedValueOnce({}); // COMMIT

  const transaction = await walletService.transfer(
    'wallet-a',
    'wallet-b',
    100
  );

  expect(db.getClient).toHaveBeenCalled();

  expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
  expect(mockClient.query).toHaveBeenCalledWith('COMMIT');

  expect(mockClient.release).toHaveBeenCalled();

  expect(transaction.walletId).toBe('wallet-a');
  expect(transaction.type).toBe('transfer');
  expect(transaction.amount).toBe(100);
  expect(transaction.currency).toBe('PGK');
  expect(transaction.status).toBe('completed');
});


it('should reject insufficient balance', async () => {
  const mockClient = {
    query: jest.fn(),
    release: jest.fn()
  };

  jest.spyOn(db, 'getClient').mockResolvedValue(mockClient as any);

  mockClient.query
    .mockResolvedValueOnce({}) // BEGIN
    .mockResolvedValueOnce({
      rows: [
        {
          id: 'wallet-a',
          user_id: 'user-a',
          balance: '50.00'
        },
        {
          id: 'wallet-b',
          user_id: 'user-b',
          balance: '100.00'
        }
      ]
    }) // SELECT ... FOR UPDATE
    .mockResolvedValueOnce({}); // ROLLBACK

  await expect(
    walletService.transfer(
      'wallet-a',
      'wallet-b',
      100
    )
  ).rejects.toThrow('Insufficient balance');

  expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
  expect(mockClient.release).toHaveBeenCalled();
});


it('should reject invalid amount', async () => {
  await expect(
    walletService.transfer(
      'wallet-a',
      'wallet-b',
      0
    )
  ).rejects.toThrow('Invalid transfer amount');

  await expect(
    walletService.transfer(
      'wallet-a',
      'wallet-b',
      -10
    )
  ).rejects.toThrow('Invalid transfer amount');
});


});







describe('getTransactionHistory',()=>{


it('should return wallet history', async () => {
  const createdAt = new Date();

  querySpy.mockResolvedValueOnce({
    rows: [
      {
        id: 'txn-001',
        wallet_id: 'wallet-123',
        type: 'transfer',
        amount: '100.00',
        fee: '0.50',
        currency: 'PGK',
        status: 'completed',
        description: 'Transfer to John Doe',
        reference_id: 'PNG-123456',
        sender_name: 'Jane Doe',
        sender_phone: '70000001',
        receiver_name: 'John Doe',
        receiver_phone: '70000002',
        created_at: createdAt
      }
    ],
    command: 'SELECT',
    rowCount: 1,
    oid: 0,
    fields: []
  });

  const history = await walletService.getTransactionHistory(
    'wallet-123'
  );

  expect(querySpy).toHaveBeenCalled();

  expect(querySpy.mock.calls[0][1]).toEqual([
    'wallet-123'
  ]);

  expect(history).toHaveLength(1);

  expect(history[0]).toMatchObject({
    id: 'txn-001',
    walletId: 'wallet-123',
    type: 'transfer',
    amount: 100,
    fee: 0.5,
    currency: 'PGK',
    status: 'completed',
    description: 'Transfer to John Doe',
    referenceId: 'PNG-123456',
    senderName: 'Jane Doe',
    senderPhone: '70000001',
    receiverName: 'John Doe',
    receiverPhone: '70000002'
  });

  expect(history[0].timestamp).toEqual(createdAt);
});


it('should return empty history', async () => {
  querySpy.mockResolvedValueOnce({
    rows: [],
    command: 'SELECT',
    rowCount: 0,
    oid: 0,
    fields: []
  });

  const history = await walletService.getTransactionHistory(
    'wallet-123'
  );

  expect(querySpy).toHaveBeenCalled();

  expect(querySpy.mock.calls[0][1]).toEqual([
    'wallet-123'
  ]);

  expect(history).toEqual([]);
});


});



});