import React, {

createContext,

useContext,

useState,

useEffect,

ReactNode

} from 'react';



import { authAPI } from '../services/api';



import {

connectSocket,

disconnectSocket,

getSocket

} from '../services/socket';








interface User {

id:string;

phone:string;

full_name?:string;

fullName?:string;

isAdmin?:boolean;

is_admin?:boolean;

kycStatus?:string;

kyc_status?:string;

onboardingCompleted?:boolean;

onboarding_completed?:boolean;

balance?:number;

avatarUrl?:string;

avatar_url?:string;

referralCode?:string;

referral_code?:string;

}








interface AuthContextType {

user:User | null;

token:string | null;

loading:boolean;

login:(phone:string,pin:string)=>Promise<void>;

logout:()=>void;

refreshProfile:()=>Promise<void>;

}








const AuthContext =

createContext<AuthContextType>(

{} as AuthContextType

);









const attachBalanceListener =

(
setUser:React.Dispatch<
React.SetStateAction<User | null>
>
)=>{


getSocket()?.off(
'balance_update'
);



getSocket()?.on(

'balance_update',

(data:any)=>{


setUser(current=>{


if(!current){

return current;

}



return {

...current,

balance:data.balance

};



});


}


);



};









const getInitialToken = ():string | null=>{


const urlToken =

new URLSearchParams(

window.location.search

).get('token');




if(urlToken){


localStorage.setItem(

'token',

urlToken

);



window.history.replaceState(

{},

document.title,

window.location.pathname

);



return urlToken;


}




return localStorage.getItem(

'token'

);


};









export const AuthProvider =

({children}:{children:ReactNode})=>{



const [user,setUser] =

useState<User | null>(null);



const [token,setToken] =

useState<string | null>(

getInitialToken()

);



const [loading,setLoading] =

useState(true);









useEffect(()=>{


if(token && !user){



authAPI.getProfile()



.then(res=>{


setUser(

res.data

);



connectSocket(

res.data.id

);



attachBalanceListener(

setUser

);



})



.catch((err:any)=>{


if(

err?.response?.status===401

){


setToken(null);


localStorage.removeItem(

'token'

);


disconnectSocket();


}



})



.finally(()=>{


setLoading(false);


});



}else{


setLoading(false);


}




},[token]); // eslint-disable-line










const login =

async(

phone:string,

pin:string

)=>{


const res =

await authAPI.login({

phone,

pin

});




const {

token:newToken,

user:userData

}=res.data;





localStorage.setItem(

'token',

newToken

);



localStorage.setItem(

'userId',

userData.id

);




setToken(

newToken

);



setUser(

userData

);




connectSocket(

userData.id

);



attachBalanceListener(

setUser

);



};










const logout = ()=>{


disconnectSocket();



localStorage.removeItem(

'token'

);



localStorage.removeItem(

'userId'

);




setToken(null);



setUser(null);



};










const refreshProfile =

async()=>{


const res =

await authAPI.getProfile();



setUser(

res.data

);



};










return(

<AuthContext.Provider

value={{

user,

token,

loading,

login,

logout,

refreshProfile

}}

>


{children}


</AuthContext.Provider>

);



};









export const useAuth =

()=>useContext(AuthContext);