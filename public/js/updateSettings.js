import axios from 'axios'
import {showAlert} from '/alert'

// type is either 'password' or 'data'
export const updateSettings = async (data,type) => {

    const url = type === 'password' ? 'http://127.0.0.1:3000/api/v1/users/updateMyPassword' : 'http://127.0.0.1:3000/api/v1/users/updateMe'

    try {
      const res = await axios({
        method: 'PATCH',
        url,
        data
      });
      console.log(res)
      if(res.data.status === 'Success'){
          showAlert('success',`${type.toUpperCase()} changed succesfully✅`)
      }
    } catch (err) {
      showAlert('error',err.response.data.message);
    }
  };