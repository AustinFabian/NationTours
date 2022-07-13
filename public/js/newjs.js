import '@babel/polyfill'
import { login } from './login'
import { logOut } from './login'
import {updateSettings} from './updateSettings'
import {bookTour} from './stripe'


// DOM ELEMENTS
const loginForm = document.querySelector('.form--login');
const logOutBtn = document.querySelector('.nav__el--logout');
const userDataForm = document.querySelector('.form-user-data');
const userPasswordForm = document.querySelector('.form-user-password');
const bookBtn = document.getElementById('book-tour');

// VALUES


// DELEGATION


if(loginForm)loginForm.addEventListener('submit', function(e){
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    login(email,password)
})

if(logOutBtn)logOutBtn.addEventListener('click', logOut)

// FOR UPDATING A USER

if (userDataForm) userDataForm.addEventListener('submit', function(e){
    e.preventDefault();
    const form = new FormData();
    form.append('name',document.getElementById('name').value)
    form.append('email',document.getElementById('email').value)
    form.append('photo',document.getElementById('photo').files[0])

    updateSettings(form, 'data')

    // below still same as as above
    // const name = 'name',document.getElementById('name').value
    // const email = 'email',document.getElementById('email').value
    // updateSettings({name,email}, 'data')
    // updateSettings(form, 'data')
})

if (userPasswordForm) userPasswordForm.addEventListener('submit', async e =>{

    e.preventDefault();

    document.querySelector('.button--save-password').innerHTML = 'UPDATING...'
    const passwordCurrent = document.getElementById('password-current').value;
    const password = document.getElementById('password').value;
    const passwordConfirm = document.getElementById('password-confirm').value;
    await updateSettings({passwordCurrent,password,passwordConfirm},'password')

    document.querySelector('.button--save-password').innerHTML = 'Save Password'

    document.getElementById('password-current').value = ''
    document.getElementById('password').value = ''
    document.getElementById('password-confirm').value = ''
})


if(bookBtn){
    console.log('God is goood')
    bookBtn.addEventListener('click', e => {
        e.target.textContent = 'processing...'
        const {tourId} = e.target.dataset;
        bookTour(tourId)
    })
}