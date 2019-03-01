import React, {Component} from 'react';
import { GoogleApiWrapper, InfoWindow, Map, Marker } from 'google-maps-react';
import './App.css';
import Button from '@material-ui/core/Button';
import style from './mapStyles';

export class GoogleMapsContainer extends Component {
  state = {
    showingInfoWindow: false,
    activeMarker: {},
    selectedPlace: {}
  };

  onMarkerClick = (props, marker, e) =>
    this.setState({
      selectedPlace: props,
      activeMarker: marker,
      showingInfoWindow: true
    });

  onMapClicked = (props) => {
    if (this.state.showingInfoWindow) {
      this.setState({
        showingInfoWindow: false,
        activeMarker: null
      })
    }
  };

  render() {
    const {name, lat, lng, type, city, url} = this.props.location;
    const {google} = this.props;
    let  bounds = new google.maps.LatLngBounds();
    let loc = new google.maps.LatLng(lat, lng);
    bounds.extend(loc);
    let offset = 0.5;
    let center = bounds.getCenter();
    bounds.extend(new google.maps.LatLng(center.lat() + offset, center.lng() + offset));
    bounds.extend(new google.maps.LatLng(center.lat() - offset, center.lng() - offset));

    return (
      <Map styles={style} google={this.props.google}
          onClick={this.onMapClicked}
          initialCenter={{lat: 40.7128, lng: -74.0060}}
          bounds={bounds}
          zoom={(window.innerWidth < 500) ? 8 : 9}>
        <Marker onClick={this.onMarkerClick}
                position={{lat: lat, lng: lng}}
                visible={this.props.location.showMarker}
                />
      <InfoWindow
          marker={this.state.activeMarker}
          visible={this.state.showingInfoWindow}
          maxWidth={(window.innerWidth < 500) ? (window.innerWidth / 2) : null}
          >
            <div className='infoWindow'>
              <h3>{name}</h3>
              <h3>{type}</h3>
              <h3>{city}</h3>
              <Button href={url} target='_blank' variant='contained' color='primary'>
                Buy Tickets From Songkick
              </Button>
            </div>
        </InfoWindow>
      </Map>
    )
  }
}
export default GoogleApiWrapper({
  apiKey: 'AIzaSyAc-VvMlXv_kTTpd0vRvUu8URUSuzrSdKg',
})(GoogleMapsContainer)
