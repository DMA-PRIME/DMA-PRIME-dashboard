jsmapSVG = document.getElementById("map")
mapSVG = d3.select("#map")
mapProjection = null
bivariateColormap = null
margins = {
    top: 10,
    right: 10,
    bottom: 10,
    left: 10
}
f = d3.format(".0f")

var width = jsmapSVG.width.baseVal.value
var height = jsmapSVG.height.baseVal.value

d3.json("../../static/data/zcta_.0001.json").then(function(mapdata) {
    mapData = mapdata
    mapProjection = d3.geoAlbers().fitExtent(
        [[margins.left, margins.top], [width-margins.right,height-margins.bottom]],
        mapdata)
    pathGenerator = d3.geoPath(mapProjection)

    counties = mapSVG.append("g")
            .attr("id", "zctas")
            // .style("pointer-events", "none")
    counties.selectAll("path")
          .data(mapdata.features)
          .enter()
          .append("path")
          .attr("class", "zcta")
          .attr("id", d => '_'+fixName(d.properties.ZCTA5CE20))
          .attr("d", d => pathGenerator(d))
          .attr("fill", "var(--sl-color-gray-300)")

})

// helper functions
function fixName(name) {
    newName = name.toLowerCase().split(" ").join("-")
    newName = newName.replace(/[\/']/g, "")
    return newName
}