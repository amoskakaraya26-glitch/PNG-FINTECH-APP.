import { Wallet, Transaction } from '../../common/types';

import {
  CURRENCY_PGK,
  MIN_TRANSFER_AMOUNT,
  MAX_TRANSFER_AMOUNT,
} from '../../common/constants';

import { v4 as uuidv4 } from 'uuid';

import { db } from '../../database/connection';



export class WalletService {



  private mapWallet(row:any): Wallet {


    return {

      id: row.id,

      userId: row.user_id,

      balance: parseFloat(row.balance),

      currency: row.currency,

      status: row.status,

      createdAt: row.created_at,

      updatedAt: row.updated_at,

    };


  }








  async createWallet(
    userId:string,
    initialBalance:number = 0
  ):Promise<Wallet>{



    const result =
    await db.query(
      `
      INSERT INTO wallets
      (
        id,
        user_id,
        balance,
        currency,
        status
      )

      VALUES
      ($1,$2,$3,$4,'active')

      RETURNING *
      `,
      [
        uuidv4(),
        userId,
        initialBalance,
        CURRENCY_PGK,
      ]
    );



    return this.mapWallet(
      result.rows[0]
    );


  }











  async getWallet(
    walletId:string
  ):Promise<Wallet|null>{


    const result =
    await db.query(
      `
      SELECT *
      FROM wallets
      WHERE id=$1
      `,
      [walletId]
    );



    if(result.rows.length===0){

      return null;

    }



    return this.mapWallet(
      result.rows[0]
    );


  }











  async getWalletByUserId(
    userId:string
  ):Promise<Wallet|null>{



    const result =
    await db.query(
      `
      SELECT *
      FROM wallets
      WHERE user_id=$1
      LIMIT 1
      `,
      [userId]
    );



    if(result.rows.length===0){

      return null;

    }



    return this.mapWallet(
      result.rows[0]
    );


  }












  async topup(
    walletId:string,
    amount:number
  ):Promise<Transaction>{



    const client =
    await db.getClient();



    try{


      await client.query('BEGIN');



      await client.query(
        `
        UPDATE wallets

        SET

        balance =
        balance + $1::numeric,

        updated_at=NOW()

        WHERE id=$2
        `,
        [
          amount,
          walletId,
        ]
      );





      const txId =
      uuidv4();



      const referenceId =
      `PNG-${Date.now()}`;





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
          reference_id
        )

        VALUES
        ($1,$2,$3,$4,$5,$6,$7,$8)
        `,
        [
          txId,
          walletId,
          'topup',
          amount,
          CURRENCY_PGK,
          'completed',
          'Wallet topup',
          referenceId,
        ]
      );



      await client.query('COMMIT');



      return {

        id:txId,

        walletId,

        type:'topup',

        amount,

        currency:CURRENCY_PGK,

        status:'completed',

        description:'Wallet topup',

        referenceId,

        timestamp:new Date(),


      } as any;





    }catch(error){


      await client.query('ROLLBACK');


      throw error;


    }finally{


      client.release();


    }


  }











async transfer(
fromWalletId:string,
toWalletId:string,
amount:number
):Promise<Transaction>{


if(
amount < MIN_TRANSFER_AMOUNT ||
amount > MAX_TRANSFER_AMOUNT
){

throw new Error(
'Invalid transfer amount'
);

}



const client =
await db.getClient();



try{


await client.query('BEGIN');



const wallets =
await client.query(
`
SELECT *
FROM wallets
WHERE id IN ($1,$2)
FOR UPDATE
`,
[
fromWalletId,
toWalletId
]
);




if(wallets.rows.length!==2){

throw new Error(
'Wallet not found'
);

}



const senderWallet =
wallets.rows.find(
(w:any)=>w.id===fromWalletId
);



if(
parseFloat(senderWallet.balance)
<
amount
){

throw new Error(
'Insufficient balance'
);

}





const sender =
(
await client.query(
`
SELECT u.*
FROM users u
JOIN wallets w
ON w.user_id=u.id
WHERE w.id=$1
`,
[fromWalletId]
)
).rows[0];




const receiver =
(
await client.query(
`
SELECT u.*
FROM users u
JOIN wallets w
ON w.user_id=u.id
WHERE w.id=$1
`,
[toWalletId]
)
).rows[0];





// PNG WALLET REVENUE ENGINE

const fee =
Math.max(
amount * 0.005,
0.10
);


const merchantAmount =
amount - fee;






await client.query(
`
UPDATE wallets

SET balance =

CASE

WHEN id=$1
THEN balance-$2::numeric

WHEN id=$3
THEN balance+$4::numeric

END,

updated_at=NOW()

WHERE id IN ($1,$3)
`,
[
fromWalletId,
amount,
toWalletId,
merchantAmount
]
);








const referenceId =
`PNG-${Date.now()}`;


const sendTx =
uuidv4();


const receiveTx =
uuidv4();








await client.query(
`
INSERT INTO transactions
(
id,
wallet_id,
sender_id,
receiver_id,
type,
amount,
currency,
fee,
status,
description,
reference_id
)

VALUES
($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
`,
[
sendTx,
fromWalletId,
sender.id,
receiver.id,
'transfer',
amount,
CURRENCY_PGK,
fee,
'completed',
`Transfer to ${receiver.full_name}`,
referenceId
]
);








await client.query(
`
INSERT INTO transactions
(
id,
wallet_id,
sender_id,
receiver_id,
type,
amount,
currency,
fee,
status,
description,
reference_id
)

VALUES
($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
`,
[
receiveTx,
toWalletId,
sender.id,
receiver.id,
'received',
merchantAmount,
CURRENCY_PGK,
fee,
'completed',
`Received from ${sender.full_name}`,
referenceId
]
);






await client.query('COMMIT');





return {

id:sendTx,

walletId:fromWalletId,

type:'transfer',

amount,

currency:CURRENCY_PGK,

fee,

status:'completed',

description:
`Transfer to ${receiver.full_name}`,

referenceId,

timestamp:new Date()

} as any;






}catch(error){


await client.query('ROLLBACK');

throw error;


}
finally{


client.release();


}



}











  // STEP 53.1
  // Receipt details included here


  async getTransactionHistory(
    walletId:string
  ):Promise<Transaction[]>{



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


      WHERE t.wallet_id=$1


      ORDER BY t.created_at DESC
      `,
      [walletId]
    );







    return result.rows.map(
      (row:any)=>({


        id:
        row.id,


        walletId:
        row.wallet_id,


        type:
        row.type,


        amount:
        parseFloat(row.amount),

        fee:
        parseFloat(row.fee || 0),

        currency:
        row.currency,


        status:
        row.status,


        description:
        row.description,


        referenceId:
        row.reference_id,


        senderName:
        row.sender_name,


        senderPhone:
        row.sender_phone,


        receiverName:
        row.receiver_name,


        receiverPhone:
        row.receiver_phone,


        timestamp:
        row.created_at,


      }) as any
    );


  }



}