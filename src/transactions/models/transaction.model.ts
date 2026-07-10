export type TransactionStatus =

'CREATED' |

'PENDING' |

'PROCESSING' |

'COMPLETED' |

'FAILED' |

'REVERSED';




export interface WalletTransaction {


id:string;


fromWallet:string;


toWallet:string;


amount:number;


currency:string;


status:TransactionStatus;


createdAt:Date;


updatedAt:Date;


}