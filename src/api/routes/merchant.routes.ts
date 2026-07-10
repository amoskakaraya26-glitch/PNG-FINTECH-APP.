import {Router} from 'express';

import {authenticate} from '../middleware/auth.middleware';

import {WalletService} from '../services/wallet.service';

import {db} from '../../database/connection';



const router=Router();

const walletService=new WalletService();




// ===============================
// SEARCH MERCHANT
// ===============================

router.get(
'/search/:query',
authenticate,
async(req:any,res)=>{

try{


const result=await db.query(
`
SELECT
id,
full_name,
phone

FROM users

WHERE

phone ILIKE $1

OR full_name ILIKE $1

LIMIT 10
`,
[
`%${req.params.query}%`
]
);



res.json(

result.rows.map(

(u:any)=>({

id:u.id,

business_name:u.full_name,

phone:u.phone,

category:'Merchant'

})

)

);



}catch{


res.status(500).json({

error:'Merchant search failed'

});


}


}
);









// ===============================
// PAY MERCHANT
// ===============================

router.post(
'/pay',
authenticate,
async(req:any,res)=>{


try{


const {
merchantPhone,
amount
}=req.body;



const merchant=await db.query(
`
SELECT

u.id,

w.id AS wallet_id


FROM users u


JOIN wallets w

ON w.user_id=u.id


WHERE u.phone=$1


LIMIT 1
`,
[
merchantPhone
]
);




if(!merchant.rows.length){

return res.status(404).json({

error:'Merchant not found'

});

}




const senderWallet=
await walletService.getWalletByUserId(
req.user.id
);




if(!senderWallet){

return res.status(404).json({

error:'Wallet not found'

});

}




const transaction=
await walletService.transfer(

senderWallet.id,

merchant.rows[0].wallet_id,

Number(amount)

);




res.json({

success:true,

message:'Merchant payment successful',

transaction

});





}catch(error:any){


res.status(400).json({

error:error.message ||
'Payment failed'

});


}


}
);











// ===============================
// MERCHANT DASHBOARD
// ===============================

router.get(
'/dashboard',
authenticate,
async(req:any,res)=>{


try{


const wallet=
await walletService.getWalletByUserId(
req.user.id
);



if(!wallet){

return res.status(404).json({

error:'Wallet not found'

});

}





const stats=
await db.query(
`
SELECT

COALESCE(SUM(amount),0)
AS total_sales,


COUNT(*)
AS payments,


COALESCE(AVG(amount),0)
AS average_sale


FROM transactions


WHERE wallet_id=$1


AND type='received'


AND DATE(created_at)=CURRENT_DATE
`,
[
wallet.id
]
);








const recent=
await db.query(
`
SELECT

t.amount,

t.created_at,

u.full_name AS customer


FROM transactions t


LEFT JOIN users u

ON u.id=t.sender_id


WHERE

t.wallet_id=$1


AND t.type='received'


ORDER BY

t.created_at DESC


LIMIT 10
`,
[
wallet.id
]
);







res.json({

sales:
Number(
stats.rows[0].total_sales
),


payments:
Number(
stats.rows[0].payments
),


average:
Number(
stats.rows[0].average_sale
),


recent:
recent.rows


});






}catch(error){



res.status(500).json({

error:'Dashboard failed'

});



}



}
);





export default router;