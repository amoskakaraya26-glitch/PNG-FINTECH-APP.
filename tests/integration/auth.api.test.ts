import request from 'supertest';
import bcrypt from 'bcryptjs';

import { app } from '../../src/api/server';


let userCreated = false;



jest.mock('../../src/database/connection', () => {


  return {

    __esModule:true,


    default:{


      query: jest.fn(async (sql:string)=>{


        if(sql.includes('SELECT')){


          if(!userCreated){


            return {

              rows:[]

            };


          }


          return {

            rows:[

              {

                id:'test-user-id',

                phone:'675123456',

                full_name:'Auth Test User',

                pin_hash:await bcrypt.hash('1234',10),

                is_admin:false

              }

            ]

          };


        }





        if(sql.includes('INSERT')){


          userCreated=true;



          return {

            rows:[

              {

                id:'test-user-id',

                phone:'675123456',

                full_name:'Auth Test User',

                is_admin:false

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









describe('Auth API Integration Tests',()=>{


let token:string;





it(
'should register, login, and fetch a profile without a live database',

async()=>{



const phone =
'675123456';






// REGISTER


const registerResponse = await request(app)

.post('/api/auth/register')

.send({

phone,

fullName:'Auth Test User',

pin:'1234'

});




expect(

registerResponse.status

)

.toBe(201);





expect(

registerResponse.body.token

)

.toBeDefined();




token =
registerResponse.body.token;










// LOGIN


const loginResponse = await request(app)

.post('/api/auth/login')

.send({

phone,

pin:'1234'

});




expect(

loginResponse.status

)

.toBe(200);





expect(

loginResponse.body.token

)

.toBeDefined();











// PROFILE


const profileResponse = await request(app)

.get('/api/auth/profile')

.set(

'Authorization',

`Bearer ${token}`

);





expect(

profileResponse.status

)

.toBe(200);




expect(

profileResponse.body

)

.toBeDefined();




}


);



});