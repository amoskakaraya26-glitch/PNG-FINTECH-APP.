import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

import pool from '../../database/connection';


import {

recordSession,

recordDevice,

createSecurityEvent

} from '../services/security.service';






const generateToken = (user:any)=>


jwt.sign(

{

id:user.id,

phone:user.phone,

isAdmin:user.is_admin

},

process.env.JWT_SECRET || 'secret',

{

expiresIn:'7d'

}

);







const generateReferralCode = ()=>


Math.random()

.toString(36)

.substring(2,8)

.toUpperCase();










export const register = async(req:Request,res:Response)=>{


try{


const {

phone,

fullName,

pin,

referralCode

}=req.body;





if(!phone || !fullName || !pin){


return res.status(400).json({

error:'Missing required fields'

});


}






const existing = await pool.query(

'SELECT id FROM users WHERE phone=$1',

[phone]

);



if(existing.rows.length>0){


return res.status(409).json({

error:'Phone already registered'

});


}







const pinHash =

await bcrypt.hash(pin,10);



const myReferralCode =

generateReferralCode();



let referredBy = null;






if(referralCode){


const referrer = await pool.query(

'SELECT id FROM users WHERE referral_code=$1',

[referralCode]

);



if(referrer.rows.length>0){


referredBy = referrer.rows[0].id;


}


}









const result = await pool.query(

`

INSERT INTO users

(id,phone,full_name,pin_hash,referral_code,referred_by)

VALUES

($1,$2,$3,$4,$5,$6)

RETURNING *

`,

[

uuidv4(),

phone,

fullName,

pinHash,

myReferralCode,

referredBy

]

);





const user = result.rows[0];







await pool.query(

`

INSERT INTO wallets

(id,user_id,balance,currency)

VALUES

($1,$2,0,$3)

`,

[

uuidv4(),

user.id,

'PGK'

]

);






await pool.query(

'INSERT INTO user_limits (id,user_id) VALUES ($1,$2)',

[uuidv4(),user.id]

);







if(referredBy){


await pool.query(

'INSERT INTO referrals (id,referrer_id,referred_id) VALUES ($1,$2,$3)',

[uuidv4(),referredBy,user.id]

);


}






const token = generateToken(user);




res.status(201).json({

token,

user:{

id:user.id,

phone:user.phone,

fullName:user.full_name,

referralCode:user.referral_code

}

});





}catch(err:any){


res.status(500).json({

error:err.message

});


}



};












export const login = async(req:Request,res:Response)=>{


try{



const {phone,pin}=req.body;




const result = await pool.query(

`

SELECT *

FROM users

WHERE phone=$1

AND is_active=true

`,

[phone]

);






if(result.rows.length===0){


return res.status(401).json({

error:'Invalid credentials'

});


}







const user = result.rows[0];




const valid =

await bcrypt.compare(

pin,

user.pin_hash

);






if(!valid){


return res.status(401).json({

error:'Invalid credentials'

});


}








const token = generateToken(user);






const deviceName =

req.headers['user-agent'] ||

'Unknown Device';






await recordSession(

user.id,

token,

deviceName.toString(),

req.ip || ''

);





await recordDevice(

user.id,

deviceName.toString(),

req.ip || ''

);





await createSecurityEvent(

user.id,

'LOGIN_SUCCESS',

'low',

'User logged in successfully',

{

device:deviceName

}

);









res.json({

token,

user:{

id:user.id,

phone:user.phone,

fullName:user.full_name,

isAdmin:user.is_admin,

kycStatus:user.kyc_status,

onboardingCompleted:user.onboarding_completed

}

});





}catch(err:any){


res.status(500).json({

error:err.message

});


}



};









export const getProfile = async(req:any,res:Response)=>{


try{


const result = await pool.query(

`

SELECT u.*,w.balance,w.currency

FROM users u

LEFT JOIN wallets w

ON w.user_id=u.id

WHERE u.id=$1

`,

[req.user.id]

);





if(result.rows.length===0){


return res.status(404).json({

error:'User not found'

});


}





const u=result.rows[0];





res.json({

id:u.id,

phone:u.phone,

fullName:u.full_name,

isAdmin:u.is_admin,

kycStatus:u.kyc_status,

onboardingCompleted:u.onboarding_completed,

balance:u.balance,

currency:u.currency,

avatarUrl:u.avatar_url,

referralCode:u.referral_code

});





}catch(err:any){


res.status(500).json({

error:err.message

});


}



};










export const updateProfile = async(req:any,res:Response)=>{


try{


const {

fullName,

email,

dateOfBirth,

address,

province

}=req.body;





await pool.query(

`

UPDATE users

SET

full_name=$1,

email=$2,

date_of_birth=$3,

address=$4,

province=$5,

updated_at=NOW()

WHERE id=$6

`,

[

fullName,

email,

dateOfBirth,

address,

province,

req.user.id

]

);





res.json({

message:'Profile updated'

});





}catch(err:any){


res.status(500).json({

error:err.message

});


}



};









export const changePin = async(req:any,res:Response)=>{


try{


const {

currentPin,

newPin

}=req.body;





const result = await pool.query(

'SELECT pin_hash FROM users WHERE id=$1',

[req.user.id]

);



const user=result.rows[0];





const valid =

await bcrypt.compare(

currentPin,

user.pin_hash

);




if(!valid){


return res.status(400).json({

error:'Current PIN is incorrect'

});


}





const newHash =

await bcrypt.hash(

newPin,

10

);





await pool.query(

`

UPDATE users

SET pin_hash=$1,

updated_at=NOW()

WHERE id=$2

`,

[

newHash,

req.user.id

]

);





res.json({

message:'PIN changed successfully'

});





}catch(err:any){


res.status(500).json({

error:err.message

});


}



};









export const completeOnboarding = async(req:any,res:Response)=>{


try{


await pool.query(

`

UPDATE users

SET onboarding_completed=true

WHERE id=$1

`,

[req.user.id]

);





res.json({

message:'Onboarding completed'

});





}catch(err:any){


res.status(500).json({

error:err.message

});


}



};