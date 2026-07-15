import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import pool from '../../database/connection';
import bcrypt from 'bcryptjs';

import { createNotification } from '../services/notification.service';
import { createAuditLog } from '../services/audit.service';
import { emitBalanceUpdate } from '../socket';
import { calculateRisk } from '../services/fraud.service';

const router = Router();

// LINK BANK ACCOUNT

router.post('/link', authenticate, async (req: any, res) => {
  try {
    const {
      bankName,
      accountNumber
    } = req.body;

    res.json({
      success: true,
      message: 'Bank account linked',
      bank: {
        bankName,
        accountNumber,
        verified: true
      }
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      error: 'Bank link failed'
    });

  }
});

// GET BANK ACCOUNTS

router.get('/accounts',authenticate,async(req:any,res)=>{


try{


res.json({

accounts:[

{

bankName:'BSP Financial Group',

status:'linked'

}

]

});



}catch(error){


res.status(500).json({

error:'Failed loading accounts'

});


}



});










// BANK HISTORY

router.get('/transactions',authenticate,async(req:any,res)=>{


try{


const result = await pool.query(

`

SELECT *

FROM bank_transactions

WHERE user_id=$1

ORDER BY created_at DESC

`,

[req.user.id]

);





res.json({

transactions:result.rows

});





}catch(error){


res.status(500).json({

error:'Failed loading bank transactions'

});


}



});











// CASH IN

router.post('/cash-in',authenticate,async(req:any,res)=>{


try{


const {

bankName,

accountNumber,

amount

}=req.body;





const reference =

'BANK-' + Date.now();








await pool.query(

`

INSERT INTO bank_transactions

(

user_id,

bank_name,

account_number,

type,

amount,

status,

reference_id,

verified,

verification_method

)

VALUES

($1,$2,$3,'cash_in',$4,'completed',$5,true,'SYSTEM')

`,

[

req.user.id,

bankName,

accountNumber,

amount,

reference

]

);









await pool.query(

`

UPDATE wallets

SET balance=balance+$1

WHERE user_id=$2

`,

[

amount,

req.user.id

]

);









const balance = await pool.query(

`

SELECT balance

FROM wallets

WHERE user_id=$1

`,

[req.user.id]

);







emitBalanceUpdate(

req.user.id,

Number(balance.rows[0].balance)

);









await createNotification({

userId:req.user.id,

type:'bank_cash_in',

title:'🏦 Cash In Successful',

message:`PGK ${amount} added from ${bankName}`,

data:{reference}

});









res.json({

success:true,

reference

});








}catch(error){


console.error(error);


res.status(500).json({

error:'Cash in failed'

});


}



});











// CASH OUT SECURED

router.post('/cash-out',authenticate,async(req:any,res)=>{


try{



const {

bankName,

accountNumber,

amount,

pin

}=req.body;








const user = await pool.query(

`

SELECT pin_hash

FROM users

WHERE id=$1

`,

[req.user.id]

);








if(!user.rows.length){


return res.status(401).json({

error:'User not found'

});


}









const validPin =

await bcrypt.compare(

pin,

user.rows[0].pin_hash

);








if(!validPin){


return res.status(403).json({

error:'Invalid PIN'

});


}










// FRAUD ENGINE CHECK

const risk =

await calculateRisk(

req.user.id,

Number(amount)

);








if(risk.riskLevel==='high'){


await createAuditLog({
  userId: req.user.id,

  action: "FRAUD_BLOCK",

  category: "SECURITY",

  description: `High risk cash out blocked PGK ${amount}`,

  metadata: risk,

  ipAddress: req.ip,
});





return res.status(403).json({

error:'Transaction held for security review',

risk

});


}











const reference =

'BANK-' + Date.now();









const wallet = await pool.query(

`

UPDATE wallets

SET balance=balance-$1

WHERE user_id=$2

AND balance >= $1

RETURNING balance

`,

[

amount,

req.user.id

]

);









if(wallet.rows.length===0){


return res.status(400).json({

error:'Insufficient balance'

});


}










emitBalanceUpdate(

req.user.id,

Number(wallet.rows[0].balance)

);










await pool.query(

`

INSERT INTO bank_transactions

(

user_id,

bank_name,

account_number,

type,

amount,

status,

reference_id,

risk_level,

verified,

verification_method

)

VALUES

(

$1,$2,$3,'cash_out',$4,

'completed',$5,$6,true,'PIN'

)

`,

[

req.user.id,

bankName,

accountNumber,

amount,

reference,

risk.riskLevel

]

);









await createAuditLog({

userId:req.user.id,

action:'BANK_CASH_OUT',

category:'BANKING',

description:`Cash out PGK ${amount} to ${bankName}`,

metadata:{

bankName,

amount,

reference,

risk

},

ipAddress:req.ip

});









await createNotification({

userId:req.user.id,

type:'bank_cash_out',

title:'🔐 Bank Withdrawal',

message:`PGK ${amount} sent to ${bankName}`,

data:{

reference,

risk:risk.riskLevel

}

});










res.json({

success:true,

reference,

risk:risk.riskLevel

});








}catch(error){



console.error(error);



res.status(500).json({

error:'Secure cash out failed'

});



}



});










export default router;