import { useEffect, useRef } from "react";
import leaflet from "leaflet";
import useLocalStorage from "../hooks/useLocalStorage";
import useGeolocation from "../hooks/useGeolocation";
import "leaflet-routing-machine";
import L from "leaflet";

export default function Map() {
  const mapRef = useRef();
  const userMarkerRef = useRef();

  const location = useGeolocation();

  const [nearbyMarkers, setnearbyMarkers] = useLocalStorage(
    "NEARBY_MARKERS",
    []
  );

  const [userPosition, setUserPosition] = useLocalStorage("USER_MARKER", {
    latitude: 0,
    longitude: 0,
  });

  // const carIcon = L.icon({
  //   iconUrl: './assets/car.png',
  //   iconSize: [70, 70],
  // })

  //for setting the markers
  useEffect(() => {
    mapRef.current = leaflet
      .map("map")
      .setView([userPosition.latitude, userPosition.longitude], 13);

    leaflet
      .tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution:
          '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      })
      .addTo(mapRef.current);

    nearbyMarkers.forEach(({ latitude, longitude }) => {
      leaflet
        .marker([latitude, longitude])
        .addTo(mapRef.current)
        .bindPopup(
          `lat: ${latitude.toFixed(2)}, long: ${longitude.toFixed(2)}`
        );
    });

    mapRef.current.addEventListener("click", (e) => {
      const { lat: latitude, lng: longitude } = e.latlng;

      const secondMarker = leaflet
        .marker([latitude, longitude])
        .addTo(mapRef.current)
        .bindPopup(
          `lat: ${latitude.toFixed(2)}, long: ${longitude.toFixed(2)}`
        );

      // setnearbyMarkers((prevMarkers)=>[
      //   ...prevMarkers,
      //   {latitude, longitude}
      // ])

      const lat = location.latitude;
      const long = location.longitude;

      if (location) {
        L.Routing.control({
          waypoints: [L.latLng(lat, long), L.latLng(latitude, longitude)],
        })
          .on("routesfound", (e) => {
            console.log(e);
            e.routes[0].coordinates.forEach((coord, index) => {
              setTimeout(() => {
                secondMarker.setLatLng([coord.lat, coord.lng]);
              }, 100 * index);
            });
          })
          .addTo(mapRef.current);
      }
    });
 
    return () => mapRef.current.remove();
  }, [location]);

  //for setting the user position
  useEffect(() => {
    setUserPosition({ ...userPosition });

    if (userMarkerRef.current) {
      mapRef.current.removeLayer(userMarkerRef.current);
    }

    userMarkerRef.current = leaflet
      .marker([location.latitude, location.longitude])
      .addTo(mapRef.current)
      .bindPopup(`lat: ${location.latitude}, long: ${location.longitude}`);

    console.log(location.latitude, location.longitude);

    const el = userMarkerRef.current.getElement();
    if (el) {
      el.style.filter = "hue-rotate(120deg)";
    }

    mapRef.current.setView([location.latitude, location.longitude]);
  }, [location, userPosition.latitude, userPosition.longitude]);

  return <div id="map" ref={mapRef}></div>;
}
