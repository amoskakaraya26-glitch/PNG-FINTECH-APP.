import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { notificationsAPI } from '../services/api';

import './Notifications.css';



const Notifications: React.FC = () => {


  const navigate = useNavigate();


  const [notifications, setNotifications] =
    useState<any[]>([]);





  useEffect(() => {

    loadNotifications();

  }, []);






  const loadNotifications = async () => {


    try {


      const res =
        await notificationsAPI.getAll();


      setNotifications(
        res.data.notifications ||
        res.data ||
        []
      );



    } catch (error) {


      console.error(error);


    }


  };








  const openNotification =
    async(id:string)=>{


      try{


        await notificationsAPI.markRead(id);


        loadNotifications();


      }catch(error){


        console.error(error);


      }


    };









  return (

    <div className="notifications-page">



      <div className="notifications-header">


        <button
          onClick={()=>navigate('/dashboard')}
        >

          ←

        </button>



        <h2>

          🔔 PNG Wallet Alerts

        </h2>


      </div>








      {notifications.length===0 && (


        <div className="empty-state">


          No notifications yet


        </div>


      )}










      {notifications.map(n=>(


        <div

          key={n.id}

          className={
            n.is_read
            ?
            'notification-card'
            :
            'notification-card unread'
          }


          onClick={()=>
            openNotification(n.id)
          }

        >




          <div className="notification-title">


            {n.title}


          </div>





          <div className="notification-message">


            {n.message}


          </div>





          <small>


            {
              new Date(
                n.created_at
              ).toLocaleString()
            }


          </small>





          {!n.is_read && (


            <span className="unread-badge">


              NEW


            </span>


          )}




        </div>


      ))}







    </div>

  );


};



export default Notifications;