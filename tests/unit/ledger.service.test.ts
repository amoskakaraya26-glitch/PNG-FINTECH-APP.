import ledgerService from '../../src/ledger/services/ledger.service';



describe('Ledger Service',()=>{



test('calculates wallet balance correctly',()=>{


const walletId='wallet-test';



ledgerService.createEntry({

transactionId:'tx1',

walletId,

type:'CREDIT',

amount:100,

currency:'PGK'

});




ledgerService.createEntry({

transactionId:'tx2',

walletId,

type:'DEBIT',

amount:25,

currency:'PGK'

});





expect(

ledgerService.getBalance(walletId)

)

.toBe(75);



});



});