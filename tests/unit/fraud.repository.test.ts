import fraudRepository from '../../src/fraud/repositories/fraud.repository';

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






test('records fraud event in database',async()=>{


(db.query as jest.Mock)

.mockResolvedValue({

rows:[

{

id:'risk1',

risk_score:90

}

]

});





const result = await fraudRepository.record({

userId:'user1',

decision:'BLOCK',

riskScore:90,

reasons:[

'High risk'

]

});




expect(result.id)

.toBe('risk1');


});