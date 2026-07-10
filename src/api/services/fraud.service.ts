import pool from '../../database/connection';

import { createSecurityEvent } from './security.service';









export const calculateRisk =
async(

userId:string,

amount:number,

transactionId?:string

)=>{



let score = 0;


const reasons:string[] = [];








// LARGE TRANSACTION CHECK


if(amount >= 1000){


score += 50;


reasons.push(

'LARGE_TRANSACTION'

);


}










// FREQUENCY CHECK


const recent = await pool.query(

`

SELECT COUNT(*)

FROM transactions

WHERE user_id=$1

AND created_at > NOW() - INTERVAL '10 minutes'

`,

[userId]

);





if(

Number(recent.rows[0].count) >= 5

){


score += 40;



reasons.push(

'HIGH_FREQUENCY'

);


}









// RISK LEVEL


let riskLevel = 'low';




if(score >= 80){


riskLevel = 'high';


}

else if(score >= 40){


riskLevel = 'medium';


}









await pool.query(

`

INSERT INTO risk_scores

(

user_id,

transaction_id,

score,

risk_level,

reasons

)

VALUES

($1,$2,$3,$4,$5)

`,

[

userId,

transactionId || null,

score,

riskLevel,

JSON.stringify(reasons)

]

);










if(riskLevel==='high'){



await createTransactionHold(

transactionId,

userId,

reasons.join(',')

);





await createSecurityEvent(

userId,

'FRAUD_ALERT',

'high',

'Suspicious transaction detected',

{

score,

reasons

}

);



}









return {

score,

riskLevel,

reasons

};



};












export const createTransactionHold =
async(

transactionId:string | undefined,

userId:string,

reason:string

)=>{



await pool.query(

`

INSERT INTO transaction_holds

(

transaction_id,

user_id,

reason

)

VALUES

($1,$2,$3)

`,

[

transactionId || null,

userId,

reason

]

);



};