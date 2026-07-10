import React from 'react';
import {useNavigate} from 'react-router-dom';
import {useAuth} from '../context/AuthContext';
import './Profile.css';



const Profile:React.FC=()=>{


const navigate=useNavigate();

const {user,logout}=useAuth();



const name=

user?.full_name ||

user?.fullName ||

'PNG Wallet User';





const signOut=()=>{


logout();

navigate('/login');


};






const menu=[


{
icon:'🔐',
label:'Security & PIN',
path:'/security'
},


{
icon:'📋',
label:'Transaction History',
path:'/history'
},


{
icon:'🆔',
label:'KYC Verification',
path:'/kyc'
},


{
icon:'👥',
label:'Contacts',
path:'/contacts'
},


{
icon:'📊',
label:'Spending Analytics',
path:'/analytics'
},


{
icon:'📅',
label:'Scheduled Payments',
path:'/scheduled'
},


{
icon:'🎁',
label:'Referral Program',
path:'/referrals'
},


{
icon:'❓',
label:'Help & Support',
path:'/support'
},


{
icon:'🔔',
label:'Notifications',
path:'/notifications'
}


];








return(

<div className="profile">



<h1>

Profile

</h1>






<div className="profile-hero">


<div className="profile-avatar">

{name.charAt(0)}

</div>



<h2>

{name}

</h2>



<p>

{user?.phone}

</p>




<span className="kyc-status-badge">


{
user?.kycStatus==='verified'
?
'✅ Verified'
:
'⏳ Pending KYC'
}


</span>



</div>










{/* LOGOUT ALWAYS VISIBLE */}


<button

className="menu-item logout"

onClick={signOut}

>


<span className="menu-icon">

🚪

</span>


<span className="menu-label">

Logout

</span>



<span>

›

</span>


</button>









<div className="profile-menu">


{
menu.map(item=>(


<button

key={item.label}

className="menu-item"

onClick={()=>
navigate(item.path)
}

>


<span className="menu-icon">

{item.icon}

</span>



<span className="menu-label">

{item.label}

</span>



<span>

›

</span>



</button>


))

}


</div>





</div>


);


};




export default Profile;