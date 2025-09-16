
function changeModel() {
    if (modelLocation) {
        modelExploration.src = `/data/respiratory/model/${explorationDiseaseSelector.value}/${explorationRegionSelector.value}/${explorationPopulationSelector.value}/${explorationOutcomeVariableSelector.value}/${modelLocation}`
    } else {
        modelExploration.src = ''
    }
}

// explorationDiseaseSelector.addEventListener("sl-change", (event) => {
    
// })

locationMenu.addEventListener("sl-select", event => {
    var selectedLocation = event.detail.item;

    modelLocation = selectedLocation.value

    locationIdSearch.value = d3.select(`sl-menu-item[value='${modelLocation}'`).node().getTextLabel()
    changeModel()
})

// filter menu items
locationIdSearch.addEventListener("sl-input", event => {
    d3.selectAll("sl-menu-item.location-id").each(function() {
        let menuItem = d3.select(this)
        let incorrectGeographicUnit = !menuItem.classed(`${explorationRegionSelector.value}-id`)
        let filteredOut = !d3.select(this).attr("value").toLowerCase().includes(locationIdSearch.value.toLowerCase())
        menuItem.classed("hide", incorrectGeographicUnit || filteredOut)
  })
})

locationIdSearch.addEventListener("sl-change", event => {
    var exactMatch = d3.selectAll("sl-menu-item.location-id").nodes().some(e => e.value == locationIdSearch.value)
    if (exactMatch) {
        modelLocation = locationIdSearch.value
        locationIdSearch.value = d3.select(`sl-menu-item[value='${modelLocation}'`).node().getTextLabel()
        d3.selectAll("sl-menu-item.location-id").each(function() {
            let menuItem = d3.select(this)
            menuItem.classed("hide", !menuItem.classed(`${explorationRegionSelector.value}-id`))
        })
    } else {
        modelLocation = null
    }
    changeModel()
})

locationIdSearch.addEventListener("clear", event => {
    modelLocation = null
    changeModel()
})

// swap menu items when geographic unit changed
explorationRegionSelector.addEventListener("sl-change", event => {
    d3.selectAll("sl-menu-item.location-id").each(function() {
        let menuItem = d3.select(this)
        menuItem.classed("hide", !menuItem.classed(`${explorationRegionSelector.value}-id`))
    })

    modelLocation = null
    locationIdSearch.value = ""
   
    changeModel()
})

explorationDiseaseSelector.addEventListener("sl-change", event => {
    changeModel()
})

explorationPopulationSelector.addEventListener("sl-change", event => {
    changeModel()
})

explorationOutcomeVariableSelector.addEventListener("sl-change", event => {
    changeModel()
})
