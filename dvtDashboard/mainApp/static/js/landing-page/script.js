

// dom objects
    // containing divs
var mapResizer = document.getElementById("map-resizer")
    // options
var resetButton = document.getElementById("reset-button")
var diseaseToggle = document.getElementById("show-diseases")
var diseaseChecks = document.getElementsByClassName("disease-check")
var hospitalToggle = document.getElementById("show-hospitals")
var diseaseSwitchBranch = document.getElementById("disease-switch-branch")
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
var width = jsmapSVG.width.baseVal.value
var height = jsmapSVG.height.baseVal.value

var mapProjection = null
var mapData = null

// other functions
function fixName(name) {
    newName = name.toLowerCase().split(" ").join('-')
    newName = newName.replace(/[\/']/g, '')
    return newName
}

function getCenterPos(id) {
    temp = document.getElementById(id)
    if (temp) {
        tempbbox = temp.getBBox()
        x = tempbbox.x + (tempbbox.height)/2
        y = tempbbox.y + (tempbbox.height)/2
        return {'x': x, 'y': y}
    } else {
        return {'x': 0, 'y': 0}
    }
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
        })
    }).catch((err) => {
        console.log(err)
    })
}

function formatTuple(string) {
    return string.replace(/[(' )]/g, "").split(",")

}


function transform(t) {
    console.log("t",t)
    return function(d) {
        console.log("d",d)
        return "translate(" + t.apply(d) + ")"
    }
}


function makeHospital(id) {
    stringy =  `<clipPath id='clipper-${id}'> \n
        <path id='bgd-${id}' fill='darkgrey' d='M6 0a1 1 0 0 0-1 1v1a1 1 0 0 0-1 1v4H1a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V8a1 1 0 0 0-1-1h-3V3a1 1 0 0 0-1-1V1a1 1 0 0 0-1-1z'/>
    </clipPath>
    <use href='#bgd-${id}'></use>
    <rect id='fill-${id}' y='0%' width='100%' height='100%' clip-path='url(#clipper-${id})' fill='#FFF'/>
    <g id='outline-${id}' >
        <path d='M8.5 5.034v1.1l.953-.55.5.867L9 7l.953.55-.5.866-.953-.55v1.1h-1v-1.1l-.953.55-.5-.866L7 7l-.953-.55.5-.866.953.55v-1.1zM13.25 9a.25.25 0 0 0-.25.25v.5c0 .138.112.25.25.25h.5a.25.25 0 0 0 .25-.25v-.5a.25.25 0 0 0-.25-.25zM13 11.25a.25.25 0 0 1 .25-.25h.5a.25.25 0 0 1 .25.25v.5a.25.25 0 0 1-.25.25h-.5a.25.25 0 0 1-.25-.25zm.25 1.75a.25.25 0 0 0-.25.25v.5c0 .138.112.25.25.25h.5a.25.25 0 0 0 .25-.25v-.5a.25.25 0 0 0-.25-.25zm-11-4a.25.25 0 0 0-.25.25v.5c0 .138.112.25.25.25h.5A.25.25 0 0 0 3 9.75v-.5A.25.25 0 0 0 2.75 9zm0 2a.25.25 0 0 0-.25.25v.5c0 .138.112.25.25.25h.5a.25.25 0 0 0 .25-.25v-.5a.25.25 0 0 0-.25-.25zM2 13.25a.25.25 0 0 1 .25-.25h.5a.25.25 0 0 1 .25.25v.5a.25.25 0 0 1-.25.25h-.5a.25.25 0 0 1-.25-.25z'/>
        <path d='M5 1a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1a1 1 0 0 1 1 1v4h3a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1H1a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1h3V3a1 1 0 0 1 1-1zm2 14h2v-3H7zm3 0h1V3H5v12h1v-3a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1zm0-14H6v1h4zm2 7v7h3V8zm-8 7V8H1v7z'/>
    </g>`
    return stringy
}