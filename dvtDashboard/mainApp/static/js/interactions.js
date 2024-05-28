var menuHider = document.getElementById("hideMenuButton")
var mainContentDivider = document.getElementById("mainContentDivider")
var mainContent = document.getElementById("mainContent")

var menuPosition = mainContent.position

let options_open = true;
menuHider.addEventListener("click", () => {
    options_open = !options_open;

    if (options_open) {
        menuHider.name = "chevron-compact-left"
        mainContent.position = menuPosition
    } else {
        menuPosition = mainContent.position
        mainContent.position = 0
        menuHider.name = "chevron-compact-right"
    }
});

mainContent.addEventListener("sl-reposition", () => {
    if (mainContent.position > 0) {
        options_open = true;
        menuHider.name = "chevron-compact-left"
    } else {
        options_open = false;
        menuHider.name = "chevron-compact-right"
    }
    determineMap(mapType)
});

var navBar = document.getElementById("navBar")
var mapType = "county"

navBar.addEventListener("sl-tab-show", (tabName) => {
    mapType = tabName.detail.name 
    determineMap(mapType)
})


window.addEventListener("resize", () => {
    determineMap(mapType)
})

function determineMap(mapType) {
    switch (mapType) {
        case "zip": 
            displayMap("../static/data/tl_2023_sc_zcta.json");
            break;
        case "block":
        displayMap("../static/data/tl_2023_sc_block.json");
            break;
        default: 
        case "county":
            displayMap("../static/data/tl_2023_sc_county.json");
            break;
    }
}