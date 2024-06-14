
mapZoom = d3.zoom().on("zoom", function(e) {
    
    zoom = e.transform.k
    xSkew = e.transform.x
    ySkew = e.transform.y

    d3.select("#counties").attr('transform', e.transform)
    d3.select("#covid-data").attr('transform', e.transform)

    d3.selectAll(".hospital").attr('transform', function(d){
        function blerp(zoom, dimension, location, skew) {
            // if you don't want to scale after translation and only move via translation, use the formula:
            // (scale - 1) * ({x or y} position + {width or height}*.5) + {x or y translation}
            return ((zoom-1) * (location.baseVal.value + (dimension.baseVal.value * .5))) + skew
        }
        return d3.zoomIdentity.translate(blerp(zoom, this.width, this.x, xSkew), blerp(zoom, this.height, this.y, ySkew))
    })
})
mapSVG.call(mapZoom)

mapResizer.addEventListener("sl-resize", () => {
    resizeMap()
})

resetButton.addEventListener("click", () => {
    mapSVG.call(mapZoom.transform, d3.zoomIdentity.translate(0, 0).scale(1))
})

hospitalToggle.addEventListener("sl-change", () => {
    if(hospitalToggle.checked) {
        d3.select("#hospitals").raise().style("opacity", 1)
    } else {
        d3.select("#hospitals").lower().style("opacity", 0)
    }
})

