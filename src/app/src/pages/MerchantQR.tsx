import React,{
useEffect,
useState
} from 'react';

import QRCode from 'qrcode';

import {useAuth} from '../context/AuthContext';

import './MerchantQR.css';



const MerchantQR:React.FC=()=>{


const {user}=useAuth();


const [qr,setQr]=useState('');

const [link,setLink]=useState('');




useEffect(()=>{


const generate=async()=>{


if(!user)return;



const payLink =

`http://localhost:3001/merchant?phone=${user.phone}&name=${user.fullName || 'Merchant'}`;



setLink(payLink);



const image =
await QRCode.toDataURL(
payLink
);



setQr(image);


};



generate();


},[user]);






const downloadQR=()=>{


const a =
document.createElement('a');


a.href=qr;


a.download=
'PNG-Wallet-Merchant-QR.png';


a.click();


};







const shareQR=async()=>{


if(
navigator.share
){


await navigator.share({

title:'PNG Wallet Merchant QR',

text:'Scan to pay me with PNG Wallet',

url:link

});


}else{


await navigator.clipboard.writeText(
link
);


alert(
'Payment link copied'
);


}


};








return(

<div className="merchant-qr-page">


<div className="merchant-card">



<div className="logo">

🇵🇬 PNG Wallet

</div>



<h2>

🏪 {user?.fullName}

</h2>




<div className="badge">

✓ VERIFIED MERCHANT

</div>





<div className="qr-box">


{
qr &&

<img

src={qr}

alt="Merchant QR"

/>

}


</div>





<div className="scan-text">

Scan to Pay

</div>




<p className="phone">

{user?.phone}

</p>







<div className="qr-actions">


<button onClick={shareQR}>

Share QR

</button>



<button onClick={downloadQR}>

Download

</button>


</div>





</div>


</div>


);


};



export default MerchantQR;