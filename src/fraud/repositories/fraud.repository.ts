import { v4 as uuid } from 'uuid';

import db from '../../database/connection';




class FraudRepository {




async record(

data:{

userId:string;

decision:string;

riskScore:number;

reasons:string[];

}

){


const result = await db.query(

`

INSERT INTO fraud_events (

id,

user_id,

decision,

risk_score,

reasons

)

VALUES ($1,$2,$3,$4,$5)

RETURNING *

`,

[

uuid(),

data.userId,

data.decision,

data.riskScore,

JSON.stringify(data.reasons)

]

);



return result.rows[0];


}








async findHighRisk(){


const result = await db.query(

`

SELECT *

FROM fraud_events

WHERE risk_score >= 80

ORDER BY created_at DESC

`

);



return result.rows;


}




}




export default new FraudRepository();