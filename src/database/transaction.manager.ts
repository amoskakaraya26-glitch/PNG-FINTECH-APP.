import db from './connection';




class TransactionManager {




async execute<T>(

operation:()=>Promise<T>

):Promise<T>{



try{


await db.query('BEGIN');



const result = await operation();



await db.query('COMMIT');



return result;




}catch(error){



await db.query('ROLLBACK');



throw error;



}



}



}




export default new TransactionManager();