import ledgerService from '../../src/ledger/services/ledger.service';

import transferService from '../../src/ledger/services/transfer.service';




describe('Atomic Transfer Service',()=>{


beforeEach(()=>{

ledgerService.clear();

});





test('moves PGK between wallets safely',()=>{


ledgerService.createEntry({

transactionId:'initial',

walletId:'wallet-a',

type:'CREDIT',

amount:100,

currency:'PGK'

});





const result = transferService.transfer({

senderWalletId:'wallet-a',

receiverWalletId:'wallet-b',

amount:40

});





expect(

result.success

)

.toBe(true);




expect(

ledgerService.getBalance('wallet-a')

)

.toBe(60);




expect(

ledgerService.getBalance('wallet-b')

)

.toBe(40);



});








test('blocks insufficient balance transfer',()=>{


const result = transferService.transfer({

senderWalletId:'empty-wallet',

receiverWalletId:'wallet-b',

amount:100

});




expect(result.success)

.toBe(false);




expect(result.error)

.toBe('Insufficient balance');



});






test('blocks invalid amount',()=>{


const result = transferService.transfer({

senderWalletId:'wallet-a',

receiverWalletId:'wallet-b',

amount:-50

});



expect(result.success)

.toBe(false);


});


});