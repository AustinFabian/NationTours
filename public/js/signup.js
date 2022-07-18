/* eslint-disable */
import axios from 'axios';
import { showAlert } from '/alert';

// const loginForm = document.querySelector('.form')

export const signup = async (name,email,password,passwordConfirm) => {
  try {
    const res = await axios({
      method: 'POST',
      url: '/api/v1/users/signup',
      data: {
        name,
        email,
        password,
        passwordConfirm,
      },
    });
    // console.log(res)
    if (res.data.status === 'Success') {
      window.setTimeout(() => {
        showAlert('success', 'SignedUp Succesfully Now Logg In To Your Account!');
        location.assign('/');
      }, 1500);
    }
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};

