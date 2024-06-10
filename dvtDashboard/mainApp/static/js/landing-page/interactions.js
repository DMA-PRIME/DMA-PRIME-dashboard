
mapZoom = d3.zoom().on("zoom", function(e) {
    
    zoom = e.transform.k
    xSkew = e.transform.x
    ySkew = e.transform.y
    console.log(d3.select("#hospitals").node())

    // centering = (scale-1) * 0.5 * dimension(height or width)

    d3.select("#counties").attr('transform', e.transform)
    // d3.select("#hospitals").attr('transform', thingy)

    d3.selectAll(".hospital").attr('transform', function(d){
        function blerp(zoom, dimension, location, skew) {
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

