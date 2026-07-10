import pool from '../../database/connection';

import { emitToUser } from '../socket';





interface NotificationInput {


  userId:string;


  type:string;


  title:string;


  message:string;


  data?:any;


}










export const createNotification =
async(input:NotificationInput)=>{


try{



const {

userId,

type,

title,

message,

data

}=input;








await pool.query(

`

INSERT INTO notifications

(

user_id,

type,

title,

message,

data

)

VALUES

($1,$2,$3,$4,$5)

`,

[

userId,

type,

title,

message,

data || {}

]

);








// ============================
// REAL TIME SOCKET ALERT
// ============================


emitToUser(

userId,

'notification',

{


type,

title,

message,

data:data || {},

createdAt:new Date()


}


);









return true;









}catch(error){



console.error(

'Notification Error:',

error

);



return false;



}



};