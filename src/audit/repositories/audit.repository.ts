import { v4 as uuid } from 'uuid';

import db from '../../database/connection';

import {

AuditAction,

RiskLevel

} from '../models/audit.model';




class AuditRepository {




async record(

data:{

userId:string;

action:AuditAction;

details?:Record<string,any>;

risk?:RiskLevel;

}

){


const result = await db.query(

`

INSERT INTO audit_logs (

id,

user_id,

action,

details,

risk

)

VALUES ($1,$2,$3,$4,$5)

RETURNING *

`,

[

uuid(),

data.userId,

data.action,

JSON.stringify(data.details || {}),

data.risk || 'LOW'

]

);




return result.rows[0];

}








async findByUser(

userId:string

){


const result = await db.query(

`

SELECT *

FROM audit_logs

WHERE user_id=$1

ORDER BY created_at DESC

`,

[userId]

);



return result.rows;


}




}



export default new AuditRepository();