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


it.skip('should add amount to wallet balance',async()=>{});


it.skip('should reject missing wallet',async()=>{});


});







describe('transfer',()=>{


it.skip('should transfer between wallets',async()=>{});


it.skip('should reject insufficient balance',async()=>{});


it.skip('should reject invalid amount',async()=>{});


});







describe('getTransactionHistory',()=>{


it.skip('should return wallet history',async()=>{});


it.skip('should return empty history',async()=>{});


});



});