

// nav bar interaction functionality
{
navBar.addEventListener("sl-tab-show", (tabName) => {
    mapType = tabName.detail.name 
    selector.value = "none"
    displayMap(mapType)
})
}

// options interaction functionality
{
selector.addEventListener("sl-change", () => {
    visType = selector.value
    switch(visType) {
        case "none":
            clearVisualization()
            break;
        case "aggregated":
            aggregatedVisualization()
            break;
    }
})
}

// options visual functionality
{
optionsHider.addEventListener("click", () => {
    optionsOpen = !optionsOpen;

    if (optionsOpen) {
        optionsHider.name = "chevron-compact-left"
        mainContent.position = optionsPosition
    } else {
        optionsPosition = mainContent.position
        mainContent.position = 0
        optionsHider.name = "chevron-compact-right"
    }
});

mainContent.addEventListener("sl-reposition", () => {
    if (mainContent.position > 0) {
        optionsOpen = true;
        optionsHider.name = "chevron-compact-left"
    } else {
        optionsOpen = false;
        optionsHider.name = "chevron-compact-right"
    }
});
}

// main visualization visual functionality
{
mainVisResizer.addEventListener("sl-resize", () => {
    resizeMap(mapType)
})

function determineMap(mapType) {
    switch (mapType) {
        case "zip": 
            return "../static/data/tl_2023_sc_zcta.json";
        case "block":
            return "../static/data/tl_2023_sc_block.json";
        default: 
        case "county":
            return "../static/data/tl_2023_sc_county.json";
    }
}
}