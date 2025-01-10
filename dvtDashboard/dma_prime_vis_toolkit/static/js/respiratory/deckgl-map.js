const { GeoJsonLayer, IconLayer, MapboxOverlay } = deck;

// export { map, deckOverlay, brushes, thresholds, xScales, selectedZCTA, selectedCounty, zctaFeatures, countyData, redraw, updateHistogram, mobileClinicClick }

var zctaData = await d3.json(`/data/deckgl-respiratory`)
var zctaFeatures = undefined
var countyData = await d3.json(`/data/map/county`)

var choroplethColorMap = d3.scaleLinear()
    .domain([0, 1])
    .range(["white", dataSourceColorMap["state-data"]])
    .unknown("var(--sl-color-gray-600)").nice()


let selectedZCTA = {
    zcta: undefined,
}
let selectedCounty = {
    county: undefined,
}

const map = new maplibregl.Map({
    container: "map-div",
    style: "https://basemaps.cartocdn.com/gl/positron-nolabels-gl-style/style.json",
    center: [-81, 33.65],
    zoom: 7
})

await map.once('load')

const deckOverlay = new MapboxOverlay({
    interleaved: false,
})

map.addControl(deckOverlay)
map.addControl(new maplibregl.NavigationControl())

await Promise.allSettled([ // wait for following to be defined/load in
    customElements.whenDefined('sl-select'),
    customElements.whenDefined('sl-option'),
    customElements.whenDefined('sl-button'),
])

redraw()


function getDataFromFeatures(feature, column, year, rate) {
    var columnData = feature.properties.data[column]
    if (columnData) {
        var val = +columnData[year]
        if (rate & ["hospitalizations", "deaths"].includes(column))  {
            val = (val/feature.properties.population) * 1000
        } 
        return val  
    } else {
        return undefined
    }
      
}

function redraw(first=false) {
    deckOverlay.setProps({
        layers: [
            new GeoJsonLayer({
                id: 'respiratory_choropleth',
                depthTest: false,
                data: d3.json(`/data/deckgl-respiratory`),
                onDataLoad: (data, context) => {   
                    console.log(data)

                    createChoropleth(data, mapDiseaseSelector.value, mapDataSourceSelector.value, mapRateSwitch.value == "rate", mapIncludeImputations.checked)
                    // zctaData = data
                    // zctaFeatures = data.features
                                        
                    // if (selectedZCTA.zcta) {
                    //     zctaFeatures = zctaData.features
                    //     zctaFeatures.push(selectedZCTA.zcta)
                    //     var currIndex = zctaFeatures.findIndex(d => {return selectedZCTA.zcta.properties.ZCTA == d.properties.ZCTA})
                    //     zctaFeatures.splice(currIndex, 1)
                    // }
                    // drawLegend()
                    // if (first == true) {
                    //     d3.select(mapVariable1Selector).selectAll("sl-option")
                    //     .each(function(el) {
                    //         var column = this.value
                    //         d3.select(mapFiltersContainer).append("svg")
                    //             .attr("id", `map-${column}-filter`)
                    //             .attr("class", "map-histogram-filter")
                    //         updateHistogram(column)
                    //     })
                    //     first = false
                    // }

                },
                stroked: false,
                // stroked: true,
                filled: true,
                pointType: 'circle+text',
                // pickable: true,
                // onClick: function(info, event) {mobileClinicClick(info.object); redraw();},
                getFillColor: d => getColor(d),
                // getFillColor: [128,128,128],
                highlightColor: [255, 255, 255, 0],
                lineWidthMinPixels: .5,
                // getLineWidth: (d, i) => {return 20 * (d == selectedZCTA.zcta ? 50 :1)},
                // getLineColor: (d, i) => {return d == selectedZCTA.zcta ? [255, 255, 255] : [0, 0, 0]},
                // getPointRadius: 4,
                // getTextSize: 12,
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
                lineWidthMinPixels: .5,
                getLineWidth: 20,
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
    var dataSource = mapDataSourceSelector.value
    var rate = mapRateSwitch.value == "rate"
    var imputations = mapIncludeImputations.checked

    var thisData = feature.properties.data[disease]
    var value = NaN

    if (thisData[dataSource].data.length > 0 && (imputations || !thisData.imputation)) {
        if (rate) {
            value = thisData[dataSource].data.at(-1) / feature.properties.population * 1000
        } else {
            value = thisData[dataSource].data.at(-1)
        }
    }

    var c = d3.rgb(choroplethColorMap(value))
    return [c.r, c.g, c.b]
}

function createChoropleth(data, disease, dataSource, rate, imputations=True) {
    var arr = data.features.map((d) => {
        var thisData = d.properties.data[disease]

        if (thisData[dataSource].data.length > 0 && (imputations || !thisData.imputation)) {
            if (rate) {
                return thisData[dataSource].data.at(-1) / d.properties.population * 1000
            } else {
                return thisData[dataSource].data.at(-1)
            }
        } else {
            return 0
        }
    })

    choroplethColorMap = d3.scaleLinear()
        .domain([0, d3.max(arr)])
        .range(["white", dataSourceColorMap[dataSource]])
        .unknown("var(--sl-color-gray-600)").nice()

}
