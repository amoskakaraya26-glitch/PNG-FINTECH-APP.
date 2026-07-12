import { v4 as uuid } from 'uuid';

import db from '../../database/connection';

import {

TransactionStatus

} from '../models/transaction.model';




class TransactionRepository {





async create(

data:{

fromWallet:string;

toWallet:string;

amount:number;

currency:string;

}

){



const id = uuid();



const result = await db.query(

`

INSERT INTO transactions (

id,

from_wallet,

to_wallet,

amount,

currency,

status

)

VALUES ($1,$2,$3,$4,$5,$6)

RETURNING *

`,

[

id,

data.fromWallet,

data.toWallet,

data.amount,

data.currency,

'CREATED'

]

);



return result.rows[0];

}









async updateStatus(

id:string,

status:TransactionStatus

){



const result = await db.query(

`

UPDATE transactions

SET status=$2,

updated_at=CURRENT_TIMESTAMP

WHERE id=$1

RETURNING *

`,

[

id,

status

]

);



return result.rows[0] || null;

}









async findById(

id:string

){



const result = await db.query(

`

SELECT *

FROM transactions

WHERE id=$1

`,

[id]

);



return result.rows[0] || null;


}




}



export default new TransactionRepository();