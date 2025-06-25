
export { zctaData, 
    startDate, currentWeek, endDate, historicalDates, predictionDates, 
    dataVariableColorMap, gridLineStyle, unknownColor,
    gridItemDataSources, 
    parseDate, getDataAsArray, getBoundsOfCoords, getCenter,
    drawTooltip }


// data
var currentWeek = parseDate(metadata.current_week)

var startDate = parseDate(metadata.start_date)
var historicalDates = d3.timeDay.range(startDate, new Date(currentWeek).setDate(currentWeek.getDate()+1), 7)

var endDate = parseDate(metadata.end_date)
var predictionDates = d3.timeDay.range(currentWeek, new Date(endDate).setDate(endDate.getDate()+1), 7)

const zctaData = await d3.json(`/data/respiratory/zcta/covid-19?${parseInt(Math.random()*9999999999)}`)
await Promise.allSettled([ // wait for following to be defined/load in
    customElements.whenDefined('sl-select'),
    customElements.whenDefined('sl-option'),
])

// visualization variables
var formatInt = d3.format(".0f")

let dataVersion = 0

var gridItemDataSources = ["state_encounters_historical", "health-system_encounters_historical"]

var unknownColor = d3.hsl("#CCCCCC")

var dataVariableColorMap = {
    "encounters": "#FFB000",
    "encounters-projected": "#FE6100",
    "positive-tests": "#648FFF",
    "positive-tests-projected": "#785EF0",
    "rt": "#AA4499",
    "rt-projected": "#882255",
}

var dataVariableStringMap = {
    "encounters": "Encounters",
    "positive-tests": "Positive Tests",
    "rt": "Transmission",
}

var gridLineStyle = {
    "health-system_encounters_historical": null,
    "state_encounters_historical": "5,5",
}

var ttpHistoryWidthPercentage = 3/4

var styleSheet = new CSSStyleSheet()

d3.selectAll('sl-tooltip').nodes().forEach((n, i) => {
    d3.select(n.shadowRoot).select("div[part='body']")
    .style('background-color', `hsla(${getComputedStyle(document.head).getPropertyValue("--sl-color-neutral-1000").replace("hsl(", "").replace(")", "")}, 0.925)`)
})

window.addEventListener("keydown", (event) => {
    if (event.key == "m") {
        function waitForChange() {
            if(changed != true) {
                window.setTimeout(waitForChange, 10);
            } else {
                styleSheet.deleteRule(0)
                styleSheet.insertRule(`
                    .tooltip-div {
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

// data fetching
function getDataAsArray(data, dataSource, dataVariable, histOrProj, rate, imputations=true) {
    var arr = data.features.map((d) => {
        var thisData = d.properties.data[dataSource][dataVariable][histOrProj]
        
        if (thisData.length > 0 && (imputations || !d.properties.data.imputation)) {
            if (rate) {
                return (parseInt(thisData.at(-1)) | 1) * 1000 / d.properties.population
            } else {
                return parseInt(thisData.at(-1)) | 1
            }
        } else {
            return rate ? 1000 / d.properties.population : 1
        }
    })

    return arr
}

// helper functions
function parseDate(dateString) {
    return dayjs(dateString, "YYYY-MM-DD").toDate()
}

function getBoundsOfCoords(coordinates) {
    var bounds = new maplibregl.LngLatBounds()
    function addCoordToBounds(bounds, arr) {
        if (Array.isArray(arr[0])) {
            arr.forEach(a => {
                addCoordToBounds(bounds, a)
            })
        } else {
            bounds.extend(arr)
            return
        }
    }
    addCoordToBounds(bounds, coordinates)
    return bounds
}

function getCenter(feature) {
    var coordinates = [feature.properties.INTPTLON, feature.properties.INTPTLAT]

    if (!(coordinates[0] && coordinates[1])) {
        coordinates = getBoundsOfCoords(feature.geometry.coordinates).getCenter()
        coordinates = [coordinates.lng, coordinates.lat]
    } else {
        coordinates[0] = fixCoord(coordinates[0])
        coordinates[1] = fixCoord(coordinates[1])    
    }
    return coordinates
}

function fixCoord(coord) {
    while (coord[1] == "0") {
        coord = coord[0] + coord.slice(2)
    }
    return parseFloat(coord)
}

function drawTooltip(d, ttpSVG, header, footer, rate=false, dataSource, dataVariable, grid=false, extraSourcesAndVariables={}) {
    // handy
    var mainDataVar = dataVariable
    
    // get dimensions
    var ttpHeight = ttpSVG.node().clientHeight
    var ttpWidth = ttpSVG.node().clientWidth
    
    // don't want to mess up og data
    var data = JSON.parse(JSON.stringify(d))
    var mainData = data.data[dataSource][dataVariable]

    // to use later
    ttpSVG.datum({"extraSourcesAndVariables": extraSourcesAndVariables})

    // create titles/subtitles
    var dataVarString = dataVariableStringMap[dataVariable]
    var regionInfo = header.select(".tooltip-region-info")
    regionInfo.node().innerHTML = ""
    if (grid) {
        regionInfo.append("p").html(`Zip Code: ${data.id}`)
    } else {
        if (mapRegionSelector.value != "state") {
            regionInfo.append("p").html(`${metadata.region_sizes[mapRegionSelector.value]}: ${data.id}`)
        } else {
            regionInfo.append("p").html("State")
        }
    }
    if (mapRegionSelector.value == "zcta" || grid) {
        regionInfo.append("p").html(`County: ${data.county[0].toUpperCase()+data.county.substring(1)}`)
    }

    var dataInfo = header.select(".tooltip-data-info")
    dataInfo.node().innerHTML = ""
    if (rate) {
        dataInfo.append("p").html(`Rate of ${dataVarString} (per 1000 people)`)
    } else {
        dataInfo.append("p").html(`Count of ${dataVarString}`)
    }
    if (mainData.historical.length) {
        let tempDate = parseDate(metadata['start_date'])
        let tempEndDate = parseDate(metadata['current_week'])
        var formatDate = d3.timeFormat("%b %d, %Y")
        var tooltipString = `Estimated ${dataVarString} from ${formatDate(tempDate)} to ${formatDate(tempEndDate)}`
        dataInfo.append("p").html(tooltipString)
        if (mainData.projected.length) {
            tempDate = parseDate(metadata['current_week'])
            tempEndDate = parseDate(metadata['end_date'])
            tooltipString = `Projected ${dataVarString} from ${formatDate(tempDate)} to ${formatDate(tempEndDate)}`
            dataInfo.append("p").html(tooltipString)  
        }
    }

    /* Draw Graph */
    // reset tooltip contents for new data
    ttpSVG.node().innerHTML = ""
    var graphSVG = ttpSVG.append("svg")
        .attr("class", "tooltip-graph-svg")
        .attr("height", ttpHeight)
        .attr("width", ttpWidth)
    graphSVG.append("line")
        .attr("class", "tooltip-prediction-separator")

    var yAxis = ttpSVG.append("g")
        .attr("class", "y-axis")
    var xAxisHistorical = ttpSVG.append("g")
        .attr("class", "x-axis-historical")
    var xAxisPrediction = ttpSVG.append("g")
        .attr("class", "x-axis-prediction")
    var ttpLegend = ttpSVG.append("g").attr("class", "tooltip-legend")

    // apply rate if necessaryand figure out axes scaling
    var countMax = rate ? 1/d.population : 1 // so y scale is never 0-0

    for (let [dataSrc, dataVars] of [...Object.entries(extraSourcesAndVariables), [dataSource, [dataVariable]]]) {
        for (let dataVar of dataVars) {
            if (rate) {
                data.data[dataSrc][dataVar].historical = data.data[dataSrc][dataVar].historical.map(function(item) { return item === null ? null : item/d.population * 1000})
                data.data[dataSrc][dataVar].projected = data.data[dataSrc][dataVar].projected.map(function(item) { return item === null ? null : item/d.population * 1000})
            }
            if (data.data[dataSrc][dataVar].historical.length && data.data[dataSrc][dataVar].projected.length) {
                countMax = d3.max([...data.data[dataSrc][dataVar].historical, ...data.data[dataSrc][dataVar].projected, countMax])
            }
        }
    }

    // figure out how much space is needed for the y-axis text
    var temp = ttpSVG.append("text").text(d3.format(".2r")(countMax)).attr("x", 0).attr("y", 0)
    var ttpMargins = {
        "top": 1*em, 
        "bottom": 1*em + 2*em + 1*em,
        "left": Math.max(20, temp.node().getBBox().width) + 2*em,
        "right": em,
    }
    var ttpGraphWidth = ttpWidth - ttpMargins.right - ttpMargins.left

    var yScale = d3.scaleLinear()
        .domain([0, countMax])        
        .nice()
        .range([ttpHeight-ttpMargins.bottom, ttpMargins.top])

    var xScaleHistorical = d3.scaleTime()
        .domain(d3.extent(historicalDates))
        .range([ttpMargins.left, ttpMargins.left + ttpGraphWidth*ttpHistoryWidthPercentage]) 
    var xScalePrediction = d3.scaleTime()
        .domain(d3.extent(predictionDates))
        .range([ttpMargins.left + ttpGraphWidth*ttpHistoryWidthPercentage, ttpWidth - ttpMargins.right]) 

    // draw historical data for selected data var
    var historicalGroup = graphSVG.append("g")
    var historicalBarWidth = Math.ceil(ttpGraphWidth*ttpHistoryWidthPercentage / historicalDates.length)
    historicalGroup.append("g")
        .selectAll("rect")
        .data(mainData.historical)
        .enter()
        .append("rect")
        .attr("x", (_, i) => {return xScaleHistorical(historicalDates[i])})
        .attr("y", d => {return yScale(d)})
        .attr("height", d => yScale(0) - yScale(d))
        .attr("width", historicalBarWidth)
        .attr("fill", dataVariableColorMap[mainDataVar])

    // draw projected data for selected data var
    var stateCurrentLabelPositionAbove = null
    
    if (mainData.projected.length > 1) {
        // highlights predictive data  
        graphSVG.append("rect")
            .attr("class", "tooltip-prediction-highlighter")
            .attr("x", xScalePrediction.range()[0])
            .attr("y", ttpMargins.top)
            .attr("width", xScalePrediction.range()[1] - xScalePrediction.range()[0])
            .attr("height", ttpHeight - ttpMargins.bottom - ttpMargins.top)
        
            // draw predictive line chart
        var predictiveGroup = graphSVG.append("g")
        predictiveGroup.append("path")
            .attr("d", d3.area()
                        .x((_, i) => xScalePrediction(predictionDates[i]))
                        .y0(yScale(0))
                        .y1((d) => yScale(d))
                        .defined(d => d !== null)
                        .curve(d3.curveMonotoneX)(mainData.projected)
            )
            // ttpAreaFunction(predictionData, predictionDates, xScalePrediction, yScale))
            .attr("fill", dataVariableColorMap[`${mainDataVar}-projected`])

        // marks each datapoint on prediction line
        predictiveGroup.selectAll("circle").data(mainData.projected)
            .enter()
            .append("circle")
            .attr("r", 3)
            .attr("cx", (_, i) =>  xScalePrediction(predictionDates[i]))
            .attr("cy", (d) => yScale(d))
            .style("opacity", (d) => {return d === null ? 0 : 1})
            .attr("stroke", dataVariableColorMap[`${mainDataVar}-projected`])

        // place line separating historical and prediction data
        ttpSVG.select(".tooltip-prediction-separator")
            .attr("x1", xScalePrediction.range()[0])
            .attr("y1", ttpMargins.top)
            .attr("x2", xScalePrediction.range()[0])
            .attr("y2", ttpHeight - ttpMargins.bottom)

        stateCurrentLabelPositionAbove = mainData.projected[0] > mainData.projected[1]
    }

    // TODO draw extra data sources/vars 

    // draw legend
    var ttpLegendTop = ttpHeight - 1*em
    Array(mainDataVar, `${mainDataVar}-projected`).forEach(function(dataVar, i) {
        var labelGroup = ttpLegend.append("g")
            .attr("class", "tooltip-label-group")
        labelGroup.append("rect")
            .attr("x", 0)
            .attr("y", 0)
            .attr("height", .5*em)
            .attr("width", .5*em)
            .attr("fill", dataVariableColorMap[dataVar])
        var labelText = labelGroup.append("text")
            .attr("class", "tooltip-label")
            .attr("x", 1*em)
            .attr("y", .25*em)
            .attr("fill", dataVariableColorMap[dataVar])
            .attr("font-size", "var(--sl-font-size-small)")
            .style("dominant-baseline", "middle")
            .text(i == 1 ? `${dataVarString} Projected` : dataVarString)

        var bbox = labelGroup.node().getBBox()
        labelGroup.attr("transform", `translate(${1*em + ((ttpWidth-2*em)*(i+1)/3) - bbox.width/2}, ${ttpLegendTop})`)

    })
    
    // display x-axis on the bottom
    xAxisHistorical // historical
        .attr("transform", `translate(0,${ttpHeight - ttpMargins.bottom})`)
        .call(d3.axisBottom(xScaleHistorical)
            .tickSize(4)
            .tickFormat((d, i) => xScaleHistorical.range()[1] - xScaleHistorical(d) > 2*em ? d3.timeFormat("%b %Y")(d) : ""))
        .selectAll("text") 
        .attr("class", "tooltip-label")
        .style("text-anchor", "end")
        .attr("fill", "var(--sl-color-neutral-1000)")
        .attr("transform", "rotate(-40)");
    xAxisHistorical.selectAll("path, line")
        .attr("stroke", "var(--sl-color-neutral-1000)")

    xAxisPrediction //prediction
        .attr("transform", `translate(0,${ttpHeight - ttpMargins.bottom})`)
        .call(d3.axisBottom(xScalePrediction).tickValues(predictionDates).tickSize(4).tickFormat(d3.timeFormat("%d %b")))
        .selectAll("text")  
        .attr("class", "tooltip-label")
        .style("text-anchor", "end")
        .attr("fill", "var(--sl-color-neutral-1000)")
        .attr("transform", "rotate(-40)");
    xAxisPrediction.selectAll("path, line")
        .attr("stroke", "var(--sl-color-neutral-1000)")

    // display y-axis on the left
    yAxis.append("text")
        .attr("transform", `translate(${1.5*em},${yScale(d3.mean(yScale.domain()))})rotate(-90)`)
        .attr("text-anchor", "middle")
        .attr("fill", "var(--sl-color-neutral-1000)")
        .attr("font-size", "var(--sl-font-size-small)")
        .text(dataVarString)

    yAxis.append("g")
        .attr("transform", `translate(${ttpMargins.left},0)`)
        .call(d3.axisLeft(yScale).ticks(5).tickSize(4))
        .selectAll("text")
        .attr("class", "tooltip-label")
        .attr("fill", "var(--sl-color-neutral-1000)")
    yAxis.selectAll("path, line")
        .attr("stroke", "var(--sl-color-neutral-1000)")

    temp.remove()

}

var ttpLineFunction = function(data, dates, xScale, yScale) {
    var thisStartDate = parseDate(data["start-date"])
    var startIndex = dates.findIndex((d) => d.getTime() == thisStartDate.getTime())

    return d3.line()
        .x((_, i) => xScale(dates[i+startIndex]))
        .y((d, i) => yScale(d))
        .curve(d3.curveMonotoneX)(data.data)
}

var ttpAreaFunction = function(data, dates, xScale, yScale) {
    var thisStartDate = parseDate(data["start-date"])
    var startIndex = dates.findIndex((d) => d.getTime() == thisStartDate.getTime())
    var y0 = yScale(0)

    return d3.area()
        .x((_, i) => xScale(dates[i+startIndex]))
        .y0(y0)
        .y1((d, i) => yScale(d))
        .curve(d3.curveMonotoneX)(data.data)
}
