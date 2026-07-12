import transactionRepository from '../../src/transactions/repositories/transaction.repository';

import db from '../../src/database/connection';




jest.mock(

'../../src/database/connection',

()=>({

__esModule:true,

default:{

query:jest.fn()

}

})

);






describe('Transaction Repository',()=>{


beforeEach(()=>{

jest.clearAllMocks();

});






test('creates transaction in database',async()=>{


(db.query as jest.Mock)

.mockResolvedValue({

rows:[

{

id:'tx123',

status:'CREATED'

}

]

});





const tx =

await transactionRepository.create({

fromWallet:'wallet-a',

toWallet:'wallet-b',

amount:50,

currency:'PGK'

});





expect(tx.id)

.toBe('tx123');




expect(tx.status)

.toBe('CREATED');



});








test('updates transaction status',async()=>{


(db.query as jest.Mock)

.mockResolvedValue({

rows:[

{

id:'tx123',

status:'COMPLETED'

}

]

});





const tx =

await transactionRepository.updateStatus(

'tx123',

'COMPLETED'

);




expect(

tx.status

)

.toBe('COMPLETED');


});



});