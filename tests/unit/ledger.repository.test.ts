import ledgerRepository from '../../src/ledger/repositories/ledger.repository';

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






describe('Ledger Repository',()=>{



beforeEach(()=>{

jest.clearAllMocks();

});







test('creates ledger database entry',async()=>{



(db.query as jest.Mock)

.mockResolvedValue({

rows:[

{

id:'entry1'

}

]

});




const result =

await ledgerRepository.createEntry({

walletId:'wallet1',

transactionId:'tx1',

type:'CREDIT',

amount:100,

currency:'PGK'

});





expect(result.id)

.toBe('entry1');




expect(db.query)

.toHaveBeenCalled();



});









test('calculates database balance',async()=>{



(db.query as jest.Mock)

.mockResolvedValue({

rows:[

{

balance:'250'

}

]

});





const balance =

await ledgerRepository.getBalance(

'wallet1'

);





expect(balance)

.toBe(250);



});



});