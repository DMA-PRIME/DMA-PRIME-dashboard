// I want the svg to exist in the html file

var svg = d3.select("#mainVis");
var js_svg = document.getElementById("mainVis")

function displayMap(mapJSON) {
    js_svg.innerHTML = ""
    d3.json(mapJSON).then(function(mapdata){
        // d3.json("static/data/tl_2023_sc_zcta.json").then(function(mapdata){
            
            var dimensions = ({
                width: width, 
                height: height,
                margin: {
                 top: 10,
                 right: 10,
                 bottom: 10,
                 left: 10
                }
               })
        
            var width = js_svg.width.baseVal.value
            var height = js_svg.height.baseVal.value
        
            var projection = d3.geoAlbers() //geoOrthographic() //geoMercator()
                                // .scale(14490.050394227457)
                                // .translate([-2541.520291685157, -655.8449762125149 ])
                                // .scale(8763.186773434889)
                                // .translate([ -1632.8583228988787, -238.08720204069493 ])
                                .fitExtent([[dimensions.margin.left,dimensions.margin.top],[width-dimensions.margin.right,height-dimensions.margin.bottom]], mapdata)
        
            var pathGenerator = d3.geoPath(projection)
        
            var countries = svg.append("g")
                            .selectAll(".country")
                            .data(mapdata.features)
                            .enter()
                            .append("path")
                            .attr("class", "country")
                            .attr("d", d => pathGenerator(d))
                            .style("fill", "#999")            
    })
}


