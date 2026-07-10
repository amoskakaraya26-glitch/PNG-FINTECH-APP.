import {Router} from 'express';
import { Parser } from 'json2csv';

import {
getDashboardStats,
getUsers,
getTransactions,
updateUserStatus,
reviewKYC
} from '../controllers/admin.controller';



import {
authenticate,
requireAdmin
} from '../middleware/auth.middleware';



import {db} from '../../database/connection';
import pool from '../../database/connection';




const router=Router();







// ============================
// ADMIN STATS
// ============================

router.get(
'/stats',
authenticate,
requireAdmin,
getDashboardStats
);







// ============================
// USERS
// ============================

router.get(
'/users',
authenticate,
requireAdmin,
getUsers
);



router.patch(
'/users/:id/status',
authenticate,
requireAdmin,
updateUserStatus
);








// ============================
// TRANSACTIONS
// ============================

router.get(
'/transactions',
authenticate,
requireAdmin,
getTransactions
);








// ============================
// KYC
// ============================

router.patch(
'/kyc/:id',
authenticate,
requireAdmin,
reviewKYC
);










// ============================
// PNG WALLET REVENUE
// ============================

router.get(
'/revenue',
authenticate,
requireAdmin,
async(req,res)=>{


try{


const result=
await db.query(
`

SELECT


COALESCE(
SUM(amount),
0
)
AS volume,



COALESCE(
SUM(fee),
0
)
AS revenue,



COUNT(*)
AS transactions,



COALESCE(
SUM(

CASE

WHEN DATE(created_at)=CURRENT_DATE

THEN fee

ELSE 0

END

),
0
)
AS today


FROM transactions

`
);





res.json({


volume:
Number(result.rows[0].volume),


revenue:
Number(result.rows[0].revenue),


transactions:
Number(result.rows[0].transactions),


today:
Number(result.rows[0].today)


});





}catch(error){



res.status(500).json({

error:'Revenue load failed'

});



}


}
);











// ============================
// COMPLIANCE MONITOR
// ============================


router.get(
'/compliance',
authenticate,
requireAdmin,
async(req,res)=>{


try{


const alerts=
await db.query(
`

SELECT


t.id,

t.amount,

t.type,

t.status,

t.created_at,


sender.full_name
AS sender,


receiver.full_name
AS receiver



FROM transactions t



LEFT JOIN users sender

ON sender.id=t.sender_id



LEFT JOIN users receiver

ON receiver.id=t.receiver_id





WHERE


t.amount >= 1000




ORDER BY

t.created_at DESC



LIMIT 50


`
);







res.json({


alerts:

alerts.rows


});







}catch(error){



res.status(500).json({

error:'Compliance failed'

});



}



}
);





// ============================
// BANK SETTLEMENT SYSTEM
// ============================


router.get(
'/settlements',
authenticate,
requireAdmin,
async(req,res)=>{


try{


const result =
await db.query(
`

SELECT

s.*,

u.full_name AS merchant_name,

u.phone AS merchant_phone


FROM settlements s


LEFT JOIN users u

ON u.id=s.merchant_id


ORDER BY

s.created_at DESC


`
);



res.json({

settlements:

result.rows

});




}catch(error){


res.status(500).json({

error:'Settlement load failed'

});


}


}
);









router.patch(
'/settlements/:id/approve',
authenticate,
requireAdmin,
async(req,res)=>{


try{


await db.query(
`

UPDATE settlements

SET

status='paid',

processed_at=NOW()


WHERE id=$1


`,
[
req.params.id
]
);





res.json({

success:true,

message:'Settlement approved'

});





}catch(error){


res.status(500).json({

error:'Settlement approval failed'

});


}



}
);

// ============================
// ADMIN BANK MONITOR
// ============================

router.get(
'/bank-monitor',
authenticate,
requireAdmin,
async(req,res)=>{


try{


const result =
await pool.query(
`

SELECT

bt.*,

u.full_name,
u.phone

FROM bank_transactions bt

LEFT JOIN users u
ON u.id = bt.user_id

ORDER BY bt.created_at DESC

LIMIT 100

`
);



res.json({

transactions:
result.rows

});



}catch(error){


console.error(error);


res.status(500).json({

error:'Failed loading bank monitor'

});


}


}
);

// =============================
// ADMIN AUDIT LOG VIEWER
// =============================

router.get(
'/audit-logs',
authenticate,
requireAdmin,
async(req,res)=>{


try{


const result =
await pool.query(
`

SELECT

a.*,

u.full_name,
u.phone

FROM audit_logs a

LEFT JOIN users u
ON u.id = a.user_id

ORDER BY a.created_at DESC

LIMIT 200

`
);




res.json({

logs:

result.rows

});





}catch(error){


console.error(error);


res.status(500).json({

error:'Failed loading audit logs'

});


}


}
);

// ============================
// ADMIN REPORT SUMMARY
// ============================

router.get(
'/reports/summary',
authenticate,
requireAdmin,
async(req:any,res)=>{


try{



const users =
await pool.query(
`
SELECT COUNT(*) total
FROM users
`
);




const transactions =
await pool.query(
`
SELECT
COUNT(*) total,
COALESCE(SUM(amount),0) volume
FROM transactions
`
);





const banks =
await pool.query(
`
SELECT
COUNT(*) total,
COALESCE(SUM(amount),0) volume
FROM bank_transactions
`
);






const risks =
await pool.query(
`
SELECT COUNT(*) total
FROM audit_logs
WHERE category='SECURITY'
`
);







res.json({

users:
Number(users.rows[0].total),


transactions:
Number(transactions.rows[0].total),


transactionVolume:
Number(transactions.rows[0].volume),



bankTransactions:
Number(banks.rows[0].total),


bankVolume:
Number(banks.rows[0].volume),



securityAlerts:
Number(risks.rows[0].total)


});






}catch(error){


console.error(error);



res.status(500).json({

error:'Failed loading reports'

});


}



}
);

// ============================
// ADMIN CSV EXPORT ENGINE
// ============================


const exportCSV =
(
res:any,
filename:string,
data:any[]
)=>{


const parser =
new Parser();


const csv =
parser.parse(data);


res.header(
'Content-Type',
'text/csv'
);


res.attachment(
filename
);


return res.send(csv);


};






// AUDIT EXPORT

router.get(
'/export/audit.csv',
authenticate,
requireAdmin,
async(req,res)=>{


const result =
await pool.query(
`
SELECT *
FROM audit_logs
ORDER BY created_at DESC
`
);


return exportCSV(
res,
'audit_logs.csv',
result.rows
);


}
);







// BANK EXPORT

router.get(
'/export/banking.csv',
authenticate,
requireAdmin,
async(req,res)=>{


const result =
await pool.query(
`
SELECT *
FROM bank_transactions
ORDER BY created_at DESC
`
);



return exportCSV(
res,
'bank_transactions.csv',
result.rows
);


}
);







// TRANSACTION EXPORT

router.get(
'/export/transactions.csv',
authenticate,
requireAdmin,
async(req,res)=>{


const result =
await pool.query(
`
SELECT *
FROM transactions
ORDER BY created_at DESC
`
);



return exportCSV(
res,
'transactions.csv',
result.rows
);


}
);

// ===============================
// ADMIN SECURITY MONITOR
// ===============================

router.get(

'/security',

authenticate,

requireAdmin,

async(req,res)=>{


try{



const sessions =

await pool.query(

`

SELECT

s.*,

u.phone,

u.full_name

FROM user_sessions s

LEFT JOIN users u

ON u.id=s.user_id

ORDER BY s.created_at DESC

LIMIT 50

`

);






const devices =

await pool.query(

`

SELECT

d.*,

u.phone,

u.full_name

FROM device_logs d

LEFT JOIN users u

ON u.id=d.user_id

ORDER BY d.created_at DESC

LIMIT 50

`

);







const events =

await pool.query(

`

SELECT

e.*,

u.phone,

u.full_name

FROM security_events e

LEFT JOIN users u

ON u.id=e.user_id

ORDER BY e.created_at DESC

LIMIT 100

`

);







res.json({

sessions:sessions.rows,

devices:devices.rows,

events:events.rows

});






}catch(error){



res.status(500).json({

error:'Failed to load security monitor'

});



}

}

);

// ===============================
// ADMIN FRAUD CENTER
// ===============================

router.get(

'/fraud',

authenticate,

requireAdmin,

async(req,res)=>{


try{



const risks = await pool.query(

`

SELECT

r.*,

u.phone,

u.full_name

FROM risk_scores r

LEFT JOIN users u

ON u.id=r.user_id

ORDER BY r.created_at DESC

LIMIT 100

`

);








const holds = await pool.query(

`

SELECT

h.*,

u.phone,

u.full_name

FROM transaction_holds h

LEFT JOIN users u

ON u.id=h.user_id

ORDER BY h.created_at DESC

LIMIT 100

`

);








res.json({

risks:risks.rows,

holds:holds.rows

});








}catch(error){



console.error(error);



res.status(500).json({

error:'Failed loading fraud center'

});



}



}

);

export default router;