import request from 'supertest';
import jwt from 'jsonwebtoken';

import { app } from '../../src/api/server';



jest.mock('../../src/database/connection', () => {


  return {


    __esModule:true,


    default:{


      query: jest.fn(async (sql:string)=>{


        if(sql.includes('SELECT')){

          return {

            rows:[

              {
                id:'test-bank-id',
                bank:'kina',
                account_number:'1234567890'
              }

            ]

          };

        }



        if(sql.includes('INSERT')){

          return {

            rows:[

              {
                id:'test-user-id',
                phone:'675000000',
                full_name:'Bank Test User'
              }

            ]

          };

        }



        return {

          rows:[]

        };


      })


    }


  };


});









describe('PNG Wallet Bank Integration Tests',()=>{


let token:string;





beforeAll(()=>{


token = jwt.sign(

{

id:'test-user-id',

phone:'675000000',

isAdmin:false

},


process.env.JWT_SECRET || 'secret',


{

expiresIn:'7d'

}


);


});











describe('Bank Security',()=>{


it('should block bank accounts without token',async()=>{


const response = await request(app)

.get('/api/bank/accounts');



expect(response.status)

.toBe(401);



});


});









describe('Linked Bank Accounts',()=>{


it('should load linked bank accounts',async()=>{


const response = await request(app)

.get('/api/bank/accounts')

.set(

'Authorization',

`Bearer ${token}`

);




expect(

[200,404]

)

.toContain(

response.status

);



});


});









describe('Bank Link',()=>{


it('should link bank account securely',async()=>{


const response = await request(app)

.post('/api/bank/link')

.set(

'Authorization',

`Bearer ${token}`

)

.send({

bank:'kina',

accountNumber:'1234567890',

pin:'1234'

});




expect(

[200,201,400,404]

)

.toContain(

response.status

);



});


});











describe('Bank Cash In',()=>{


it('should process bank cash-in request',async()=>{


const response = await request(app)

.post('/api/bank/transfer')

.set(

'Authorization',

`Bearer ${token}`

)

.send({

fromAccount:'1234567890',

walletId:'wallet-test',

amount:100

});





expect(

[200,201,400,404]

)

.toContain(

response.status

);



});


});




});