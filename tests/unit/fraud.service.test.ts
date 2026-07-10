import fraudService from '../../src/fraud/services/fraud.service';




describe('Fraud Detection Engine',()=>{






test('approves normal transaction',()=>{


const result = fraudService.checkTransfer({

userId:'user1',

amount:100

});




expect(

result.decision

)

.toBe('APPROVE');



});








test('reviews suspicious activity',()=>{


const result = fraudService.checkTransfer({

userId:'user1',

amount:100,

failedAttempts:3

});




expect(

result.decision

)

.toBe('REVIEW');




expect(

result.reasons.length

)

.toBeGreaterThan(0);



});








test('blocks high risk transfer',()=>{


const result = fraudService.checkTransfer({

userId:'user1',

amount:10000,

failedAttempts:5

});




expect(

result.decision

)

.toBe('BLOCK');



});


});