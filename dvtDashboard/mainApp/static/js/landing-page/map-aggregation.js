
async function displayAggregateChart() {

    jsmapAggregationSvg.innerHTML = ""

    d3.json("/get-hospital-zcta-aggregation", { // hospital zcta data
        "method": "POST",
        "headers": {"Content-Type": "application/json"},
        "body": JSON.stringify({
            "aggregate": mapAggregationSwitch.value ? mapAggregationSwitch.value == "aggregated" : false,
    })}).then((result) => {

        data = result.data
        stats = result.stats
        maxCount = stats.max
        dateMin = stats["date-min"]
        dateMax = stats["date-max"]
        if (mapAggregationSwitch.value != "aggregated") {
            maxCount = d3.max(Object.entries(stats.max), (entry) => {
                return getVisibleHospitalDiseases().includes(entry[0]) ? entry[1] : NaN
            })
            dateMin = d3.min(Object.entries(stats['date-min']), (entry) => {
                return getVisibleHospitalDiseases().includes(entry[0]) ? entry[1] : NaN
            })
            dateMax = d3.max(Object.entries(stats['date-max']), (entry) => {
                return getVisibleHospitalDiseases().includes(entry[0]) ? entry[1] : NaN
            })
        }

        dateMin = dayjs.tz(dateMin, "YYYY-MM", "America/New_York").toDate()
        dateMax = dayjs.tz(dateMax, "YYYY-MM", "America/New_York").toDate()

        aggregateWidth = jsmapAggregationSvg.width.baseVal.value
        aggregateHeight = jsmapAggregationSvg.height.baseVal.value

        // add title
        mapAggregationSvg.append("foreignObject")
            .attr("x", 0)
            .attr("y", 0)
            .attr("width", "100%")
            .attr("height", em)
            .append("xhtml:p")
            .attr("id", "map-aggregation-graph-title")
            .attr("xmlns", "http://www.w3.org/1999/xhtml")
            .attr("align", "center")
            .html(`${mapAggregationSwitch.value == "aggregated" ? "Aggregated" : ""} Disease Count Over Time`)

        // add y axis
        yScale = d3.scaleLinear()
                    .domain([0, maxCount]).range([aggregateHeight - 2*em, margins.bottom + em])    
                    .nice()

        mapAggregationSvg.append("g")
            .attr("transform", `translate(${margins.left + 2*em},0)`)
            .call(d3.axisLeft(yScale).ticks(5).tickSize(0))

        // add x axis
        xScale = d3.scaleUtc()
                    .domain([dateMin, dateMax]).range([margins.left + 2*em, aggregateWidth - margins.right*2])    
                    .nice()

        mapAggregationSvg.append("g")
            .attr("transform", `translate(0, ${aggregateHeight - 2*em})`)
            .call(d3.axisBottom(xScale)) 

        // add graph
        line = d3.line()
            .x((d) => xScale(dayjs.tz(d.date, "YYYY-MM", "America/New_York").toDate()))
            .y((d) => yScale(d.count))
        
        aggregateChart = mapAggregationSvg.append("g")

        if (mapAggregationSwitch.value != "aggregated") {
            Object.entries(data).forEach((entry) => {
                if(getVisibleHospitalDiseases().includes(entry[0])){
                    aggregateChart.append("path")
                        .attr("id", "map-aggregate-chart-"+entry[0])
                        .attr("d", line(entry[1]))
                        .attr("stroke", diseaseColorMap(entry[0]))
                        .attr("fill", "none")
                        .attr("stroke-width", 2)
                }
            })
            
        } else {
            aggregateChart.append("path")
            .attr("id", "map-aggregate-chart")
            .attr("d", line(data))
            .attr("stroke", "saddlebrown")
            .attr("fill", "none")
            .attr("stroke-width", 2)
        }
        

        // aggregateChart.selectAll("circle")
        //       .data(data)
        //       .enter()
        //       .append("circle")
        //       .attr("cx", (d) => xScale(dayjs.tz(d.date, "YYYY-MM", "America/New_York").toDate()))
        //       .attr("cy", (d) => yScale(d.count))
        //       .attr("r", 2.5)
        //       .attr("fill", "saddlebrown")

    })
}

async function displayDonut() {
    mapAggregationDonut.node().innerHTML = ""
    data = {
        // "type of bed": [beds full, beds empty]
        "regular": [8, 2],
        "icu": [undefined, undefined]
    }

    height = jsmapAggregationDonutSvg.height.baseVal.value
    width = jsmapAggregationDonutSvg.width.baseVal.value

    radius = (height - margin.top) / 2
    radiusInner = radius * .25
    radiusRange = radius * .75

    const pie = d3.pie()
        .sort(null)

    bedTypes = Object.keys(data).length

    bedsColorMap = d3.scaleOrdinal().domain(Object.keys(data)).range(d3.schemeSet2)

    mapAggregationDonut.append("path")
        .attr("transform", `translate(${radius},${height/2})`)
        .attr("d", d3.arc()({
            innerRadius: radiusInner,
            outerRadius: radius,
            startAngle: 0,
            endAngle: Math.PI * 2
        }))
        .style("fill", "currentColor")

    mapAggregationDonutLegend = mapAggregationDonut.append("g")
        .attr("id", "map-aggregation-donut-legend")
        .attr("transform", `translate(${radius*2+em/2}, ${height/2 - (bedTypes*1.5-.5)*em/2})`)

    Object.entries(data).forEach((entry, index) => {
        const arc = d3.arc()
            .innerRadius(radiusInner + radiusRange * (bedTypes - index - 1)/bedTypes)
            .outerRadius(radiusInner + radiusRange * (bedTypes - index)/bedTypes);

        group = d3.select(`#${entry[0]}-bed-usage-group`).node() ? 
            d3.select(`#${entry[0]}-bed-usage-group`) : 
            mapAggregationDonut.append('g').attr("id", `#${entry[0]}-bed-usage-group`)

        group.attr("transform", `translate(${radius}, ${height/2})`)
        
        mapAggregationDonutLegend.append("rect")
            .attr("id", `${entry[0]}-bed-usage-legend-color`)
            .attr("x", 0)
            .attr("y", index*1.5*em)
            .attr("height", em/2)
            .attr("width", em/2)
            .style("fill", bedsColorMap(entry[0]))

        mapAggregationDonutLegend.append("text")
            .attr("id", `${entry[0]}-bed-usage-legend-text1`)
            .attr("x", em*.75)
            .attr("y", (index*1.5-.0625)*em)
            .style("fill", "currentColor")
            .style("dominant-baseline", "middle")
            .style("font-size", em*.75 + "px")
            .text(`${entry[0]} bed utilizaiton:`)

        mapAggregationDonutLegend.append("text")
            .attr("id", `${entry[0]}-bed-usage-legend-text2`)
            .attr("x", em*.75)
            .attr("y", (index*1.5+.75)*em)
            .style("fill", "currentColor")
            .style("dominant-baseline", "middle")
            .style("font-size", em*.75 + "px")

        if (entry[1].includes(undefined)) {
            group.selectAll("path")
                .data(pie([1, 1]))
                .enter()
                .append("path")
                .attr("mask", "url(#nan-pattern-mask)")
                .attr("fill", bedsColorMap(entry[0]))
                .attr("d", arc)

            mapAggregationDonutLegend.select(`#${entry[0]}-bed-usage-legend-text2`)
                .text(`unknown`)
        } else {
            group.selectAll("path")
                .data(pie(entry[1]))
                .enter()
                .append("path")
                .attr("fill", (d, i) => i ? "currentColor" : bedsColorMap(entry[0]) )
                .attr("d", arc)

            mapAggregationDonutLegend.select(`#${entry[0]}-bed-usage-legend-text2`)
                .text(`${d3.format(".0%")(entry[1][0]/(entry[1][0]+entry[1][1]))}`)
                
        }

    })
}
