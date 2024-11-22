const {DeckGL, IconLayer, FlyToInterpolator} = deck;

var mobileHealthClinics = [
]

let dataVersion = 0

const deckgl = new DeckGL({
    container: document.getElementById("map-div"),
    mapStyle: 'https://basemaps.cartocdn.com/gl/positron-nolabels-gl-style/style.json',
  initialViewState: {
    longitude: -80.75,
    latitude: 33.8,
    zoom: 7
  },
  controller: true,
  pickingRadius: 10,
});

redraw();

function redraw() {
  deckgl.setProps({
    layers: [
    new IconLayer({
      id: 'mobile-health-clinic',
      data: d3.json('/data/mobile-health-clinic-events').then(data => {
        data.forEach((datum, index) => {
          try {
            if (data[index].event_date.length >= 10) {
              data[index].event_date = dayjs.tz(data[index].event_date, "America/New_York") 
            }
          } catch (RangeError) {
            console.log(data[index].event_date, "was not able to be parsed")
          }  
        })
        return data
      }),
      iconAtlas: '/icon-pack/png',
      iconMapping: '/icon-pack/json',
      getPosition: d => {return [+d.site_lon, +d.site_lat]},
      getColor: [255, 0, 0],
      getIcon: d => 'mobile_health_clinic',
      sizeScale: 15,
      pickable: true,
      parameters: {
        depthTest: false
      },
      autoHighlight: true,
      highlightColor: [255, 200, 0],
      // onDragStart: (info, event) => { deckgl.setProps({controller: {dragPan: false}}) },
      // onDrag: mobileClinicDrag,
      // onDragEnd: (info, event) => { 
      //   deckgl.setProps({controller: true}); 
      //   updateLocationCoords(info.index, lat=mobileHealthClinics[info.index].coords.lat, lon=mobileHealthClinics[info.index].coords.lon) },
      onClick: (info, event) => mobileClinicClick(info.object),
      updateTriggers: {
        getPosition: {dataVersion}
      },
      
    })
      ]})
    return true
}