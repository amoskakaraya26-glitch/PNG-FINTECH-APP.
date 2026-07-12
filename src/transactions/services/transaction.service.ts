import { v4 as uuid } from 'uuid';


import {

WalletTransaction,

TransactionStatus

} from '../models/transaction.model';





class TransactionService {



private transactions:WalletTransaction[]=[];






create(

data:{

fromWallet:string;

toWallet:string;

amount:number;

currency?:string;

}

){


const transaction:WalletTransaction={

id:uuid(),

fromWallet:data.fromWallet,

toWallet:data.toWallet,

amount:data.amount,

currency:data.currency || 'PGK',

status:'CREATED',

createdAt:new Date(),

updatedAt:new Date()

};



this.transactions.push(transaction);



return transaction;


}









updateStatus(

id:string,

status:TransactionStatus

){


const tx = this.transactions.find(

t=>t.id===id

);



if(!tx){

return null;

}



tx.status=status;

tx.updatedAt=new Date();



return tx;


}









findById(

id:string

){


return this.transactions.find(

t=>t.id===id

);

}








clear(){

this.transactions=[];

}



}




export default new TransactionService();