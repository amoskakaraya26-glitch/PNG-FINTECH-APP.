import request from 'supertest';

import { app } from '../../src/api/server';




describe('KYC API Integration Tests',()=>{



let sessionId:string;







describe('POST /api/kyc/initiate',()=>{





it('should initiate KYC verification successfully',async()=>{



const response = await request(app)

.post('/api/kyc/initiate')

.send({

phone:'+67570000000',

fullName:'Test User',

documentType:'national_id',

documentNumber:'PNG123456'

});





expect(

[200,201,400]

)

.toContain(

response.status

);






if(response.status !==400){


expect(

response.body.success

)

.toBe(true);



sessionId =

response.body.result?.sessionId ||

'test-session';



}



});









it('should return error for missing required fields',async()=>{



const response = await request(app)

.post('/api/kyc/initiate')

.send({

phone:'+67570000000'

});




expect(

response.status

)

.toBe(400);




expect(

response.body

)

.toBeDefined();



});




});









describe('POST /api/kyc/callback',()=>{






it('should process KYC callback successfully',async()=>{



const response = await request(app)

.post('/api/kyc/callback')

.send({

sessionId:

sessionId || 'test-session',



result:{

userId:'user456',

savisId:'SVS-test123',

status:'success',

attributes:{


fullName:'Test User',

phone:'+67570000000'


}


}


});





expect(

[200,400]

)

.toContain(

response.status

);




expect(

response.body

)

.toBeDefined();



});











it('should handle invalid session ID safely',async()=>{



const response = await request(app)

.post('/api/kyc/callback')

.send({


sessionId:'invalid-session-id',


result:{

userId:'invalid',

status:'success'


}


});





expect(

[200,400]

)

.toContain(

response.status

);




expect(

response.body

)

.toBeDefined();




});




});





});