import auditService from '../../src/audit/services/audit.service';




describe('Audit Trail Service',()=>{


beforeEach(()=>{

auditService.clear();

});






test('records user security events',()=>{


const event = auditService.record({

userId:'user-1',

action:'LOGIN'

});




expect(event.id)

.toBeDefined();




expect(event.risk)

.toBe('LOW');


});








test('finds events by user',()=>{


auditService.record({

userId:'user-1',

action:'SEND_MONEY',

details:{

amount:'50 PGK'

}

});




const events =

auditService.findByUser(

'user-1'

);




expect(events.length)

.toBe(1);




expect(

events[0].action

)

.toBe('SEND_MONEY');


});








test('detects high risk activity',()=>{


auditService.record({

userId:'user-danger',

action:'FAILED_TRANSFER',

risk:'HIGH'

});




const risks =

auditService.findHighRisk();




expect(

risks.length

)

.toBe(1);




expect(

risks[0].risk

)

.toBe('HIGH');


});


});