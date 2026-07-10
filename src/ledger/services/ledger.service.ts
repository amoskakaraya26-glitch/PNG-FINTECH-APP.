import { v4 as uuid } from 'uuid';


export type LedgerEntryType =
  'DEBIT' | 'CREDIT';



interface LedgerEntry {

  id:string;

  transactionId:string;

  walletId:string;

  type:LedgerEntryType;

  amount:number;

  currency:string;

}





class LedgerService {


private entries:LedgerEntry[] = [];




createEntry(

entry:Omit<LedgerEntry,'id'>

){

const createdEntry = {

id:uuid(),

...entry

};


this.entries.push(createdEntry);


return createdEntry;


}








getBalance(

walletId:string

){


return this.entries

.filter(
e => e.walletId === walletId
)

.reduce(

(balance,e)=>{


return e.type === 'CREDIT'

? balance + e.amount

: balance - e.amount;



},0);


}








clear(){

this.entries=[];

}



}




export default new LedgerService();