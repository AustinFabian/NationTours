/* eslint-disable */
import axios from 'axios'
import {showAlert} from '/alert'

// const loginForm = document.querySelector('.form')


export const login = async (email, password) => {
    try {
      const res = await axios({
        method: 'POST',
        url: '/api/v1/users/login',
        data: {
          email,
          password
        }
      });
      // console.log(res)
      if(res.data.status === 'Success'){
        window.setTimeout(() => {
          showAlert('success','logged in succesfully')
          location.assign('/');
        }, 1500);
      }
    } catch (err) {
      showAlert('error',err.response.data.message);
    }
  };


  // For logging  out users
  export const logOut = async () => {
    try {
      const res = await axios({
        method: 'GET',
        url: '/api/v1/users/logOut'
      });
      if ((res.data.status === 'Success')) location.reload(true);
    } catch (err) {
      // console.log(err.response);
      showAlert('error', 'Error logging out! Try again.');
    }
  };
  

// if(loginForm)loginForm.addEventListener('submit', function(e){
//     e.preventDefault();
//     const email = document.getElementById('email').value;
//     const password = document.getElementById('password').value;
//     login(email,password)
// })


