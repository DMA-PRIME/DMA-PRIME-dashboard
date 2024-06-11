

// dom objects
    // containing divs
var mapResizer = document.getElementById("map-resizer")
    // options
var resetButton = document.getElementById("reset-button")
var diseaseToggle = document.getElementById("show-diseases")
var hospitalToggle = document.getElementById("show-hospitals")
    // map
var jsmapSVG = document.getElementById("map-svg")
var mapSVG = d3.select("#map-svg")
var countiesGroup = d3.select("#counties")

var parser = new DOMParser()
var tooltip = null

// visualization variabls
margins = {
    top: 10,
    right: 10,
    bottom: 10,
    left: 10
}

var mapProjection = null
var mapData = null

// other functions
function fixHospitalName(name) {
    newName = name.toLowerCase().split(" ").join('-')
    newName = newName.replace(/\//g, '')
    newName = newName.replace(/'/g, '')
    return newName
}

function toolTipCreator(element, event) {
    fetch("/tooltip/duck").then((response) => {
        if(!response.ok) {
            throw new Error("HTTP error" + response.status)
        }
        return response.text()
    }).then((data) => {
        tooltip = document.createElement("div")
        tooltip.id = "tooltip"
        tooltip.classList.add("tooltip")
        tooltip.style.position = "absolute"
        tooltip.style.top = (event.pageY + 10) + "px"
        tooltip.style.left = (event.pageX + 15) + "px"
        tooltip.innerHTML = element.id
   
        mapResizer.parentNode.append(tooltip)
        element.addEventListener("mousemove", function(e) {
            tooltip.style.top = (e.pageY + 10) + "px"
            tooltip.style.left = (e.pageX + 15) +"px"
        })
        element.addEventListener("mouseleave", function(e) {
            trash = document.getElementsByClassName("tooltip")
            for(i = 0; i < trash.length; i++) {
                trash[i].remove()
            }
            // console.log("leave")
        })
    }).catch((err) => {
        console.log(err)
    })
}