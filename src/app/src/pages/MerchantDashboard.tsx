import React,{
useEffect,
useState
} from 'react';

import jsPDF from 'jspdf';

import {apiFetch} from '../utils/api';

import './MerchantDashboard.css';





const MerchantDashboard:React.FC=()=>{


const [data,setData]=
useState<any>(null);







useEffect(()=>{


const load=async()=>{


try{


const res=
await apiFetch(
'/api/merchant/dashboard'
);



if(res.ok){


setData(
await res.json()
);


}



}catch(error){


console.error(error);


}



};



load();



},[]);









const downloadReport=()=>{


if(!data)return;



const pdf=
new jsPDF();



let y=20;



pdf.setFontSize(18);


pdf.text(
'PNG Wallet Merchant Report',
20,
y
);



y+=15;



pdf.setFontSize(12);



pdf.text(
`Total Sales: PGK ${data.sales.toFixed(2)}`,
20,
y
);


y+=10;



pdf.text(
`Payments: ${data.payments}`,
20,
y
);


y+=10;




pdf.text(
`Average Sale: PGK ${data.average.toFixed(2)}`,
20,
y
);



y+=20;




pdf.text(
'Transactions:',
20,
y
);



y+=10;





data.recent.forEach(
(tx:any)=>{


pdf.text(
`${tx.customer || 'Customer'} - PGK ${Number(tx.amount).toFixed(2)}`,
20,
y
);



y+=8;



pdf.text(

new Date(
tx.created_at
)
.toLocaleString(),

25,

y

);



y+=12;



}
);






pdf.text(
'PNG Wallet - Papua New Guinea',
20,
280
);




pdf.save(
'PNG-Wallet-Sales-Report.pdf'
);



};









if(!data){


return(

<div className="merchant-dashboard">

Loading...

</div>

);


}











return(

<div className="merchant-dashboard">






<div className="md-header">


<h1>

🇵🇬 Merchant Dashboard

</h1>



<p>

Business sales overview

</p>



</div>









<div className="sales-card">



<span>

TODAY'S SALES

</span>




<h1>

PGK {data.sales.toFixed(2)}

</h1>





<button

onClick={downloadReport}

>

📄 Download Report

</button>




</div>










<div className="stats-grid">





<div className="stat-card">


<h2>

💳 {data.payments}

</h2>


<p>

Payments

</p>


</div>







<div className="stat-card">


<h2>

📈 PGK {data.average.toFixed(2)}

</h2>


<p>

Average Sale

</p>



</div>






</div>









<div className="payments">



<h2>

Recent Payments

</h2>






{
data.recent.length===0 &&


<p>

No payments yet

</p>


}








{
data.recent.map(
(tx:any,index:number)=>(



<div

className="payment-card"

key={index}

>



<div>


<strong>

✓ {tx.customer || 'Customer'}

</strong>




<small>


{
new Date(
tx.created_at
)
.toLocaleString()
}


</small>



</div>






<span>

PGK {Number(tx.amount).toFixed(2)}

</span>





</div>



)
)
}






</div>





</div>


);



};





export default MerchantDashboard;