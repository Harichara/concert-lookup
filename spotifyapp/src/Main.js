import React, { Component } from 'react';
import './App.css';
import GoogleMapsContainer from './GoogleMapsContainer';
import Button from '@material-ui/core/Button';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import TextField from '@material-ui/core/TextField';
import Typography from '@material-ui/core/Typography';
import SwipeableDrawer from '@material-ui/core/SwipeableDrawer';
import AppBar from '@material-ui/core/AppBar';
import IconButton from '@material-ui/core/IconButton';
import SvgIcon from '@material-ui/core/SvgIcon';
import Snackbar from '@material-ui/core/Snackbar';
import Switch from '@material-ui/core/Switch';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import { MuiThemeProvider, createMuiTheme } from '@material-ui/core/styles';
import CssBaseline from '@material-ui/core/CssBaseline';
import Toolbar from '@material-ui/core/Toolbar';
import SpotifyWebApi from 'spotify-web-api-js';

const serverUrl = 'https://auth-server-bh.herokuapp.com';
const clientUrl = 'https://concert-lookup-bh.herokuapp.com';
const spotifyApi = new SpotifyWebApi();
const apiKey = 'r0iwmceSJAq5Ynt1';
let authID = localStorage.getItem('currentID');
let authToken = localStorage.getItem('currentToken');

//Dark Theme
const theme = createMuiTheme({
  palette: {
    type: 'dark',
    primary: {
      main: '#424242'
    },
    secondary: {
      main: '#43A047'
    },
  }
});

//Light Theme
const theme2 = createMuiTheme({
  palette: {
    type: 'light',
    primary: {
      main: '#FAFAFA'
    },
    secondary: {
      main: '#43A047'
    },
  }
});

class Main extends Component {
  constructor(props) {
  super(props);
  const params = this.getHashParams();
  this.state = {
    spotifyArtists: {
      names: [],
      images: []
    },
    dbArtistNames: [],
    dbArtistImages: [],
    userName: '',
    drawerState: false,
    snackBarState: false,
    themeState: true,
    menuState: null,
    artistLookUp: {
      id: '',
      name: '',
      type: '',
      city: '',
      lat: 40.7128,
      lng : -74.0060,
      showMarker: false
    }
  }

  if(params.access_token) {
    spotifyApi.setAccessToken(params.access_token)
  }
}

  componentDidMount() {
    this.getSpotifyUserInfo();
    if(authID && authToken) {
      this.getDBArtists();
    }
  }

  handleThemeChange = name => event => {
    this.setState({ [name]: event.target.checked });
  };

  handleDrawerOpen(){
    this.setState({drawerState: true});
  }

  handleDrawerClose(){
    this.setState({drawerState: false});
  }

  handleSnackBarClose() {
    this.setState({
      snackBarState: false
    });
  }

  handleSnackBarOpen() {
    this.setState({
      snackBarState: true
    });
  }

  handleMenuClose = () => {
    this.setState({
      menuState: null
    });
  }

  handleMenuOpen = e => {
    this.setState({
      menuState: e.currentTarget
    });
  }

  getHashParams() {
    let hashParams = {};
    let e, r = /([^&;=]+)=?([^&;]*)/g,
        q = window.location.hash.substring(1);
    while (e = r.exec(q)) {
       hashParams[e[1]] = decodeURIComponent(e[2]);
    }
    return hashParams;
  }

//Creates account on server based on spotify email and id
  createSpotifyAccount(email, id) {
    //If spotify user is found on database then make an account, otherwise sign into application
      fetch(`${serverUrl}/api/auth/findUser`,{
        method: 'post',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({
          username: email
        })
      })
      .then(resp => resp.json())
      .then(data => {
        let authType;

        if(data.error) {
          authType = 'signup';
        } else {
          authType = 'signin';
        }

        fetch(`${serverUrl}/api/auth/${authType}`, {
          method: 'post',
          headers: {'Content-Type':'application/json'},
          body: JSON.stringify({
            username: email,
            password: id
          })
        })
        .then(resp => resp.json())
        .then(data => {
          sessionStorage.setItem('currentID', data.id);
          sessionStorage.setItem('currentToken', data.token);
        }).then(() => {
          authID = sessionStorage.getItem('currentID');
          authToken = sessionStorage.getItem('currentToken');
        }).then(() => this.getDBArtists());
      });
  }

//Gets the list of artists from the user
  getDBArtists() {
    try {
      fetch(`${serverUrl}/api/artists/${authID}`, {
        headers: {'Content-Type':'application/json', 'Authorization':`Bearer ${authToken}`}
      })
      .then(resp => resp.json())
      .then(data => {
        if(!data.error) {
          this.setState({
            dbArtistNames: data.artists,
            userName: data.foundUser.username
          })

          data.artists.forEach(artist => {
            this.searchForArtist(artist.name)
            .then(resp => {
              this.setState({
                dbArtistImages: [...this.state.dbArtistImages, resp.artists.items[0].images[2].url]
              });
            });
          })
        }
      })
    } catch(err) {
        console.log(err);
    }
  }

//Gets username and id from spotify user
  getSpotifyUserInfo() {
    let userEmail, userId;

    spotifyApi.getMe()
    .then(resp => {
      userEmail = resp.email;
      userId = resp.id;
    }).then(() => {
        this.createSpotifyAccount(userEmail, userId);
    }).then(() => this.getTopArtists())
  }

//Sets spotify user's top 20 artists to state
  getTopArtists() {
    spotifyApi.getMyTopArtists()
    .then(resp => {
      resp.items.forEach(artist => {
        this.setState({
          spotifyArtists: {
            names: [...this.state.spotifyArtists.names, artist.name],
            images: [...this.state.spotifyArtists.images, artist.images[2].url]
          }
        });
      })
    });
  }

//Searchs for artist on songkick and sets their songkick ID
  setArtistId(artist){
    fetch(`https://api.songkick.com/api/3.0/search/artists.json?apikey=${apiKey}&query=${artist}`)
    .then(resp => resp.json())
    .then(data => {
      this.setState({
        artistLookUp: {
          id: data.resultsPage.results.artist[0].id,
          showMarker: true
        }
      })
    })
    .then(() => this.getArtistEvent())
  }

//Looks for artist's name on spotify api
  searchForArtist(name) {
    return spotifyApi.search(name, ['artist'])
  }

//Finds next event for an artist after artist ID has been set
  getArtistEvent() {
    fetch(`https://api.songkick.com/api/3.0/artists/${this.state.artistLookUp.id}/calendar.json?apikey=${apiKey}`)
    .then(resp => resp.json())
    .then(data => {
      try {
        this.setState({
          artistLookUp: {
            name: data.resultsPage.results.event[0].displayName,
            type: data.resultsPage.results.event[0].type,
            city: data.resultsPage.results.event[0].location.city,
            url: data.resultsPage.results.event[0].uri,
            lat: data.resultsPage.results.event[0].location.lat,
            lng: data.resultsPage.results.event[0].location.lng
          }
        })
      } catch(err) {
        console.log(err);
      }
    })
  }

//Makes artist on database for user
  createArtist(name) {
    try {
      fetch(`${serverUrl}/api/users/${authID}/artists`, {
        method: 'post',
        headers: {'Content-Type':'application/json', 'Authorization':`Bearer ${authToken}`},
        body: JSON.stringify({
          name
        })
      })
      .then(resp => resp.json())
      .then(data => {
        this.setState({
          dbArtistNames: [...this.state.dbArtistNames, data]
        });
      });
    } catch(err) {
      console.log(err);
    }
  }

//Deletes artist for user on the database
  deleteFromDB(artistID) {
    try{
      fetch(`${serverUrl}/api/users/${authID}/artists/${artistID}`, {
        method: 'delete',
        headers: {'Content-Type':'application/json', 'Authorization':`Bearer ${authToken}`}
      })
      .then(resp => resp.json())
      .then(data => {
        this.setState({
          dbArtistNames: this.state.dbArtistNames.filter(artist => {
            return artist._id !== data._id;
          })
        });
      })
    } catch(err) {
      console.log(err);
    }
  }

//Loads all of the artist the user has added to their list to the DOM
  loadDBNames() {
    try {
        return(this.state.dbArtistNames.map((artist,i) => {
          return(<div style={{display: 'flex'}} key={i}>
                  <IconButton onClick={() => this.deleteFromDB(artist._id)}>
                    <SvgIcon className='svgIcon'>
                      <path fill='#D32F2F' d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z" />
                    </SvgIcon>
                  </IconButton>
                  <ListItem id='list' button onClick={() => {
                      this.setArtistId(artist.name);
                      this.handleDrawerClose();
                    }}>
                  <ListItemText primary={artist.name}/>
                 </ListItem>
               </div>
                );
        }));
    } catch(e) {
      console.log(e);
    }
  }

//Loads spotify user's top 20 artists to the DOM
  loadSpotifyNames() {
    return(this.state.spotifyArtists.names.map((artist,i) => {
      return(<ListItem key={i} id='list' button onClick={() => {
                this.setArtistId(artist);
                this.handleDrawerClose();
              }}>
              <img className='artistImage' src={this.state.spotifyArtists.images[i]} />
              <ListItemText primary={artist}/>
             </ListItem>);
    }));
  }

//Erases authorization ID and token from browser
  logout() {
    localStorage.clear();
    this.setState({
      dbArtistNames: [],
      dbArtistImages: []
    });
  }

  render() {
    return (
      <MuiThemeProvider theme={this.state.themeState ? theme : theme2}>
        <CssBaseline/>
        <div className="App">
          <div>
            <AppBar color='primary' position='sticky'>
              <Toolbar className='toolbar'>
                <div className='icon' onClick={() => this.handleDrawerOpen()}>
                  <IconButton>
                    <SvgIcon className='svgIcon'>
                       <path fill={theme.palette.secondary.main} d="M3,6H21V8H3V6M3,11H21V13H3V11M3,16H21V18H3V16Z" />
                    </SvgIcon>
                  </IconButton>
                </div>
                  {
                    !(authID && authToken) && ((window.innerWidth < 500) && (
                      <div>
                        <IconButton onClick={this.handleMenuOpen}>
                          <SvgIcon className='svgIcon'>
                            <path fill={theme.palette.secondary.main} d="M7,10L12,15L17,10H7Z" />
                          </SvgIcon>
                        </IconButton>
                        <Menu className='menu'
                          anchorEl={this.state.menuState}
                          open={Boolean(this.state.menuState)}
                          onClose={this.handleMenuClose}
                          >
                          <div></div>
                          <a href={`${serverUrl}/login`}>
                            <MenuItem onClick={this.handleMenuClose}>Login With Spotify</MenuItem>
                          </a>
                          <a href={`${clientUrl}/signin`}>
                            <MenuItem onClick={this.handleMenuClose}>Sign In</MenuItem>
                          </a>
                          <a href={`${clientUrl}/signup`}>
                            <MenuItem onClick={this.handleMenuClose}>Sign Up</MenuItem>
                          </a>
                        </Menu>
                      </div>
                    ) ||
                      <div className='authButtons'>
                        <Button href={`${serverUrl}/login`} variant='outlined' color='secondary'>Login With Spotify</Button>
                        <Button href={`${clientUrl}/signin`} variant='outlined' color='secondary'>Sign In</Button>
                        <Button href={`${clientUrl}/signup`} variant='outlined' color='secondary'>Sign Up</Button>
                      </div>
                    ) || (
                      <div className='logoutButton'>
                        <Button href={clientUrl} onClick={() => this.logout()} variant='contained' color='secondary'>
                          Log Out
                        </Button>
                      </div>
                    )
                  }
              </Toolbar>
            </AppBar>
            <Snackbar
              className='snackbar'
              anchorOrigin={{vertical: 'top', horizontal: 'center'}}
              open={this.state.snackBarState}
              onClose={() => this.handleSnackBarClose()}
              autoHideDuration={2000}
              message={<span>Not on tour</span>}
              />
          </div>
          <div className='container'>
              <div>
                <SwipeableDrawer
                  swipeAreaWidth={5}
                  open={this.state.drawerState}
                  onOpen={() => this.handleDrawerOpen()}
                  onClose={() => this.handleDrawerClose()}
                  >
                  <div className='drawer'>
                    <div className="topDrawer" >
                      <div className='nameAndButton'>
                        <div className='username'>
                          <Typography variant='body2'>
                            {this.state.userName}
                          </Typography>
                        </div>
                        <IconButton className='closeDrawer' onClick={() => this.handleDrawerClose()}>
                          <SvgIcon className='svgIcon'>
                             <path fill={theme.palette.secondary.main} d="M5,13L9,17L7.6,18.42L1.18,12L7.6,5.58L9,7L5,11H21V13H5M21,6V8H11V6H21M21,16V18H11V16H21Z" />
                          </SvgIcon>
                        </IconButton>
                      </div>
                      <div className='textField'>
                        <TextField
                          label='Search for an artist'
                          onChange={(e) => this.setState({value: e.target.value})}
                          onKeyPress={(e) => {
                            if(e.key === 'Enter') {
                              e.preventDefault();
                              this.setArtistId(this.state.value);
                              this.setState({drawerState: false});
                            }
                          }}
                          />
                          {
                            (authID && authToken) && (
                              <IconButton onClick={() => this.createArtist(this.state.value)}>
                                <SvgIcon className='svgIcon'>
                                  <path fill={theme.palette.secondary.main} d="M17,13H13V17H11V13H7V11H11V7H13V11H17M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z" />
                                </SvgIcon>
                              </IconButton>
                            )
                          }
                      </div>
                      <div>
                        <Button color='secondary' variant='outlined' onClick={() => {
                            this.setArtistId(this.state.value);
                            this.setState({drawerState: false});
                          }}>
                          Next Concert
                        </Button>
                        <Switch
                          checked={this.state.themeState}
                          onChange={this.handleThemeChange('themeState')}
                          />
                      </div>
                    </div>
                    <div>
                      <List>
                        {this.loadDBNames()}
                        {this.loadSpotifyNames()}
                      </List>
                    </div>
                  </div>
                </SwipeableDrawer>
                <GoogleMapsContainer
                  id='googleMap'
                  location={this.state.artistLookUp}
                  toggleMapColor={this.state.themeState}
                  />
              </div>
          </div>
        </div>
      </MuiThemeProvider>
    );
  }
}

export default Main;
