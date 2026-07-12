import auditRepository from '../../src/audit/repositories/audit.repository';

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





test('records audit event in database',async()=>{


(db.query as jest.Mock)

.mockResolvedValue({

rows:[

{

id:'audit1',

risk:'LOW'

}

]

});




const event = await auditRepository.record({

userId:'user1',

action:'LOGIN'

});




expect(event.id)

.toBe('audit1');


});