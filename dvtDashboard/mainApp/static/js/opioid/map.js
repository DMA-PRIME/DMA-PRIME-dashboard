const { DeckGL, GeoJsonLayer } = deck;


// import {MapboxOverlay as DeckOverlay} from '@deck.gl/mapbox';
// import {GeoJsonLayer} from '@deck.gl/layers';
// import maplibregl from 'maplibre-gl';
// import 'maplibre-gl/dist/maplibre-gl.css';

// const map = new maplibregl.Map({
//     container: "map-div",
//     style: 'https://basemaps.cartocdn.com/gl/positron-nolabels-gl-style/style.json',
//     center: [-80.75, 33.8],
//     zoom: 7,
// })

// const deckOverlay = new DeckOverlay({

// })

// map.addControl(deckOverlay)
// map.addControl(new maplibregl.NavigationControl())

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

// deckgl.addWidget(new D3Anchor({
//     "id": "choropleth-legend",
//     "placement": "bottom-left",
//     "divId": "help"
// }));

function redraw() {
    processZctaData().then(function () {
        features = zctaData.features

        var1Data = d3.map(features, d => +d.properties[mapVariable1Selector.value])
        var2Data = d3.map(features, d => +d.properties[mapVariable2Selector.value])

        bivariateColormap = createBivariateColormap(d3.min(var1Data), d3.max(var1Data), d3.min(var2Data), d3.max(var2Data))

        deckgl.setProps({
            layers: [
                new GeoJsonLayer({
                    id: 'opioid_choropleth',
                    data: zctaData, //'../../static/data/opioid_zcta_hospitalization_data.json',
                    stroked: true,
                    filled: true,
                    pointType: 'circle+text',
                    pickable: true,

                    getFillColor: d => {
                        var c = d3.rgb(bivariateColormap(+d.properties.data[mapYearSelector.value][mapVariable1Selector.value])(+d.properties.data[mapYearSelector.value][mapVariable2Selector.value])); return [c.r, c.g, c.b]
                    },
                    getStrokeColor: [0, 0, 0],
                    getLineColor: [0, 0, 0],
                    lineWidthMinPixels: .5,
                    getLineWidth: 20,
                    getPointRadius: 4,
                    getText: d => d.properties.ZCTA5CE20,
                    getTextSize: 12,
                    updateTriggers: {
                        getFillColor: { dataVersion }
                    }
                })
            ]
        })

        return true
    })

}
