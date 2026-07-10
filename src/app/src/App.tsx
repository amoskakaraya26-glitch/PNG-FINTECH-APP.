import React from 'react';
import {Routes,Route,Navigate} from 'react-router-dom';
import {Toaster} from 'react-hot-toast';
import './App.css';

import {AuthProvider,useAuth} from './context/AuthContext';

import BottomNav from './components/Layout/BottomNav';
import AIChat from './components/AIChat/AIChat';

import Landing from './pages/Landing';
import Onboarding from './pages/Onboarding';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Wallet from './pages/Wallet';
import SendMoney from './pages/SendMoney';
import TopUp from './pages/TopUp';
import ScanQR from './pages/ScanQR';
import Bills from './pages/Bills';
import Banks from './pages/Banks';
import Analytics from './pages/Analytics';
import Contacts from './pages/Contacts';
import Notifications from './pages/Notifications';
import TransactionHistory from './pages/TransactionHistory';
import Security from './pages/Security';
import Profile from './pages/Profile';
import ProfileQR from './pages/ProfileQR';
import Referrals from './pages/Referrals';
import Support from './pages/Support';
import Scheduled from './pages/Scheduled';
import AdminDashboard from './pages/AdminDashboard';

import MerchantPayment from './pages/MerchantPayment';
import MerchantQR from './pages/MerchantQR';
import MerchantDashboard from './pages/MerchantDashboard';

import KYC from './pages/KYC';
import VerifyReceipt from './pages/VerifyReceipt';




const ProtectedRoute:React.FC<{children:React.ReactNode}>=({children})=>{

const {user,loading}=useAuth();

if(loading){

return <div className="app-loading"><div className="spinner"/></div>;

}

return user?<>{children}</>:<Navigate to="/login" replace/>;

};





const PublicRoute:React.FC<{children:React.ReactNode}>=({children})=>{

const {user,loading}=useAuth();

if(loading){

return <div className="app-loading"><div className="spinner"/></div>;

}

return user?<Navigate to="/dashboard" replace/>:<>{children}</>;

};







const AppContent:React.FC=()=>{


const {user}=useAuth();


const protect=(page:React.ReactNode)=>(

<ProtectedRoute>

{page}

</ProtectedRoute>

);




return(

<div className="app-root">


<Routes>


<Route path="/" element={<PublicRoute><Landing/></PublicRoute>}/>

<Route path="/onboarding" element={<PublicRoute><Onboarding/></PublicRoute>}/>

<Route path="/login" element={<PublicRoute><Login/></PublicRoute>}/>

<Route path="/register" element={<PublicRoute><Register/></PublicRoute>}/>



<Route path="/dashboard" element={protect(<Dashboard/>)}/>

<Route path="/wallet" element={protect(<Wallet/>)}/>

<Route path="/send" element={protect(<SendMoney/>)}/>

<Route path="/topup" element={protect(<TopUp/>)}/>

<Route path="/scan" element={protect(<ScanQR/>)}/>

<Route path="/bills" element={protect(<Bills/>)}/>

<Route path="/banks" element={protect(<Banks/>)}/>

<Route path="/analytics" element={protect(<Analytics/>)}/>

<Route path="/contacts" element={protect(<Contacts/>)}/>

<Route path="/notifications" element={protect(<Notifications/>)}/>

<Route path="/history" element={protect(<TransactionHistory/>)}/>

<Route path="/security" element={protect(<Security/>)}/>

<Route path="/profile" element={protect(<Profile/>)}/>

<Route path="/my-qr" element={protect(<ProfileQR/>)}/>

<Route path="/referrals" element={protect(<Referrals/>)}/>

<Route path="/support" element={protect(<Support/>)}/>

<Route path="/scheduled" element={protect(<Scheduled/>)}/>

<Route path="/admin" element={protect(<AdminDashboard/>)}/>

<Route path="/kyc" element={protect(<KYC/>)}/>



{/* Merchant System */}

<Route path="/merchant" element={protect(<MerchantPayment/>)}/>

<Route path="/merchant-qr" element={protect(<MerchantQR/>)}/>

<Route path="/merchant-dashboard" element={protect(<MerchantDashboard/>)}/>



{/* Public Receipt Verification */}

<Route path="/verify/:receiptId" element={<VerifyReceipt/>}/>



<Route

path="*"

element={<Navigate to={user?'/dashboard':'/'} replace/>}

/>


</Routes>




{user && <BottomNav/>}

{user && <AIChat/>}




<Toaster

position="top-center"

toastOptions={{duration:3000}}

/>


</div>


);


};






const App:React.FC=()=>{


return(

<AuthProvider>

<AppContent/>

</AuthProvider>

);


};



export default App;