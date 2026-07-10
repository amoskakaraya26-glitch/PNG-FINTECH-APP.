import pool from '../../database/connection';






export const recordSession =
async(

userId:string,

tokenId:string,

deviceName:string,

ipAddress:string

)=>{


try{


await pool.query(
`

INSERT INTO user_sessions

(
user_id,
token_id,
device_name,
ip_address
)

VALUES

($1,$2,$3,$4)

`,
[

userId,

tokenId,

deviceName,

ipAddress

]
);



}catch(error){


console.error(

'Session Record Error:',

error

);


}



};










export const recordDevice =
async(

userId:string,

deviceName:string,

ipAddress:string

)=>{


try{


await pool.query(
`

INSERT INTO device_logs

(
user_id,
device_name,
ip_address
)

VALUES

($1,$2,$3)

`,
[

userId,

deviceName,

ipAddress

]
);



}catch(error){


console.error(

'Device Record Error:',

error

);


}



};









export const createSecurityEvent =
async(

userId:string,

eventType:string,

severity:string,

description:string,

metadata:any = {}

)=>{


try{


await pool.query(
`

INSERT INTO security_events

(
user_id,
event_type,
severity,
description,
metadata
)

VALUES

($1,$2,$3,$4,$5)

`,
[

userId,

eventType,

severity,

description,

metadata

]
);



}catch(error){


console.error(

'Security Event Error:',

error

);


}



};