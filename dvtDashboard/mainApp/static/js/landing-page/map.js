
function displayMap() {
    var width = jsmapSVG.width.baseVal.value
    var height = jsmapSVG.height.baseVal.value
    
    d3.json("../../static/data/tl_2023_sc_county.json").then(function(mapdata) {
        mapData = mapdata
        mapProjection = d3.geoAlbers().fitExtent(
            [[margins.left, margins.top], [width-margins.right,height-margins.bottom]],
            mapdata)
        var pathGenerator = d3.geoPath(mapProjection)

        counties = mapSVG.append("g")
              .attr("id", "counties")
        counties.selectAll("path")
              .data(mapdata.features)
              .enter()
              .append("path")
              .attr("class", "county")
              .attr("id", d => fixName(d.properties.NAME))
              .attr("d", d => pathGenerator(d))
              .style("fill", "var(--sl-color-gray-400)")
                .on("mouseenter", function(e) {
                    toolTipCreator(this, e)
                })

        hospitals = mapSVG.append("g")
              .attr("id", "hospitals")
    }).then(() => {
        d3.json("../../static/data/Hospitals.geojson").then(function(hospdata){
              hospitals.selectAll("svg")
              .data(hospdata.features)
              .enter()
              .append("svg")
              .attr("class", "hospital")
              .attr("id", d => fixName(d.properties.webdbINFOHEALTHFACILITYLF_NAME))
              .attr("width", Math.max(25, Math.min(width, height) * 0.02))
              .attr("height", Math.max(25, Math.min(width, height) * 0.02))
              .attr("x", (d) => mapProjection(d.geometry.coordinates)[0])
              .attr("y", (d) => mapProjection(d.geometry.coordinates)[1])
              .attr("viewBox", "0 0 16 16")
              .each(function(d) {
                fetch("/hospital/"+fixName(d.properties.webdbINFOHEALTHFACILITYLF_NAME))
                    .then((response) => {
                        if (!response.ok) {
                            throw new Error("HTTP error " + response.status)
                        }
                        return response.text()
                    }).then((data) => {
                        this.innerHTML = data
                    })
                    .catch((err) => {
                        console.log(err);
                    });
              })
        })

        diseaseData = mapSVG.append("g")
            .attr("id", "disease-data")
        
        d3.json("/get-real-disease-data", { // covid county data
            "method": "POST",
            "headers": {"Content-Type": "application/json"},
            "body": JSON.stringify({
                'region-size': 'county',
                'region-name': 'all',
                'disease': 'all',
                'date': 'max',
                'data-type': 'cases 7-day averange',
            })}).then((result) => {
                data = JSON.parse(result.data)
                data = Object.keys(data).map((key) => [key, data[key]])
                data = data.map(function(item) {
                    attributes = formatTuple(item[0])
                    attributes[0] = fixName(attributes[0])
                    return [attributes, item[1]]
                })
                stats = JSON.parse(result.stats)
                metadata = JSON.parse(result.metadata)

                maxRadius = Math.min(height, width) * 0.05
                radius_map = d3.scaleLinear([stats.min, stats.max], [0, maxRadius])
                disease_color_map = d3.scaleOrdinal().domain(metadata.disease).range(d3.schemeSet1)

                covidData = diseaseData.append("g")
                .attr("id", "covid-19-data")

                covidData.selectAll("circle")
                    .data(data)
                    .enter()
                    .append("circle")
                    .attr("class", (d) => "disease-bubble " + d[0].join(" "))
                    .attr("cx", (d) => getCenterPos(d[0][0]).x - radius_map(d[1])/2)
                    .attr("cy", (d) => getCenterPos(d[0][0]).y - radius_map(d[1])/2)
                    .attr("r", (d) => radius_map(d[1]))
                    .style("fill", d => disease_color_map(d[0][1]))
                    .style("fill-opacity", .25)
                    .style("stroke", d => disease_color_map(d[0][1]))
                    .style("stroke-width", 3)
                    .style("stroke-opacity", .3)

            }).catch((err) => {console.log(err)})
        
    })
}

function resizeMap() {
    var width = jsmapSVG.width.baseVal.value
    var height = jsmapSVG.height.baseVal.value
    mapProjection = d3.geoAlbers().fitExtent(
        [[margins.left, margins.top], [width-margins.right,height-margins.bottom]],
        mapData)
    var pathGenerator = d3.geoPath(mapProjection)

    d3.selectAll(".county").each(function(item) {
        d3.select(this)
        .attr("d", (d) => pathGenerator(d))
    })

    d3.selectAll(".hospital").each(function(item) {
        size = Math.max(25, Math.min(width, height) * 0.035)
        d3.select(this)
            .attr("width", size)
            .attr("height", size)
            .attr("x", (d) => mapProjection(d.geometry.coordinates)[0] - size/2)
            .attr("y", (d) => mapProjection(d.geometry.coordinates)[1] - size/2)
    })

    d3.selectAll(".disease-bubble").each(function(d) {
        maxRadius = Math.min(height, width) * 0.03
        radius_map = d3.scaleLinear([stats.min, stats.max], [0, maxRadius])
        d3.select(this)
            .attr("cx", (d) => getCenterPos(d[0][0]).x - radius_map(d[1])/2)
            .attr("cy", (d) => getCenterPos(d[0][0]).y - radius_map(d[1])/2)
            .attr("r", (d) => radius_map(d[1]))
            
    })
}