import pool from '../../database/connection';



interface AuditInput {

  userId?:string;

  action:string;

  category:string;

  description?:string;

  metadata?:any;

  ipAddress?:string;

}





export const createAuditLog =
async(data:AuditInput)=>{


try{


await pool.query(
`

INSERT INTO audit_logs
(
user_id,
action,
category,
description,
metadata,
ip_address
)

VALUES

($1,$2,$3,$4,$5,$6)

`,
[

data.userId || null,

data.action,

data.category,

data.description || '',

data.metadata || {},

data.ipAddress || null

]
);



return true;




}catch(error){


console.error(
'Audit Log Error:',
error
);


return false;


}



};