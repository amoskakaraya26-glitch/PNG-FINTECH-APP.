export type FraudDecision =

'APPROVE' |

'REVIEW' |

'BLOCK';




export interface FraudResult {


decision:FraudDecision;


riskScore:number;


reasons:string[];


}