import { v4 as uuid } from 'uuid';

import db from '../../database/connection';




export interface LedgerRecord {

walletId:string;

transactionId:string;

type:'CREDIT'|'DEBIT';

amount:number;

currency:string;

}






class LedgerRepository {





async createEntry(

entry:LedgerRecord

){

const id = uuid();



const result = await db.query(

`

INSERT INTO ledger_entries (

id,

wallet_id,

transaction_id,

type,

amount,

currency

)

VALUES ($1,$2,$3,$4,$5,$6)

RETURNING *

`,

[

id,

entry.walletId,

entry.transactionId,

entry.type,

entry.amount,

entry.currency

]

);




return result.rows[0];

}










async getBalance(

walletId:string

){



const result = await db.query(

`

SELECT

COALESCE(

SUM(

CASE

WHEN type='CREDIT'

THEN amount

ELSE -amount

END

),0

) AS balance

FROM ledger_entries

WHERE wallet_id=$1

`,

[walletId]

);




return Number(

result.rows[0].balance

);



}











async getHistory(

walletId:string

){



const result = await db.query(

`

SELECT *

FROM ledger_entries

WHERE wallet_id=$1

ORDER BY created_at DESC

`,

[walletId]

);




return result.rows;


}





}




export default new LedgerRepository();