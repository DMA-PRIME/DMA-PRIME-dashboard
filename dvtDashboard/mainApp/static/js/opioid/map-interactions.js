
mapResetButton.addEventListener("click", () => {
    deckgl.setProps({
        initialViewState: {
            longitude: -80.75,
            latitude: 33.8,
            zoom: 7,
            transitionInterpolator: new FlyToInterpolator({speed: 2}),
            transitionDuration: 'auto'
          },
    })
    
})

mapFilterResetButton.addEventListener("click", () => {
    Object.entries(brushes).forEach(brush => {
        column = brush[0]
        d3.select(`#map-${column}-filter-brush`).call(brush[1].clear)
        thresholds[column] = xScales[column].domain()
    })
})

mapYearSelector.addEventListener("sl-change", function(event) {
    dataVersion++
    updateHistogram("hospitalizations")
    updateHistogram("deaths")
    redraw()
})

mapVariable1Selector.addEventListener("sl-change", function(event) {
    dataVersion++
    redraw()
})

mapVariable2Selector.addEventListener("sl-change", function(event) {
    dataVersion++
    redraw()
})