// I want the svg to exist in the html file

var svg = d3.select("#main-vis"),
    width = +svg.attr("width"),
    height = +svg.attr("height");

// var projection = d3.geoMercator()
//     // .scale(width / 1.3 / Math.PI)
//     .translate([width / 2, height / 2])

// // var projection = d3.geoOrthographic() //other types geoOrthographic() //geoMercator()

// // .fitWidth(size, {type: "Sphere"}) //sphere to flat surface using geo equal earth

// var pathGenerator = d3.geoPath(projection) //does all the magic (aka math) to go from coords to 2d website

// d3.json("../../../sandbox/d3 maps/map.json").then(function(mapdata){
// // d3.json("static/data/county_sub.json").then(function(mapdata){
//     console.log(mapdata)
//     console.log(mapdata.features)
//     svg.append("g")
//         .selectAll("path")
//         .data(mapdata.features)
//         .join("path")
//         // .enter().append("path")
//                 .attr("fill", "#69b3a2")
//                 .attr("d", pathGenerator)
//                 .style("stroke", "#fff")
// })

d3.json("static/data/county_sub.json").then(function(mapdata){

    console.log(d3.geoBounds(mapdata))

    //starting by creating an easier way to access my data by country

    var size = 400
    var dimensions = ({
        width: size, 
        height: size/2,
        margin: {
         top: 10,
         right: 10,
         bottom: 10,
         left: 10
        }
       })


    // var svg = d3.select("svg").attr("width", dimensions.width)
                            // .attr("height", dimensions.height)

    var projection = d3.geoAlbers() //geoOrthographic() //geoMercator()
                        .fitExtent([[0,0],[400,300]], mapdata)

    var pathGenerator = d3.geoPath(projection)

    // var color = d3.scaleLinear()
    //     .domain([d3.min(Object.values(countryPop)),0,d3.max(Object.values(countryPop))])
    //     .range(["red", "white","blue"])


    var countries = svg.append("g")
                    .selectAll(".country")
                    .data(mapdata.features)
                    .enter()
                    .append("path")
                    .attr("class", "country")
                    .attr("d", d => pathGenerator(d))
                    .style("fill", "#999")
                    // .style("fill", d => { console.log(d.properties.SOV_A3); return color(countryPop[d.properties.SOV_A3])})
                    
    
})
