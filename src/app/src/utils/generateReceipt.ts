import jsPDF from "jspdf";
import QRCode from "qrcode";


export interface ReceiptData {

transactionId:string;

type:string;

sender:string;

receiver:string;

amount:number;

fee:number;

status:string;

date:string;

}



export const generateReceipt =
async(
data: ReceiptData
)=>{


const pdf =
new jsPDF();



pdf.setFontSize(22);

pdf.text(
"PNG Wallet",
20,
20
);



pdf.setFontSize(14);

pdf.text(
"Digital Transaction Receipt",
20,
35
);



pdf.line(
20,
40,
190,
40
);




pdf.text(
`Receipt ID: ${data.transactionId}`,
20,
55
);


pdf.text(
`Date: ${data.date}`,
20,
65
);



pdf.text(
`Transaction: ${data.type}`,
20,
80
);



pdf.text(
`From: ${data.sender}`,
20,
95
);



pdf.text(
`To: ${data.receiver}`,
20,
105
);



pdf.text(
`Amount: PGK ${data.amount}`,
20,
120
);



pdf.text(
`Fee: PGK ${data.fee}`,
20,
130
);



pdf.text(
`Status: ${data.status}`,
20,
145
);





const verifyUrl =
`http://localhost:3001/verify/${data.transactionId}`;



const qrImage =
await QRCode.toDataURL(
verifyUrl
);



pdf.addImage(
qrImage,
"PNG",
70,
155,
60,
60
);




pdf.text(
"Scan QR to verify receipt",
55,
225
);



pdf.text(
"PNG Wallet - Papua New Guinea",
45,
240
);




pdf.save(
`PNG-Wallet-${data.transactionId}.pdf`
);



};