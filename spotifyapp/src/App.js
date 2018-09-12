import React, { Component } from 'react';
import { BrowserRouter, Switch, Route } from 'react-router-dom';
import './App.css';
import Main from './Main';
import AuthForm from './AuthForm';

class App extends Component {

  render() {
    return(
      <div className='container'>
        <BrowserRouter>
          <Switch>
            <Route exact path='/' render={() => <Main/>} />
            <Route exact path='/signin' render={props => {
                return(
                  <AuthForm
                    buttonText='Log In'
                    heading='Welcome Back'
                    redirectButton='Need an account?'
                    {...props}
                    />
                )
              }}/>
            <Route exact path='/signup' render={props => {
                  return(
                    <AuthForm
                      signUp buttonText='Sign me up!'
                      heading='Join Today'
                      redirectButton='Already have an account?'
                      {...props}
                      />
                  )
                }}/>
          </Switch>
        </BrowserRouter>
      </div>
    );
  }
}

export default App;
