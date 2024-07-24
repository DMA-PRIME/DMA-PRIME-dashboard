
function displayAggregateChart() {

    jsmapAggregateSvg.innerHTML = ""

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
        console.log(dateMin, dateMax)
        aggregateWidth = jsmapAggregateSvg.width.baseVal.value
        aggregateHeight = jsmapAggregateSvg.height.baseVal.value

        // add title
        mapAggregateSvg.append("foreignObject")
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

        mapAggregateSvg.append("g")
            .attr("transform", `translate(${margins.left + 2*em},0)`)
            .call(d3.axisLeft(yScale).ticks(5).tickSize(0))

        // add x axis
        xScale = d3.scaleUtc()
                    .domain([dateMin, dateMax]).range([margins.left + 2*em, aggregateWidth - margins.right])    
                    .nice()

        mapAggregateSvg.append("g")
            .attr("transform", `translate(0, ${aggregateHeight - 2*em})`)
            .call(d3.axisBottom(xScale)) 

        // add graph
        line = d3.line()
            .x((d) => xScale(dayjs.tz(d.date, "YYYY-MM", "America/New_York").toDate()))
            .y((d) => yScale(d.count))
        
        aggregateChart = mapAggregateSvg.append("g")

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

function updateAggregateChart() {

}
