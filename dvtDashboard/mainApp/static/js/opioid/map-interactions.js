
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


mapYearSelector.addEventListener("sl-change", function(event) {
    dataVersion++
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