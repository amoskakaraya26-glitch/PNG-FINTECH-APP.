import { v4 as uuid } from 'uuid';


import {

AuditEvent,

AuditAction,

RiskLevel

} from '../models/audit.model';




class AuditService {


private events:AuditEvent[]=[];






record(

data:{

userId:string;

action:AuditAction;

details?:Record<string,any>;

risk?:RiskLevel;

}

){



const event:AuditEvent={


id:uuid(),

userId:data.userId,

action:data.action,

details:data.details || {},

risk:data.risk || 'LOW',

createdAt:new Date()


};




this.events.push(event);



return event;


}









findByUser(

userId:string

){


return this.events.filter(

event=>event.userId===userId

);


}









findHighRisk(){


return this.events.filter(

event=>event.risk==='HIGH'

);


}









clear(){


this.events=[];


}




}



export default new AuditService();