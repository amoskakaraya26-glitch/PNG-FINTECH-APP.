import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { transferAPI, contactsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { generateReceipt } from '../utils/generateReceipt';

import toast from 'react-hot-toast';
import './SendMoney.css';


const SendMoney: React.FC = () => {

  const navigate = useNavigate();

  const { user } = useAuth();

  const [step, setStep] =
    useState<'search' | 'amount' | 'confirm' | 'success'>('search');

  const [phone, setPhone] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');

  const [contacts, setContacts] = useState<any[]>([]);
  const [selectedContact, setSelectedContact] = useState<any>(null);

  const [loading, setLoading] = useState(false);
  const [txResult, setTxResult] = useState<any>(null);



  useEffect(() => {

    contactsAPI
      .getAll()
      .then(r => setContacts(r.data))
      .catch(() => {});

  }, []);



  const handleSend = async () => {

    if (!phone || !amount) {

      return toast.error('Fill in all fields');

    }


    setLoading(true);


    try {

      const res =
        await transferAPI.sendMoney({

          recipientPhone: phone,

          amount:
          parseFloat(amount),

          description

        });


      setTxResult(res.data);

      setStep('success');

      toast.success(
        'Money sent successfully!'
      );


    } catch (err:any) {


      toast.error(

        err.response?.data?.error ||

        'Transfer failed'

      );


    } finally {


      setLoading(false);


    }

  };



  const filteredContacts =
    contacts.filter(c =>

      c.name
        ?.toLowerCase()
        .includes(
          phone.toLowerCase()
        )

      ||

      c.phone
        ?.includes(phone)

    );




return (

<div className="send-money">


<div className="page-header">


<button

className="back-btn"

onClick={() => navigate(-1)}

>

←

</button>


<span className="page-title">

Send Money

</span>


</div>





{step === 'search' && (

<div className="sm-content">


<input

className="sm-phone-input"

placeholder="Phone number or name"

value={phone}

onChange={e =>
setPhone(e.target.value)
}

/>



{phone && (

<div className="sm-section">


{filteredContacts.length > 0 ?

filteredContacts.map(c => (

<div

key={c.id}

className="contact-row"

onClick={() => {


setPhone(c.phone);

setSelectedContact(c);

setStep('amount');


}}

>

<div className="contact-avatar lg">

{c.name[0]}

</div>


<div>

<div className="contact-name">

{c.name}

</div>


<div className="contact-phone">

{c.phone}

</div>

</div>


</div>

))

:

<button

className="btn-primary"

onClick={() =>
setStep('amount')
}

>

Send to {phone}

</button>

}


</div>

)}


</div>

)}







{step === 'amount' && (

<div className="sm-content">


<div className="amount-input-wrap">


<span className="currency-label">

PGK

</span>


<input

type="number"

className="amount-input"

value={amount}

placeholder="0.00"

onChange={e =>
setAmount(e.target.value)
}

/>


</div>



<input

placeholder="What's this for?"

value={description}

onChange={e =>
setDescription(e.target.value)
}

/>



<button

className="btn-primary"

onClick={() =>

amount ?

setStep('confirm')

:

toast.error('Enter amount')

}

>

Continue

</button>



</div>


)}








{step === 'confirm' && (

<div className="sm-content">


<div className="confirm-card">


<h2>

Confirm Transfer

</h2>



<p>

Receiver: {selectedContact?.name || phone}

</p>



<p>

Amount: PGK {amount}

</p>


</div>



<button

className="btn-primary"

onClick={handleSend}

disabled={loading}

>

{loading ?

'Sending...'

:

'Confirm & Send'

}

</button>


</div>

)}









{step === 'success' && txResult && (

<div className="sm-content success-screen">


<div className="success-icon">

✅

</div>



<h2>

Money Sent!

</h2>


<p>

PGK {amount} sent successfully

</p>




<div className="success-detail">

Tx ID:

{' '}

{txResult.transactionId?.slice(0,8)}

...

</div>





<button

className="btn-primary"

onClick={() =>

generateReceipt({

transactionId:

txResult.transactionId,


type:

"Money Transfer",


sender:

user?.phone ||

"PNG Wallet User",


receiver:

selectedContact?.name ||

phone,


amount:

Number(amount),


fee:

0,


status:

"SUCCESSFUL",


date:

new Date().toLocaleString()

})

}

>

Download Receipt 🧾

</button>






<button

className="btn-primary"

onClick={() =>
navigate('/dashboard')
}

>

Back to Home

</button>




<button

className="btn-ghost"

onClick={() => {


setStep('search');

setPhone('');

setAmount('');

setTxResult(null);


}}

>

Send Again

</button>




</div>


)}



</div>

);


};



export default SendMoney;