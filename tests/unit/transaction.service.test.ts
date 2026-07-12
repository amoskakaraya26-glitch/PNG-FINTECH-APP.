import transactionService from '../../src/transactions/services/transaction.service';




describe('Transaction Lifecycle Service',()=>{



beforeEach(()=>{

transactionService.clear();

});






test('creates pending transaction record',()=>{


const tx = transactionService.create({

fromWallet:'wallet-a',

toWallet:'wallet-b',

amount:100

});




expect(tx.id)

.toBeDefined();




expect(tx.status)

.toBe('CREATED');




expect(tx.currency)

.toBe('PGK');


});










test('updates transaction lifecycle',()=>{


const tx = transactionService.create({

fromWallet:'wallet-a',

toWallet:'wallet-b',

amount:50

});




transactionService.updateStatus(

tx.id,

'PROCESSING'

);





const updated =

transactionService.findById(tx.id);




expect(

updated?.status

)

.toBe('PROCESSING');







transactionService.updateStatus(

tx.id,

'COMPLETED'

);




expect(

transactionService.findById(tx.id)?.status

)

.toBe('COMPLETED');


});









test('rejects missing transaction update',()=>{


const result =

transactionService.updateStatus(

'missing',

'FAILED'

);




expect(result)

.toBeNull();


});



});