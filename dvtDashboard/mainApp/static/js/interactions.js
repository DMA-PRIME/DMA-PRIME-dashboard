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
    
});
