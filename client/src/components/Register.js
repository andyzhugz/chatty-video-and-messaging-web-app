import React, { useState, useEffect } from 'react'
import {Link,useHistory}from 'react-router-dom'
import axios from "axios"; 
import '../stylesheets/LoginRegister.css'

function Register(user) {
    const history=useHistory()
    const [username, setUsername] = useState("");
    const [nickname, setNickname] = useState("");
    const [password, setPassword] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = () => {
        const userName = document.getElementById('userName').value;
        const nickName = document.getElementById('nickName').value;
        const pwd = document.getElementById('password').value;
        setIsSubmitting(true);
        // leave axios code here
        fetch('http://localhost:8080/users/register', { email: userName, username: nickName, password: pwd }).catch(error => {
          // wait for backend
          // if (error.response.status === 401) setError(error.response.data.message);
          // else 
          setIsSubmitting(false);
        });
    };
    
    return  (
        <div>
            <h1 align="center">Welcome to Our App</h1>
            <div className="main">
                <p className="sign" align="center">Register</p>
                <form className="formLogin">
                    <input className="userName" id="userName" type="text" align="center" placeholder="Username: cat@gmail.com" />
                    <input className="nickName" id="nickName" type="text" align="center" placeholder="Nickname" />
                    <input className="pass" id="password" type="password" align="center" placeholder="Password" />
                    <input type="button" id="submitBtn" value={isSubmitting ? 'Submitting' : 'Register'} onClick={handleSubmit} className="registerBtn2" />
                </form>  
            </div>
        </div>
        );
}

export default Register;