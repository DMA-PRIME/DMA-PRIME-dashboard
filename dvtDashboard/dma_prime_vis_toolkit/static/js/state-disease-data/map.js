const { GeoJsonLayer, IconLayer, MapboxOverlay, Widget } = deck;

export { map, deckOverlay, zctaData, redraw }

var zctaData = await d3.json(`/data/state-disease-data`)
var zctaFeatures = undefined

var choroplethColorMap = d3.scaleLinear()
    .domain([0, 1])
    .range(["white", "maroon"])
    .unknown(d3.hsl("#7F7F7F")).nice()

const map = new maplibregl.Map({
    container: "map-div",
    style: "https://basemaps.cartocdn.com/gl/positron-nolabels-gl-style/style.json",
    center: [-81, 33.65],
    zoom: 7,
})

await map.once('load')

var popup = new maplibregl.Popup()

const deckOverlay = new MapboxOverlay({
    interleaved: true,
})

map.on("click", e => {
    var temp = {x: e.point.x, y: e.point.y}
    var dataObject = deckOverlay.pickObject(temp).object
    
    var coordinates = [dataObject.properties.INTPTLON, dataObject.properties.INTPTLAT]
    popup.setLngLat(coordinates)
        .setHTML("<div id='map-tooltip-div' class='tooltip-div'></div>")

    popup.addTo(map)
    popup.setMaxWidth(`${mapDiv.clientWidth}px`)

    var ttpDiv = d3.select("#map-tooltip-div")

    ttpDiv.style("display", "initial")
    ttpDiv.style("border-style", "none")
        
    var ttpTitle = ttpDiv.append("p")
        .attr("class", "tooltip-title")
    ttpTitle.append("span")
        .attr("class", "tooltip-title")
    ttpTitle.append("br")
    ttpTitle.append("span")
        .attr("class", "tooltip-subtitle")

    ttpDiv.append("svg")
        .attr("id", `map-tooltip-svg`)
        .attr("class", `tooltip-outer-svg`)

    var tooltipData = dataObject.properties.data[mapDiseaseSelector.value]
    tooltipData["zcta"] = dataObject.properties.ZCTA
    tooltipData["county"] = dataObject.properties.county
    tooltipData["population"] = dataObject.properties.population

    var width = mapDiv.clientWidth
    var mapTooltipWidth = Math.max(500, width * .3)
    var mapTooltipHeight = mapTooltipWidth * .65
    drawTooltip(tooltipData, ttpDiv, mapTooltipHeight, mapTooltipWidth, gridRateSwitch.value == "rate")

})

map.addControl(deckOverlay)
map.addControl(new maplibregl.NavigationControl())

await Promise.allSettled([ // wait for following to be defined/load in
    customElements.whenDefined('sl-select'),
    customElements.whenDefined('sl-option'),
    customElements.whenDefined('sl-button'),

redraw(true)

])

function redraw(first=false) {
    console.log("redraw")
    deckOverlay.setProps({
        layers: [
            new GeoJsonLayer({
                id: 'respiratory_choropleth',
                depthTest: false,
                pickable: true,
                data: d3.json(`/data/state-disease-data`),
                onDataLoad: (data, context) => {   
                    console.log(data)

                    createChoropleth(data, mapDiseaseSelector.value, mapRateSwitch.value == "rate")
                    zctaData = data
                },
                stroked: true,
                filled: true,
                pointType: 'circle+text',
                pickable: true,
                getFillColor: d => getColor(d),
                highlightColor: [255, 255, 255, 0],
                lineWidthMinPixels: .75,
                getLineWidth: 20,
                getLineColor: [64, 64, 64],
                // updateTriggers: {
                //     data: { dataVersion },
                //     getFillColor: { dataVersion },
                //     getLineWidth: selectedZCTA["zcta"],
                //     getLineColor: selectedZCTA["zcta"],
                // },
            }),
            new GeoJsonLayer({
                id: 'respiratory_county',
                depthTest: false,
                data: d3.json(`/data/map/county`),
                stroked: true,
                filled: false,
                pointType: 'circle+text',
                pickable: false,
                lineWidthMinPixels: 1.5,
                getLineWidth: 30,
                getLineColor: [0, 0, 0],
            }),
            // new IconLayer({
            //     id: 'hospital-and-cdap',
            //     data: d3.csv('/data/health-care-facility/all'),
            //     iconAtlas: '/data/icon-pack/png',
            //     iconMapping: '/data/icon-pack/json',
            //     getPosition: d => {return [+d.longitude, +d.latitude]},
            //     getIcon: d => {if(checked.includes(d.type)) return d.type},
            //     getSize: 15,
            //     pickable: true,
            //     parameters: {
            //         depthTest: false
            //     },
            // })
        ]
    })

}

function getColor(feature) {
    var disease = mapDiseaseSelector.value
    var rate = mapRateSwitch.value == "rate"

    var thisData = feature.properties.data[disease]
    var value = NaN

    if (thisData.data.length > 0) {
        if (rate) {
            value = thisData.data.at(-1) / feature.properties.population * 1000
        } else {
            value = thisData.data.at(-2)
        }
    }

    var c = d3.rgb(choroplethColorMap(value))

    return [c.r, c.g, c.b]
}

function createChoropleth(data, disease, rate) {
    var arr = data.features.map((d) => {
        var thisData = d.properties.data[disease]

        if (thisData.data.length > 0 && d.properties.ZCTA != "state") {
            if (rate) {
                return thisData.data.at(-1) / d.properties.population * 1000
            } else {
                return thisData.data.at(-2)
            }
        } else {
            return 0
        }
    })

    choroplethColorMap = d3.scaleLinear()
        .domain([0, d3.max(arr)])
        .range(["white", "maroon"])
        .unknown(d3.hsl("#7F7F7F")).nice()

}

