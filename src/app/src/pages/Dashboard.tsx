import React,{useEffect,useState} from 'react';
import {Link} from 'react-router-dom';
import './Dashboard.css';
import {apiFetch} from '../utils/api';

interface Wallet{
id:string;
balance:number;
status:string;
}

const Dashboard:React.FC=()=>{

const [wallet,setWallet]=useState<Wallet|null>(null);
const [loading,setLoading]=useState(true);

useEffect(()=>{

const load=async()=>{

try{

const res=await apiFetch('/api/wallet/me');

if(res.ok){

const data=await res.json();

setWallet(data.wallet);

}

}catch(e){

console.error(e);

}finally{

setLoading(false);

}

};

load();

},[]);


if(loading){

return <div className="dashboard">Loading...</div>;

}



const features=[

{
icon:'💰',
title:'Digital Wallet',
text:'Manage balance, receipts and transactions.',
link:'/wallet',
button:'Open Wallet'
},

{
icon:'💸',
title:'Send Money',
text:'Instant PNG Wallet transfers.',
link:'/send',
button:'Send'
},

{
icon:'🏪',
title:'Merchant Payments',
text:'Pay shops, SMEs and businesses.',
link:'/merchant',
button:'Pay Merchant'
},
{
icon:'📱',
title:'My Merchant QR',
text:'Display your QR and accept customer payments.',
link:'/merchant-qr',
button:'Show QR'
},
{
icon:'📊',
title:'Merchant Dashboard',
text:'Track sales, payments and customers.',
link:'/merchant-dashboard',
button:'View Sales'
},

{
icon:'📷',
title:'Scan QR',
text:'Scan wallet and merchant QR codes.',
link:'/scan',
button:'Scan'
},

{
icon:'🧾',
title:'Receipts',
text:'View transaction history and receipts.',
link:'/history',
button:'View'
},

{
icon:'🏦',
title:'Bank Integration',
text:'Connect BSP, KINA and banks.',
link:'/banks',
button:'Link Bank'
},

{
icon:'🆔',
title:'Savis KYC',
text:'Secure digital identity verification.',
link:'/kyc',
button:'Verify'
},

{
icon:'📊',
title:'Analytics',
text:'Track spending insights.',
link:'/analytics',
button:'View'
},

{
icon:'👥',
title:'Contacts',
text:'Manage saved recipients.',
link:'/contacts',
button:'Open'
},

{
icon:'🔁',
title:'Scheduled Payments',
text:'Manage future payments.',
link:'/scheduled',
button:'Manage'
},

{
icon:'🎁',
title:'Referrals',
text:'Invite friends and earn rewards.',
link:'/referrals',
button:'Invite'
},

{
icon:'🔐',
title:'Security',
text:'PIN and account protection.',
link:'/security',
button:'Secure'
},

{
icon:'🔔',
title:'Notifications',
text:'Wallet alerts and updates.',
link:'/notifications',
button:'View'
},

{
icon:'🆘',
title:'Support',
text:'Help center and disputes.',
link:'/support',
button:'Get Help'
},

{
icon:'👑',
title:'Admin Control Center',
text:'Manage PNG Wallet revenue and operations.',
link:'/admin',
button:'Open Admin',
adminOnly:true
}

];



return(

<div className="dashboard">


<div className="dashboard-header">

<h1>🇵🇬 PNG Wallet</h1>

<p>The smart wallet for Papua New Guinea</p>

</div>




<div className="dashboard-content">


{
wallet &&

<div className="wallet-summary">

<h2>Your Wallet</h2>


<div className="wallet-card">

<div className="balance">

<span className="currency">PGK</span>

<span className="amount">

{wallet.balance.toFixed(2)}

</span>

</div>


<p>Status: {wallet.status}</p>

<p>Wallet ID: {wallet.id.slice(0,8)}...</p>


<Link 
to="/wallet"
className="btn btn-primary">

Manage Wallet

</Link>


</div>

</div>

}




<div className="features-grid">


{
features.map((f)=>(


<div 
className="feature-card"
key={f.title}
>


<h3>

{f.icon} {f.title}

</h3>


<p>

{f.text}

</p>



<Link
to={f.link}
className="btn btn-secondary"
>

{f.button}

</Link>



</div>


))

}


</div>


</div>


</div>


);


};


export default Dashboard;