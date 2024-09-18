gridSort.addEventListener("sl-change", (event) => {
    sortGrid()
})

gridRateSwitch.addEventListener("sl-change", (event) => {
    // when population aggregation switch is changed, update the visualization
    // displayGridAggregateChart()

  d3.select(gridContainer).selectAll("sl-tooltip[open]")
        .each(function(d, i) {
            console.log(d3.select(this.parentNode).datum().zcta)
            slTTP = d3.select(this)
            gridTooltipWidth = Math.max(500, width * .3)
            gridTooltipHeight = gridTooltipWidth * .65
            drawTooltip(d3.select(this.parentNode).datum(), slTTP.select("div[slot='content']"), gridTooltipHeight, gridTooltipWidth, gridRateSwitch.value == "rate")

        })
    updateGridData()
})

gridDataSourceSortSelector.addEventListener("sl-change", (event) => {
    updateGridData()    
})

gridTextFilter.addEventListener("sl-input", function(event) {
    diseaseData = zctaData[gridDiseaseSelector.value]

    matchingGridItems = diseaseData.filter(function(d) {
        countyMatch = d.county.toLowerCase().includes(gridTextFilter.value.toLowerCase())
        zctaMatch = d.zcta.toString().toLowerCase().includes(gridTextFilter.value.toLowerCase())
        return countyMatch || zctaMatch
    })

    objs = d3.select(gridContainer).selectAll("div.grid-container")
        .data(matchingGridItems, function(d) {
            return d.zcta
        })
    objs.style("display", "initial")
    objs.exit()
        .style("display", "none")
})

function setGridTooltip(gridTooltip) {
    gridTooltip.on("sl-show", function(event) {        
        gridTooltipWidth = Math.max(500, width * .3)
        gridTooltipHeight = gridTooltipWidth * .65

        slTTPDOM = event.target
        slTTP = d3.select(slTTPDOM)
            .style("--max-width", gridTooltipWidth*1.2)
        thisGridContainer = d3.select(slTTPDOM.parentNode)

        drawTooltip(thisGridContainer.datum(), slTTP.select("div[slot='content']"), gridTooltipHeight, gridTooltipWidth, gridRateSwitch.value == "rate")
    })
    
}