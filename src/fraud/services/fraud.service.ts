import {

FraudResult

} from '../models/fraud.model';




class FraudService {


private readonly DAILY_LIMIT = 5000;




checkTransfer(

data:{

userId:string;

amount:number;

failedAttempts?:number;

}

):FraudResult {



let riskScore = 0;


const reasons:string[]=[];





if(data.amount > this.DAILY_LIMIT){


riskScore += 70;


reasons.push(

'Daily transaction limit exceeded'

);


}






if(

(data.failedAttempts || 0) >= 3

){


riskScore += 40;


reasons.push(

'Multiple failed attempts'

);


}







if(riskScore >= 80){


return {

decision:'BLOCK',

riskScore,

reasons

};


}





if(riskScore >= 40){


return {

decision:'REVIEW',

riskScore,

reasons

};


}






return {

decision:'APPROVE',

riskScore,

reasons

};



}



}




export default new FraudService();