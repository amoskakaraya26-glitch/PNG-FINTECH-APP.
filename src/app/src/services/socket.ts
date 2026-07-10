import { io, Socket } from 'socket.io-client';


import toast from 'react-hot-toast';





let socket:Socket | null = null;









export const connectSocket =
(userId:string)=>{


if(socket){


return socket;


}






const API_URL =

process.env.REACT_APP_API_URL ||

'http://localhost:3000';








socket = io(

API_URL,

{


transports:[

'websocket'

]


}


);









socket.on(

'connect',

()=>{



console.log(

'⚡ Connected realtime:',

socket?.id

);





socket?.emit(

'join',

userId

);



}


);










socket.on(

'notification',

(data:any)=>{



toast.success(

`🔔 ${data.title}\n${data.message}`

);



}


);










socket.on(

'disconnect',

()=>{


console.log(

'Realtime disconnected'


);


}


);









return socket;



};











export const getSocket =
()=>{


return socket;


};










export const disconnectSocket =
()=>{


if(socket){



socket.disconnect();



socket=null;



}



};