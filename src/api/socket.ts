import { Server } from 'socket.io';

import http from 'http';





let io:Server;









export const initSocket =
(server:http.Server)=>{



io = new Server(

server,

{

cors:{

origin:'*',

methods:[

'GET',

'POST'

]

}

}

);









io.on(

'connection',

(socket)=>{



console.log(

'⚡ Socket connected:',

socket.id

);








socket.on(

'join',

(userId:string)=>{



socket.join(

userId

);



console.log(

'👤 User joined realtime:',

userId

);



}

);









socket.on(

'disconnect',

()=>{



console.log(

'⚡ Socket disconnected'

);



}

);




}

);







return io;



};












// SEND ANY USER EVENT

export const emitToUser =

(

userId:string,

event:string,

data:any

)=>{



if(!io){

return;

}





io.to(

userId

).emit(

event,

data

);



};












// LIVE WALLET BALANCE UPDATE

export const emitBalanceUpdate =

(

userId:string,

balance:number

)=>{



if(!io){

return;

}





io.to(

userId

).emit(

'balance_update',

{

balance

}

);



};











// ADMIN LIVE EVENTS

export const emitAdmin =

(

event:string,

data:any

)=>{



if(!io){

return;

}





io.emit(

event,

data

);



};