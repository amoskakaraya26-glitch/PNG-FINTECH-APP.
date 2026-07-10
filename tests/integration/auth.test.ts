import request from 'supertest';

import { app } from '../../src/api/server';




jest.mock('../../src/database/connection',()=>{


return {


__esModule:true,


default:{


query:jest.fn(async()=>{


return {

rows:[]

};


})


}


};


});









describe('Authentication API',()=>{





test('health endpoint works',async()=>{



const response = await request(app)

.get('/api/auth/health');




expect(

response.status

)

.toBe(200);



});









test('rejects bad login',async()=>{



const response = await request(app)

.post('/api/auth/login')

.send({

phone:'00000000',

pin:'0000'

});





expect(

response.status

)

.toBe(401);




expect(

response.body

)

.toBeDefined();



});





});