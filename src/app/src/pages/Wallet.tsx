import React, { useState, useEffect, useCallback } from 'react';

import './Wallet.css';
import { apiFetch } from '../utils/api';
import { generateReceipt } from '../utils/generateReceipt';

interface WalletData {
  id: string;
  userId: string;
  balance: number;
  currency: string;
  status: string;
}

interface Transaction {
  id: string;
  walletId: string;
  type: string;
  amount: number;
  currency: string;
  status: string;
  description?: string;
  referenceId?: string;
  senderName?: string;
  senderPhone?: string;
  receiverName?: string;
  receiverPhone?: string;
  timestamp: string;
  fee?:number;
}

const getTransactionTitle = (type:string) => {
  if (type === 'transfer') return '↑ Money Sent';
  if (type === 'received') return '↓ Money Received';
  if (type === 'topup') return '+ Wallet Top Up';
  return type;
};

const getAmountPrefix = (type:string) =>
  type === 'transfer' ? '-' : '+';


const Wallet: React.FC = () => {

const [wallet,setWallet] = useState<WalletData | null>(null);
const [recipientPhone,setRecipientPhone] = useState('');
const [recipient,setRecipient] = useState<any>(null);
const [transactions,setTransactions] = useState<Transaction[]>([]);
const [loading,setLoading] = useState(true);
const [topupAmount,setTopupAmount] = useState('');
const [transferAmount,setTransferAmount] = useState('');
const [message,setMessage] = useState('');
const [selectedReceipt,setSelectedReceipt] =
useState<Transaction | null>(null);



const loadTransactions = useCallback(async()=>{

try{

const response =
await apiFetch('/api/wallet/history');

if(response.ok){
const data = await response.json();
setTransactions(data.transactions || []);
}

}catch(error){
console.error(error);
}

},[]);



const loadWallet = useCallback(async()=>{

try{

const response =
await apiFetch('/api/wallet/me');

if(response.ok){
const data = await response.json();
setWallet(data.wallet);
await loadTransactions();
}

}catch(error){

console.error(error);
setMessage('Error loading wallet');

}finally{
setLoading(false);
}

},[loadTransactions]);



useEffect(()=>{
loadWallet();
},[loadWallet]);



const handleTopup = async(e:React.FormEvent)=>{

e.preventDefault();

if(!topupAmount) return;

const response =
await apiFetch('/api/wallet/topup',{
method:'POST',
headers:{'Content-Type':'application/json'},
body:JSON.stringify({
amount:parseFloat(topupAmount)
})
});

if(response.ok){
setTopupAmount('');
setMessage('Topup successful!');
await loadWallet();
}

};




const checkRecipient = async()=>{

try{

const response =
await apiFetch(
`/api/wallet/recipient/${recipientPhone}`
);

const data = await response.json();

if(data.success){
setRecipient(data.recipient);
setMessage(`Recipient found: ${data.recipient.full_name}`);
}else{
setRecipient(null);
setMessage('Recipient not found');
}

}catch{

setRecipient(null);
setMessage('Recipient not found');

}

};




// SHARE RECEIPT
const shareReceipt = async(tx:Transaction)=>{

const receiptText = `
🇵🇬 PNG WALLET RECEIPT

Status: ${tx.status.toUpperCase()}

Amount: PGK ${tx.amount.toFixed(2)}

From:
${tx.senderName || '-'}
${tx.senderPhone || ''}

To:
${tx.receiverName || '-'}
${tx.receiverPhone || ''}

Reference:
${tx.referenceId || '-'}

Date:
${new Date(tx.timestamp).toLocaleString('en-PG')}

Thank you for using PNG Wallet
`;

try{

if(navigator.share){

await navigator.share({
title:'PNG Wallet Receipt',
text:receiptText
});

}else{

await navigator.clipboard.writeText(receiptText);
setMessage('Receipt copied to clipboard');

}

}catch(error){
console.error(error);
}

};




// PDF RECEIPT
const downloadPDFReceipt = (tx:Transaction)=>{

generateReceipt({

transactionId:
tx.referenceId || tx.id,

type:
tx.type || 'Wallet Transaction',

sender:
tx.senderName ||
tx.senderPhone ||
'PNG Wallet User',

receiver:
tx.receiverName ||
tx.receiverPhone ||
'Receiver',

amount:
tx.amount,

fee:
tx.fee || 0,

status:
tx.status.toUpperCase(),

date:
new Date(
tx.timestamp
).toLocaleString()

});

};




const handleTransfer = async(e:React.FormEvent)=>{

e.preventDefault();

if(!recipient){
setMessage('Please check recipient first');
return;
}

const response =
await apiFetch('/api/wallet/transfer',{
method:'POST',
headers:{'Content-Type':'application/json'},
body:JSON.stringify({
toWalletId:recipient.wallet_id,
amount:parseFloat(transferAmount)
})
});

if(response.ok){

setTransferAmount('');
setRecipientPhone('');
setRecipient(null);
setMessage('Transfer successful!');
await loadWallet();

}

};




if(loading){
return <div>Loading wallet...</div>;
}



return(

<div className="wallet">

<h1>Digital Wallet</h1>


{message &&
<div className="message">
{message}
<button onClick={()=>setMessage('')}>×</button>
</div>
}


{wallet &&
<div className="wallet-balance">
<h2>Current Balance</h2>
<h1>PGK {wallet.balance.toFixed(2)}</h1>
<p>Wallet ID: {wallet.id}</p>
<p>Status: {wallet.status}</p>
</div>
}



<div className="transaction-history">

<h3>Transaction History</h3>

{transactions.map(tx=>

<div
key={tx.id}
className="transaction-card"
onClick={()=>setSelectedReceipt(tx)}
>

<strong>{getTransactionTitle(tx.type)}</strong>

<h3>
{getAmountPrefix(tx.type)}
PGK {tx.amount.toFixed(2)}
</h3>

<p>{tx.description}</p>

{tx.referenceId &&
<p className="receipt-id">
Receipt: {tx.referenceId}
</p>
}

<small>
{new Date(tx.timestamp).toLocaleString('en-PG')}
</small>

</div>

)}

</div>





{selectedReceipt &&

<div className="receipt-popup">

<div className="receipt-card">

<h2>🇵🇬 PNG WALLET</h2>

<h3>
✓ {selectedReceipt.status.toUpperCase()}
</h3>

<h1>
PGK {selectedReceipt.amount.toFixed(2)}
</h1>


<p>
<b>From</b><br/>
{selectedReceipt.senderName || '-'}<br/>
{selectedReceipt.senderPhone || ''}
</p>


<p>
<b>To</b><br/>
{selectedReceipt.receiverName || '-'}<br/>
{selectedReceipt.receiverPhone || ''}
</p>


<p>
<b>Reference</b><br/>
{selectedReceipt.referenceId || '-'}
</p>



<div className="receipt-actions">

<button onClick={() =>
downloadPDFReceipt(selectedReceipt)
}>
Download PDF 🧾
</button>


<button onClick={() =>
shareReceipt(selectedReceipt)
}>
Share Receipt
</button>


<button onClick={() =>
setSelectedReceipt(null)
}>
Close Receipt
</button>

</div>


</div>

</div>

}


</div>

);

};


export default Wallet;