import { v4 as uuid } from 'uuid';

import ledgerService from './ledger.service';



export interface TransferRequest {

senderWalletId:string;

receiverWalletId:string;

amount:number;

currency?:string;

}



export interface TransferResult {

success:boolean;

transactionId?:string;

error?:string;

}



class TransferService {



transfer(

request:TransferRequest

):TransferResult {


const {

senderWalletId,

receiverWalletId,

amount

}=request;




if(amount <= 0){

return {

success:false,

error:'Invalid amount'

};

}




const senderBalance =

ledgerService.getBalance(

senderWalletId

);



if(senderBalance < amount){

return {

success:false,

error:'Insufficient balance'

};

}




const transactionId = uuid();




try{


ledgerService.createEntry({

transactionId,

walletId:senderWalletId,

type:'DEBIT',

amount,

currency:

request.currency || 'PGK'

});




ledgerService.createEntry({

transactionId,

walletId:receiverWalletId,

type:'CREDIT',

amount,

currency:

request.currency || 'PGK'

});





return {

success:true,

transactionId

};



}catch(error){



return {

success:false,

error:'Transfer failed'

};



}



}



}



export default new TransferService();