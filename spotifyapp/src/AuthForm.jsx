import React, { Component } from "react";
import Button from '@material-ui/core/Button';
import CssBaseline from '@material-ui/core/CssBaseline';
import FormControl from '@material-ui/core/FormControl';
import Input from '@material-ui/core/Input';
import InputLabel from '@material-ui/core/InputLabel';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import Snackbar from '@material-ui/core/Snackbar';
import withStyles from '@material-ui/core/styles/withStyles';
import { MuiThemeProvider, createMuiTheme } from '@material-ui/core/styles';

const serverUrl = 'https://auth-server-bh.herokuapp.com';

//For development purposes
// const serverUrl = 'http://localhost:8888';

const style = theme => ({
  layout: {
    display: 'block',
    marginLeft: 'auto',
    marginRight: 'auto',
    justify: 'center',
    width: (window.innerWidth > 500) ? '40%' : '100%'
  },
  paper: {
    marginTop: theme.spacing.unit * 8,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: `${theme.spacing.unit * 2}px ${theme.spacing.unit * 3}px ${theme.spacing.unit * 3}px`,
  },
  form: {
    width: '100%',
    marginTop: theme.spacing.unit,
  },
  submit: {
    marginTop: theme.spacing.unit * 3,
  },
});

const theme = createMuiTheme({
  palette: {
    type: 'dark',
    secondary: {
      main: '#43A047'
    }
  },
});

const styles = style(theme);

class AuthForm extends Component {

  constructor(props) {
    super(props);
    this.state = {
      username: '',
      password: '',
      number: '',
      snackBarState: false,
      snackBarMessage: ''
    }
  }

  handleSnackBarOpen(message) {
    this.setState({
      snackBarState: true,
      snackBarMessage: message
    });
  }

  handleSnackBarClose() {
    this.setState({
      snackBarState: false,
      snackBarMessage: ''
    });
  }

  handleSubmit = async e => {
    e.preventDefault();
    const authType = this.props.signUp ? "signup" : "signin";
    
    //Request to node server for user to sign in
    let authReq = await fetch(`${serverUrl}/api/auth/${authType}`,{
                                                              method: 'post',
                                                              headers: {'Content-Type':'application/json'},
                                                              body: JSON.stringify({
                                                                username: this.state.username,
                                                                password: this.state.password,
                                                                number: this.state.number
                                                              })
    });

    let authRes = await authReq.json();

    if(authRes.error) {
      this.handleSnackBarOpen(authRes.error.message);
    } else {

      localStorage.setItem('currentID', authRes.id);
      localStorage.setItem('currentToken', authRes.token);

      if(authRes.number === '') {
        window.location.replace('/');
      } else {
        //If user has a number with their account then send a request to messagebird API to get verification code
        let codeReq = await fetch(`${serverUrl}/createcode`, {
                                                              method:'post',
                                                              headers: {'Content-Type':'application/json'},
                                                              body: JSON.stringify({
                                                                number: authRes.number
                                                              })
        });

       let codeRes = await codeReq.json();

       localStorage.setItem('codeID', codeRes.id);

        window.location.replace('/verify');
      }
    }
  };

  handleVerifySubmit = async e => {
    e.preventDefault();
    try {            
      let codeId = localStorage.getItem('codeID');
      let tokenNum = this.state.number;
      
      //Verifies user with 2FA
      let verifyReq = await fetch(`${serverUrl}/verify`, {
                                                            method: 'post',
                                                            headers: {'Content-Type':'application/json'},
                                                            body: JSON.stringify({
                                                              id: codeId,
                                                              token: tokenNum
                                                            })                                              
      })
      
      let verifyRes = await verifyReq.json();


      //If user is verified with 2FA then redirect to the main application page
      if(verifyRes.status === 'verified') {
        this.props.history.push('/');
      }


    } catch (err) {
      this.setState({
        open: !this.state.snackBarState,
        snackBarMessage: err
      })
    }
  }

  handleChange = e => {
    this.setState({
      [e.target.name]: e.target.value
    });
  };

  handleRedirect = () => {
    let path = (this.props.location.pathname === '/signin') ? '/signup' : '/signin';

    this.props.history.push(`${path}`);
  }

  render() {
    let { pathname } = this.props.location;

    return (
      <MuiThemeProvider theme={theme}>
        <main style={styles.layout}>
          <CssBaseline/>
          <Paper style={styles.paper}>
            <Snackbar
              className='snackbar'
              anchorOrigin={{vertical: 'top', horizontal: 'center'}}
              open={this.state.snackBarState}
              onClose={() => this.handleSnackBarClose()}
              message={<span>{this.state.snackBarMessage}</span>}
              />
            <Typography variant="headline">{this.props.heading}</Typography>

            {
              pathname !== '/verify' && (
                <form style={styles.form} onSubmit={this.handleSubmit}>
                    <FormControl margin="normal" required fullWidth>
                      <InputLabel htmlFor="username">Username</InputLabel>
                      <Input id="username" name="username" autoComplete="username" autoFocus onChange={this.handleChange} />
                    </FormControl>
                    <FormControl margin="normal" required fullWidth>
                      <InputLabel htmlFor="password">Password</InputLabel>
                      <Input
                        name="password"
                        type="password"
                        id="password"
                        autoComplete="current-password"
                        onChange={this.handleChange}
                      />
                    </FormControl>

                    {
                      pathname === '/signup' && (
                        <FormControl margin="normal" fullWidth>
                          <InputLabel htmlFor="number">Phone # for 2FA (Optional, add country code before number e.g. +1 for USA)</InputLabel>
                          <Input
                            name="number"
                            id="number"
                            autoComplete="current-phone-number"
                            onChange={this.handleChange}
                          />
                        </FormControl>
                      )
                    }

                  <Button
                    type="submit"
                    fullWidth
                    variant="raised"
                    color="secondary"
                    style={styles.submit}
                  >
                    {this.props.buttonText}
                  </Button>

                  <Button color='secondary' variant='outlined' style={styles.submit} onClick={this.handleRedirect}>
                    {this.props.redirectButton}
                  </Button>
                </form>
              )
            }

            {
              pathname === '/verify' && (
                <form style={styles.form} onSubmit={this.handleVerifySubmit}>
                    <FormControl margin="normal" required fullWidth>
                      <InputLabel htmlFor="number">Enter Code</InputLabel>
                      <Input
                        name="number"
                        id="number"
                        autoComplete="current-number"
                        onChange={this.handleChange}
                      />
                    </FormControl>

                  <Button
                    type="submit"
                    fullWidth
                    variant="raised"
                    color="secondary"
                    style={styles.submit}
                  >
                    {this.props.buttonText}
                  </Button>
                </form>
              )
            }
          </Paper>
        </main>
      </MuiThemeProvider>
    );
  }
}

export default withStyles(style)(AuthForm);
