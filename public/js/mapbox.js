
const mapbox = document.getElementById('map')


if(mapbox){

  const locations = JSON.parse(mapbox.dataset.locations);

  mapboxgl.accessToken = 'pk.eyJ1IjoiYXVzdGluZmFiaWFuIiwiYSI6ImNsNTN4Mjl1MDB0amQzZXJ4cmoxbTU1aXAifQ.2CyD3OaN_rJoaE7MEZ9z3Q';
const map = new mapboxgl.Map({
container: 'map', // container ID
style: 'mapbox://styles/austinfabian/cl54dc0ot003x14nim2f3gpn0', // style URL
center: [-74.5, 40], // starting position [lng, lat]
scrollZoom:false,
zoom: 9, // starting zoom
projection: 'globe' // display the map as a 3D globe
});
    map.on('style.load', () => {
    map.setFog({}); // Set the default atmosphere style
});

const bounds = new mapboxgl.LngLatBounds();

  locations.forEach(loc => {
    // Create marker
    const el = document.createElement('div');
    el.className = 'marker';

    // Add marker
    new mapboxgl.Marker({
      element: el,
      anchor: 'bottom'
    })
      .setLngLat(loc.coordinates)
      .addTo(map);

    // Add popup
    new mapboxgl.Popup({
      offset: 20
    })
      .setLngLat(loc.coordinates)
      .setHTML(`<p>Day ${loc.day}: ${loc.description}</p>`)
      .addTo(map);

    // Extend map bounds to include current location
    bounds.extend(loc.coordinates);
  });
  map.fitBounds(bounds, {
    padding: {
      top: 200,
      bottom: 150,
      left: 100,
      right: 100
    }
  });
}

  

