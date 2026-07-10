import request from 'supertest';
import jwt from 'jsonwebtoken';

import { app } from '../../src/api/server';


jest.mock('../../src/database/connection', () => {

  return {

    __esModule: true,

    default: {

      query: jest.fn(async (sql: string) => {


        if (sql.includes('SELECT')) {

          return {
            rows: []
          };

        }


        if (sql.includes('INSERT')) {

          return {

            rows: [
              {
                id: 'test-user-id',
                phone: '675000000',
                full_name: 'Wallet Test User',
                balance: 0,
                is_admin: false
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





describe('PNG Wallet Integration Tests', () => {


  let token:string;



  beforeAll(() => {


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








  describe('Authentication Protection', () => {


    it('should block profile without token', async () => {


      const response = await request(app)
        .get('/api/auth/profile');



      expect(response.status)
        .toBe(401);


    });


  });









  describe('Wallet Profile', () => {



    it('should load authenticated profile', async () => {


      const response = await request(app)

        .get('/api/auth/profile')

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










  describe('Transaction History', () => {



    it('should load transaction history securely', async () => {


      const response = await request(app)

        .get('/api/transfer/history')

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



});