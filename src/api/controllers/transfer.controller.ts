import { Response } from 'express';

import { v4 as uuidv4 } from 'uuid';

import pool from '../../database/connection';

import { AuthRequest } from '../middleware/auth.middleware';



import { calculateRisk } from '../services/fraud.service';

import { emitBalanceUpdate } from '../socket';









export const sendMoney = async(

req:AuthRequest,

res:Response

)=>{


const client =

await pool.connect();




try{


await client.query(

'BEGIN'

);






const {

recipientPhone,

amount,

description

}=req.body;





const parsedAmount =

parseFloat(amount);






if(parsedAmount<=0){


return res.status(400).json({

error:'Invalid amount'

});


}










// FRAUD CHECK BEFORE MONEY MOVES

const risk =

await calculateRisk(

req.user!.id,

parsedAmount

);








if(risk.riskLevel==='high'){



await client.query(

'ROLLBACK'

);




return res.status(403).json({

error:'Transfer held for security review',

risk

});



}










const senderWallet =

await client.query(

`

SELECT *

FROM wallets

WHERE user_id=$1

`,

[req.user!.id]

);








if(senderWallet.rows.length===0){



return res.status(404).json({

error:'Wallet not found'

});


}






const sender =

senderWallet.rows[0];







if(

parseFloat(sender.balance)

<

parsedAmount

){



return res.status(400).json({

error:'Insufficient balance'

});


}









const limits =

await client.query(

`

SELECT *

FROM user_limits

WHERE user_id=$1

`,

[req.user!.id]

);







if(limits.rows.length>0){


const limit =

limits.rows[0];




if(

parsedAmount >

parseFloat(

limit.per_transaction_limit

)

){



return res.status(400).json({

error:

`Per-transaction limit is PGK ${limit.per_transaction_limit}`

});



}



}









const recipient =

await client.query(

`

SELECT

u.id,

u.full_name,

w.id AS wallet_id

FROM users u

JOIN wallets w

ON w.user_id=u.id

WHERE u.phone=$1

`,

[recipientPhone]

);







if(recipient.rows.length===0){


return res.status(404).json({

error:'Recipient not found'

});


}






const recv =

recipient.rows[0];









await client.query(

`

UPDATE wallets

SET balance=balance-$1,

updated_at=NOW()

WHERE user_id=$2

`,

[

parsedAmount,

req.user!.id

]

);








await client.query(

`

UPDATE wallets

SET balance=balance+$1,

updated_at=NOW()

WHERE user_id=$2

`,

[

parsedAmount,

recv.id

]

);










const txId =

uuidv4();







await client.query(

`

INSERT INTO transactions

(

id,

wallet_id,

type,

amount,

currency,

status,

description,

sender_id,

receiver_id,

category

)

VALUES

(

$1,$2,'transfer',$3,

'PGK',

'completed',

$4,$5,$6,

'transfer'

)

`,

[

txId,

sender.id,

parsedAmount,

description || 'P2P Transfer',

req.user!.id,

recv.id

]

);










await client.query(

`

INSERT INTO notifications

(

id,

user_id,

type,

title,

message,

data

)

VALUES

(

$1,$2,

'transfer_received',

'Money Received',

$3,$4

)

`,

[

uuidv4(),

recv.id,

`You received PGK ${parsedAmount}`,

JSON.stringify({

txId,

amount:parsedAmount

})

]

);










await client.query(

'COMMIT'

);









// LIVE BALANCE UPDATES

const senderBalance =

await pool.query(

'SELECT balance FROM wallets WHERE user_id=$1',

[req.user!.id]

);




const receiverBalance =

await pool.query(

'SELECT balance FROM wallets WHERE user_id=$1',

[recv.id]

);







emitBalanceUpdate(

req.user!.id,

Number(senderBalance.rows[0].balance)

);





emitBalanceUpdate(

recv.id,

Number(receiverBalance.rows[0].balance)

);










res.json({

message:'Transfer successful',

transactionId:txId,

amount:parsedAmount,

recipient:recv.full_name,

risk:risk.riskLevel

});







}catch(err:any){



await client.query(

'ROLLBACK'

);



res.status(500).json({

error:err.message

});




}finally{



client.release();



}



};

export const getTransactionHistory =
async(

req:AuthRequest,

res:Response

)=>{


try{



const {

page=1,

limit=20,

type,

startDate,

endDate

}=req.query;






const offset =

(Number(page)-1)

*

Number(limit);







let query =

`

SELECT

t.*,

s.full_name AS sender_name,

s.phone AS sender_phone,

r.full_name AS receiver_name,

r.phone AS receiver_phone


FROM transactions t


LEFT JOIN users s

ON s.id=t.sender_id


LEFT JOIN users r

ON r.id=t.receiver_id


JOIN wallets w

ON w.id=t.wallet_id


WHERE w.user_id=$1

`;






const params:any[] = [

req.user!.id

];




let paramIdx = 2;







if(type){


query +=

` AND t.type=$${paramIdx++}`;


params.push(type);


}







if(startDate){


query +=

` AND t.created_at >= $${paramIdx++}`;


params.push(startDate);


}







if(endDate){


query +=

` AND t.created_at <= $${paramIdx++}`;


params.push(endDate);


}








query +=

`

ORDER BY t.created_at DESC

LIMIT $${paramIdx++}

OFFSET $${paramIdx}

`;





params.push(

Number(limit),

offset

);








const result =

await pool.query(

query,

params

);








res.json({

transactions:result.rows,

page:Number(page),

limit:Number(limit)

});






}catch(err:any){



res.status(500).json({

error:err.message

});



}



};













export const getSpendingAnalytics =
async(

req:AuthRequest,

res:Response

)=>{


try{





const {

period='month'

}=req.query;






const interval =


period==='week'

?

'7 days'

:

period==='year'

?

'1 year'

:

'30 days';









const byCategory =

await pool.query(

`

SELECT

COALESCE(category,'other') AS category,

SUM(amount) AS total,

COUNT(*) AS count


FROM transactions t


JOIN wallets w

ON w.id=t.wallet_id


WHERE w.user_id=$1


AND t.type IN

(

'transfer',

'payment',

'bill'

)


AND t.created_at >=

NOW() - INTERVAL '${interval}'


GROUP BY category

`,

[req.user!.id]

);











const byDay =

await pool.query(

`

SELECT

DATE(t.created_at) AS date,

SUM(t.amount) AS total


FROM transactions t


JOIN wallets w

ON w.id=t.wallet_id


WHERE w.user_id=$1


AND t.type IN

(

'transfer',

'payment',

'bill'

)


AND t.created_at >=

NOW() - INTERVAL '${interval}'


GROUP BY DATE(t.created_at)


ORDER BY date

`,

[req.user!.id]

);









const totalSpent =

await pool.query(

`

SELECT

COALESCE(

SUM(amount),

0

) AS total


FROM transactions t


JOIN wallets w

ON w.id=t.wallet_id


WHERE w.user_id=$1


AND t.type IN

(

'transfer',

'payment',

'bill'

)


AND t.created_at >=

NOW() - INTERVAL '${interval}'

`,

[req.user!.id]

);










res.json({

byCategory:

byCategory.rows,


byDay:

byDay.rows,


totalSpent:

totalSpent.rows[0]?.total || 0,


period

});








}catch(err:any){



res.status(500).json({

error:err.message

});



}



};