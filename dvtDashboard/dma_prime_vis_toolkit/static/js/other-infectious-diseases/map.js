const { GeoJsonLayer, IconLayer, MapboxOverlay, Widget } = deck;

export { zctaData, selectedItems, map, deckOverlay, popup, redraw, drawTooltip, drawAggregation, drawLegend, getData }

var zctaData = await d3.json(`/data/other-infectious-diseases`)
var zctaFeatures = undefined

var selectedItems = {
    "zcta": undefined,
    "diseases": [],
    "dataVersion": 0
}

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

var popup = new maplibregl.Popup({focusAfterOpen: false, closeOnClick: false})

const deckOverlay = new MapboxOverlay({
    interleaved: true,
})

map.addControl(deckOverlay)
map.addControl(new maplibregl.NavigationControl())

await Promise.allSettled([ // wait for following to be defined/load in
    customElements.whenDefined('sl-checkbox'),
    customElements.whenDefined('sl-button'),
])

var styleSheet = new CSSStyleSheet()
styleSheet.insertRule(`
    .maplibregl-popup-content {
        /* tooltip's containing div */
        background-color: hsla(${getComputedStyle(document.head).getPropertyValue("--sl-color-neutral-0").replace("hsl(", "").replace(")", "")}, 0.925);
    }`
    ,0)   

window.addEventListener("keydown", (event) => {
    if (event.key == "m") {
        function waitForChange() {
            if(changed != true) {
                window.setTimeout(waitForChange, 10);
            } else {
                styleSheet.deleteRule(0)
                styleSheet.insertRule(`
                    .maplibregl-popup-content {
                        /* tooltip's containing div */
                        background-color: hsla(${getComputedStyle(document.head).getPropertyValue("--sl-color-neutral-0").replace("hsl(", "").replace(")", "")}, 0.925);
                    }`
                    ,0)
                changed = false
            }
        }
        waitForChange()
    }
});

document.adoptedStyleSheets = [styleSheet]
drawAggregation()

redraw(true)

function redraw(first=false) {
    deckOverlay.setProps({
        layers: [
            new GeoJsonLayer({
                id: 'respiratory_choropleth',
                depthTest: false,
                pickable: true,
                data: d3.json(`/data/other-infectious-diseases`),
                onDataLoad: (data, context) => {   
                    createChoropleth(data)
                    zctaData = data
                    drawLegend()
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
                updateTriggers: {
                    data: [ mapRateSwitch.value, selectedItems.diseases, selectedItems.dataVersion ],
                    // getFillColor: { dataVersion }
                },
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
    var thisData = getData(feature)
    var value = NaN
    if (thisData.data.length > 0) {
        value = thisData.data.at(-1)
    }

    var c = d3.rgb(choroplethColorMap(value))

    return [c.r, c.g, c.b]
}

function createChoropleth(data) {
    var arr = data.features.map((feature) => {
        var thisData = getData(feature)

        if (thisData.data.length > 0 && feature.properties.ZCTA != "state") {
            return thisData.data.at(-1)
        } else {
            return 0
        }
    })

    choroplethColorMap = d3.scaleLinear()
        .domain([0, d3.max(arr)])
        .range(["white", "maroon"])
        .unknown(d3.hsl("#7F7F7F")).nice()

}

function drawLegend() {
    choroplethLegendSVG.innerHTML = ""
    var legend = d3.select(choroplethLegendSVG)
        .attr("overflow", "visible")

    legend.attr("transform", `translate(40, 0)`)
        .attr("width", 450)
        .attr("height", 50)
    var legDefs = legend.append("defs")
    var linearGradient = legDefs.append("linearGradient")
        .attr("id", "linear-gradient")
        .attr("x1", "0%")
        .attr("y1", "0%")
        .attr("x2", "100%")
        .attr("y2", "0%")
    linearGradient.append("stop")
        .attr("offset", "0%")
        .attr("stop-color", "white")
    linearGradient.append("stop")
        .attr("offset", "100%")
        .attr("stop-color", "maroon")

    legend.append("rect")
        .style("fill", "url(#linear-gradient)")
        .attr("width", 450)
        .attr("height", 15)

    var xAxis = legend.append("g")
        .attr("transform", "translate(0,15)")
        .call(d3.axisBottom(d3.scaleLinear().domain(d3.extent(choroplethColorMap.domain())).range([0, 450])))

}

function drawTooltip(dataObject) {
    if(!dataObject || !popup.isOpen()) {
        return
    }
    var thisData = getData(dataObject)
    // draw in tooltip
    var ttpWidth = Math.max(400, mapDiv.clientWidth * .25)
    var ttpHeight = ttpWidth * .35

    var ttpDiv = d3.select("#map-tooltip-div")

    ttpDiv.style("display", "initial")
    ttpDiv.style("border-style", "none")
    ttpDiv.html("")
        
    var ttpTitle = ttpDiv.append("p")
        .attr("class", "tooltip-title")
    ttpTitle.append("span")
        .attr("class", "tooltip-title")
        .html(`ZCTA: ${dataObject.properties.ZCTA}`)
    ttpTitle.append("br")
    ttpTitle.append("span")
        .attr("class", "tooltip-subtitle")
        .html(`County: ${dataObject.properties.county[0].toUpperCase()+dataObject.properties.county.substring(1)}`)

    if (thisData.data.length < 1) {
        ttpDiv.append("p").html("No Data")
        return
    }

    ttpTitle.append("br")
    ttpTitle.append("span")
        .attr("class", "tooltip-subtitle")
        .html(`Encounters in week of ${d3.utcFormat("%B %d, %Y")(parseDate(thisData.end_date))}: ${thisData.data.at(-1)}`)

    var ttpSVG = ttpDiv.append("svg")
        .attr("id", `map-tooltip-svg`)
        .attr("class", `tooltip-outer-svg`)
    
    createBarGraph(ttpSVG, thisData, ttpHeight, ttpWidth)
}

function drawAggregation() {
    var aggWidth = Math.max(300, document.getElementById("map-sidebar").clientWidth)
    var aggHeight = aggWidth * .5

    var aggSVG = d3.select(aggregatedDiseaseHistory)
    aggSVG.html("")

    var aggData = zctaData.features.find(e => e.properties.ZCTA == "state")

    var thisData = getData(aggData)
    
    createBarGraph(aggSVG, thisData, aggHeight, aggWidth)
}

function getData(feature) {
    var diseases = selectedItems.diseases
    var thisData = {
        "data": [],
        "population": feature.properties.population,
        "start_date": dayjs(),
        "end_date": dayjs(),
    }
    if (mapAllDiseaseSelector.checked) {
        // all diseases
        var dataDicts = Object.values(feature.properties.data)
        var earliestDate = d3.min(dataDicts.map(d => parseDate(d.start_date)))
        var latestDate = d3.max(dataDicts.map(d => parseDate(d.end_date)))
        thisData.start_date = earliestDate
        thisData.end_date = latestDate
        var weeks = d3.timeSaturday.range(earliestDate, latestDate)
        weeks.push(latestDate)

        thisData.data = new Array(weeks.length).fill(0)
        for (var data of dataDicts) {
            var startIndex = weeks.findIndex(d => dayjs(d).isSame(data.start_date))
            if (startIndex > -1) {
                for (var i=0; i < data.data.length; i++) {
                    thisData.data[i+startIndex] += data.data[i]
                }
            }
        }        
    } else {
        if (diseases.length > 0) {
            // one/many diseases
            var dataDicts = Object.entries(feature.properties.data).filter(d => diseases.includes(d[0]))
            dataDicts = dataDicts.map(d => d[1])

            var earliestDate = d3.min(dataDicts.map(d => parseDate(d.start_date)))
            var latestDate = d3.max(dataDicts.map(d => parseDate(d.end_date)))
            thisData.start_date = earliestDate
            thisData.end_date = latestDate
            var weeks = d3.timeSaturday.range(earliestDate, latestDate)
            weeks.push(latestDate)

            thisData.data = new Array(weeks.length).fill(0)
            for (var data of dataDicts) {
                var startIndex = weeks.findIndex(d => dayjs(d).isSame(data.start_date))
                if (startIndex > -1) {
                    for (var i=0; i < data.data.length; i++) {
                        thisData.data[i+startIndex] += data.data[i]
                    }
                }
            }
            console.log(feature.properties.ZCTA, earliestDate, latestDate, weeks, startIndex, thisData)
        }
    }    
    
    // rate applied at end
    if (mapRateSwitch.value == "rate") {
        thisData.data = thisData.data.map((val) => 
            (parseFloat(val) / (thisData.population / 1000.0)) || 0)
    }
    // console.log(feature.properties.ZCTA, thisData)
    return thisData
}
