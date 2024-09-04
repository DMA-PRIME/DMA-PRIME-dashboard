
mapRateSwitch.addEventListener("sl-change", (event) => {
    updateMapData()
})

mapDataSourceSelector.addEventListener("sl-change", (event) => {
    updateMapData()
})

mapDiseaseSelector.addEventListener("sl-change", (event) => {
    updateMapData()
})

hospitalIconsToggle.addEventListener("sl-change", () => {
    // toggle hospital icons
    mapSVG.select("#map-hospitals").style("display", hospitalIconsToggle.checked ? "initial" : "none")
})

resetButton.addEventListener("click", () => {
    // reset map's zoom and pan
    focusCounty = null
    mapUnzoom()
    mapClearCountyHighlight()
})

// allow zoom and panning of map
zoomer = d3.zoom().scaleExtent([1, 10])
mapZoom = zoomer.on("zoom", function(e) {
    zoom = e.transform.k
    xSkew = e.transform.x
    ySkew = e.transform.y

    mapSVG.select("#map-counties").attr("transform", e.transform)
    mapSVG.select("#map-zctas").attr("transform", e.transform)
    mapSVG.select("#map-color-legend").attr("transform", d3.zoomIdentity)

    hospSize = Math.max(16, Math.min(width, height) * 0.015)
    mapSVG.select("#map-hospitals").selectAll(".hospital").each(function(d) {
        coords = mapProjection(d.geometry.coordinates)
        d3.select(this)
            .attr("x", coords[0]*zoom + xSkew - hospSize/2)
            .attr("y", coords[1]*zoom + ySkew - hospSize/2)
    }) 
})
mapSVG.call(mapZoom)

function mapUnzoom() {
    mapSVG.transition().duration(750).call(mapZoom.transform, d3.zoomIdentity.translate(0, 0).scale(1))
}

function mapHighlightCounty(county) {

    // zoom and pan to focus on county
    countyData = county.datum()
    center = mapProjection([countyData.properties.INTPTLON, countyData.properties.INTPTLAT])        
    dims = county.node().getBBox()

    countyWidth = dims.width
    countyHeight = dims.height
    scale = Math.min(4, Math.min(width/countyWidth, height/countyHeight)-1.25)

    mapSVG.transition().duration(750).call(zoomer.transform, new d3.ZoomTransform(scale, width/2 - center[0]*scale, height/2 - center[1]*scale))

    // highlight  county (grey out other counties and zctas in those counties)
    mapSVG.selectAll(".map-county").transition().duration(750).style("fill-opacity", .5)
    county.transition().duration(750).style("fill-opacity", .0)
}

function mapClearCountyHighlight() {
    mapSVG.selectAll(".map-county").transition().duration(750).style("fill-opacity", 0)
}

function setZctaInteractions(zcta) {
    // click
    zcta.on("click", function(event) {
        mapClearCountyHighlight()

        countyName = zcta.attr("county")
        county = d3.select("#map-"+countyName)

        if (focusCounty == countyName) {
            resetButton.click()
            d3.select(mapTooltip)
                .style("display", "none")
                .style("z-index", -1)
        } else {
            focusCounty = countyName
            mapHighlightCounty(county)
        }
    })
    // exit
    // hover
    // enter
}