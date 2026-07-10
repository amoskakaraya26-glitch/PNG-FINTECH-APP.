import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

import { bankAPI } from '../services/api';

import './BankIntegration.css';


const BankIntegration: React.FC = () => {

  const navigate = useNavigate();

  const [bank, setBank] = useState('BSP Financial Group');
  const [account, setAccount] = useState('');
  const [amount, setAmount] = useState('');
  const [pin, setPin] = useState('');
  const [transactions, setTransactions] = useState<any[]>([]);


  useEffect(() => {
    loadHistory();
  }, []);



  const loadHistory = async () => {

    try {

      const res = await bankAPI.getTransactions();

      setTransactions(
        res.data.transactions || []
      );

    } catch (error) {

      console.error(error);

    }

  };




  const cashIn = async () => {

    if (!amount) {

      toast.error('Enter amount');
      return;

    }


    try {

      await bankAPI.cashIn({
        bankName: bank,
        accountNumber: account,
        amount: Number(amount)
      });


      toast.success(
        'Cash In successful'
      );


      setAmount('');

      loadHistory();


    } catch {

      toast.error(
        'Cash In failed'
      );

    }

  };






  const cashOut = async () => {

    if (!amount || !pin) {

      toast.error(
        'Enter amount and PIN'
      );

      return;

    }


    try {

      await bankAPI.cashOut({
        bankName: bank,
        accountNumber: account,
        amount: Number(amount),
        pin
      });



      toast.success(
        'Secure Cash Out successful'
      );


      setAmount('');
      setPin('');

      loadHistory();


    } catch {

      toast.error(
        'Cash Out failed'
      );

    }

  };







  return (

    <div className="bank-page">


      <div className="bank-header">

        <button
          onClick={() => navigate('/dashboard')}
        >
          ←
        </button>


        <h2>
          🏦 PNG Wallet Bank Hub
        </h2>

      </div>






      <div className="bank-card">


        <label>
          Select Bank
        </label>


        <select
          value={bank}
          onChange={(e) =>
            setBank(e.target.value)
          }
        >

          <option>BSP Financial Group</option>

          <option>Kina Bank</option>

          <option>TISA Bank</option>

        </select>






        <input
          placeholder="Bank Account Number"
          value={account}
          onChange={(e) =>
            setAccount(e.target.value)
          }
        />





        <input
          placeholder="Amount PGK"
          type="number"
          value={amount}
          onChange={(e) =>
            setAmount(e.target.value)
          }
        />





        <input
          placeholder="Security PIN (Cash Out)"
          type="password"
          value={pin}
          onChange={(e) =>
            setPin(e.target.value)
          }
        />







        <button
          className="cash-in"
          onClick={cashIn}
        >

          ⬇️ Cash In

        </button>





        <button
          className="cash-out"
          onClick={cashOut}
        >

          🔐 Cash Out

        </button>


      </div>








      <h3>

        📋 Bank History

      </h3>






      {transactions.length === 0 && (

        <p>
          No bank transactions yet
        </p>

      )}







      {transactions.map(tx => (

        <div
          className="bank-tx"
          key={tx.id}
        >


          <strong>

            {
              tx.type === 'cash_out'
              ? '⬆️ Cash Out'
              : '⬇️ Cash In'
            }

          </strong>



          <span>

            PGK {Number(tx.amount).toFixed(2)}

          </span>



          <small>

            {tx.bank_name}

          </small>



          <small>

            🔐 {tx.verification_method || 'N/A'}

          </small>



        </div>

      ))}


    </div>

  );

};


export default BankIntegration;