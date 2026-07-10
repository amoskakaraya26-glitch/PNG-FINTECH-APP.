import React,{useEffect,useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {adminAPI} from '../services/api';
import {useAuth} from '../context/AuthContext';
import toast from 'react-hot-toast';
import './AdminDashboard.css';



const AdminDashboard:React.FC=()=>{


const navigate = useNavigate();

const {user}=useAuth();



const [tab,setTab]=
useState('overview');



const [revenue,setRevenue]=
useState<any>({});

const [users,setUsers]=
useState<any[]>([]);

const [transactions,setTransactions]=
useState<any[]>([]);

const [alerts,setAlerts]=
useState<any[]>([]);

const [settlements,setSettlements]=
useState<any[]>([]);

const [bankMonitor,setBankMonitor]=
useState<any[]>([]);

const [auditLogs,setAuditLogs]=
useState<any[]>([]);

const [reports,setReports]=
useState<any>({});



const [security,setSecurity]=
useState<any>({

sessions:[],

devices:[],

events:[]

});



const [fraud,setFraud]=
useState<any>({

risks:[],

holds:[]

});






const isAdmin =

(user as any)?.is_admin ||

(user as any)?.isAdmin;








useEffect(()=>{


if(!isAdmin){


navigate('/dashboard');

return;


}



loadAll();



},[isAdmin,navigate]);









const loadAll =
async()=>{


try{



const rev =
await adminAPI.getRevenue();

setRevenue(rev.data);




const usr =
await adminAPI.getUsers({});

setUsers(

usr.data.users ||

usr.data ||

[]

);





const tx =
await adminAPI.getTransactions({});

setTransactions(

tx.data.transactions ||

tx.data ||

[]

);






const comp =
await adminAPI.getCompliance();

setAlerts(

comp.data.alerts ||

[]

);






const settle =
await adminAPI.getSettlements();

setSettlements(

settle.data.settlements ||

[]

);






const banks =
await adminAPI.getBankMonitor();

setBankMonitor(

banks.data.transactions ||

[]

);






const audit =
await adminAPI.getAuditLogs();

setAuditLogs(

audit.data.logs ||

[]

);






const report =
await adminAPI.getReports();

setReports(

report.data ||

{}

);






const sec =
await adminAPI.getSecurity();

setSecurity(

sec.data

);





const fraudRes =
await adminAPI.getFraud();

setFraud(

fraudRes.data

);







}catch(error){


console.error(error);


}


};









const toggleUser =
async(u:any)=>{


try{


await adminAPI.updateUserStatus(

u.id,

u.status==='active'

?

'suspended'

:

'active'

);



toast.success(

'User updated'

);



loadAll();



}catch{


toast.error(

'Failed'

);


}


};









const approveSettlement =
async(id:string)=>{


try{


await adminAPI.approveSettlement(

id

);



toast.success(

'Settlement approved'

);



loadAll();



}catch{


toast.error(

'Approval failed'

);


}


};









const downloadExport =
(type:string)=>{


const token =
localStorage.getItem('token');



const apiUrl =

process.env.REACT_APP_API_URL ||

'http://localhost:3000';




window.open(

`${apiUrl}/api/admin/export/${type}.csv?token=${token}`,

'_blank'

);


};








if(!isAdmin){

return null;

}

return(

<div className="admin-dashboard">


<div className="admin-header">


<button
className="back-btn"
onClick={()=>navigate('/dashboard')}
>

←

</button>


<div className="page-title">

🇵🇬 PNG Wallet Admin

</div>


<span className="admin-badge">

OWNER

</span>


</div>







<div className="tab-bar">


{[

['overview','📊 Overview'],

['users','👥 Users'],

['transactions','📋 Transactions'],

['compliance','🚨 Compliance'],

['settlements','🏦 Settlements'],

['banks','🏛️ Bank Monitor'],

['audit','📚 Audit Logs'],

['reports','📈 Reports'],

['exports','📤 Exports'],

['security','🔐 Security'],

['fraud','🚨 Fraud']

].map(([id,label])=>(



<button

key={id}

onClick={()=>setTab(id)}

>


{label}


</button>


))}



</div>








<div className="admin-content">







{tab==='overview' && (

<div className="stats-grid">


<div className="stat-card">

💰 Revenue

<h2>

PGK {Number(revenue.revenue||0).toFixed(2)}

</h2>

</div>



<div className="stat-card">

💳 Volume

<h2>

PGK {Number(revenue.volume||0).toFixed(2)}

</h2>

</div>



<div className="stat-card">

🔁 Transactions

<h2>

{revenue.transactions||0}

</h2>

</div>


</div>

)}









{tab==='users' && (

<div>


{users.map((u:any)=>(


<div
className="tx-row"
key={u.id}
>


<div>

👤 {u.full_name}

<br/>

{u.phone}


</div>



<button
onClick={()=>toggleUser(u)}
>

{
u.status==='active'

?

'Suspend'

:

'Activate'
}

</button>


</div>


))}


</div>

)}










{tab==='transactions' && (

<div>


{transactions.map((tx:any)=>(


<div
className="tx-row"
key={tx.id}
>


<div>

💸 {tx.type}

</div>


<strong>

PGK {Number(tx.amount).toFixed(2)}

</strong>


</div>


))}


</div>

)}











{tab==='security' && (

<div>


<h2>

🔐 Security Center

</h2>




<h3>

🚨 Events

</h3>


{security.events.map((e:any)=>(


<div
className="tx-row"
key={e.id}
>


<div>

<strong>

{e.event_type}

</strong>


<br/>


{e.description}


<br/>


👤 {e.full_name || 'System'}


</div>


</div>


))}







<h3>

📱 Devices

</h3>



{security.devices.map((d:any)=>(


<div
className="tx-row"
key={d.id}
>


<div>


{d.device_name}


<br/>


🌐 {d.ip_address}


</div>


</div>


))}








<h3>

🔑 Sessions

</h3>



{security.sessions.map((s:any)=>(


<div
className="tx-row"
key={s.id}
>


<div>


{s.full_name}


<br/>


{s.device_name}


</div>


</div>


))}



</div>

)}









{tab==='fraud' && (

<div>


<h2>

🚨 Fraud Control Center

</h2>






<h3>

📊 Risk Scores

</h3>




{fraud.risks.map((r:any)=>(


<div
className="tx-row"
key={r.id}
>


<div>


<strong>

Risk: {r.risk_level}

</strong>


<br/>


Score: {r.score}


<br/>


👤 {r.full_name || 'Unknown'}


<br/>


Reasons: {JSON.stringify(r.reasons)}


</div>


</div>


))}









<h3>

⏸ Transaction Holds

</h3>




{fraud.holds.map((h:any)=>(


<div
className="tx-row"
key={h.id}
>


<div>


<strong>

{h.status}

</strong>


<br/>


👤 {h.full_name || 'Unknown'}


<br/>


Reason: {h.reason}


</div>


</div>


))}



</div>

)}








</div>


</div>

);


};




export default AdminDashboard;