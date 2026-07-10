import { Router } from "express";
import { db } from '../../database/connection';

const router = Router();


router.get(
"/verify/:receiptId",
async(req,res)=>{


try{


const { receiptId } =
req.params;



const result =
await db.query(
`

SELECT

t.*,

sender.full_name AS sender_name,
sender.phone AS sender_phone,

receiver.full_name AS receiver_name,
receiver.phone AS receiver_phone

FROM transactions t


LEFT JOIN users sender
ON sender.id=t.sender_id


LEFT JOIN users receiver
ON receiver.id=t.receiver_id


WHERE t.reference_id=$1

LIMIT 1

`,
[
receiptId
]
);



if(
result.rows.length === 0
){


return res.status(404).json({

valid:false,

message:
"Invalid receipt"

});


}




return res.json({

valid:true,

message:
"Genuine PNG Wallet Receipt",

transaction:
result.rows[0]

});





}catch(error){


console.error(error);



return res.status(500).json({

valid:false,

message:
"Verification failed"

});


}



}
);



export default router;