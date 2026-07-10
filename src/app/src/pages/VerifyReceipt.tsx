import React,{
useEffect,
useState
} from 'react';

import {
useParams
} from 'react-router-dom';

import './VerifyReceipt.css';



const VerifyReceipt:React.FC =()=>{


const {receiptId}=useParams();


const [loading,setLoading]=
useState(true);


const [data,setData]=
useState<any>(null);





useEffect(()=>{


const verify =
async()=>{


try{


const response =
await fetch(
`http://localhost:3000/api/receipt/verify/${receiptId}`
);



const result =
await response.json();


setData(result);



}catch(error){



setData({

valid:false,

message:'Verification failed'

});



}
finally{


setLoading(false);


}


};



verify();


},[receiptId]);








if(loading){


return(

<div className="verify-page">

<div className="verify-card">

<h2>

Checking receipt...

</h2>

</div>

</div>

);


}







if(!data?.valid){


return(

<div className="verify-page">


<div className="verify-card invalid">


<div className="verify-logo">

🇵🇬 PNG Wallet

</div>



<div className="verify-icon">

×

</div>


<div className="verify-title">

Invalid Receipt

</div>



<p>

This transaction could not be verified.

</p>



<div className="verify-footer">

Protected by PNG Wallet Security

</div>



</div>


</div>


);


}







const tx=data.transaction;





return(

<div className="verify-page">


<div className="verify-card">


<div className="verify-logo">

🇵🇬 PNG Wallet

</div>



<div className="verify-icon">

✓

</div>



<div className="verify-title">

Payment Verified

</div>




<h1 className="verify-amount">

PGK {Number(tx.amount).toFixed(2)}

</h1>






<div className="verify-row">

<span>

From

</span>


<strong>

{tx.sender_name}

<br/>

{tx.sender_phone}

</strong>


</div>






<div className="verify-row">

<span>

To

</span>


<strong>

{tx.receiver_name}

<br/>

{tx.receiver_phone}

</strong>


</div>







<div className="verify-row">

<span>

Reference

</span>


<strong>

{tx.reference_id}

</strong>


</div>







<div className="verify-row">

<span>

Status

</span>


<strong>

{tx.status.toUpperCase()}

</strong>


</div>






<div className="verify-footer">

✓ Verified securely by PNG Wallet

</div>



</div>


</div>


);


};



export default VerifyReceipt;