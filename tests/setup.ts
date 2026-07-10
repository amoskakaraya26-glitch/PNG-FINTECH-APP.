process.env.NODE_ENV='test';

process.env.JWT_SECRET='test_secret';



afterAll(async()=>{


try{


const connection =

await import('../src/database/connection');



if(

(connection as any).default?.end

){


await (connection as any).default.end();


}




if(

(connection as any).db?.end

){


await (connection as any).db.end();


}




}catch(error){



}


});