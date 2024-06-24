
mapZoom = d3.zoom().scaleExtent([1, 10]).on("zoom", function(e) {

    zoom = e.transform.k
    xSkew = e.transform.x
    ySkew = e.transform.y

    d3.select("#counties").attr('transform', e.transform)
    d3.select("#disease-data").attr('transform', e.transform)
    d3.select("#hospital-data").attr('transform', e.transform)
    d3.select("#hospitals").attr('transform', e.transform)
    d3.selectAll(".legend").attr('transform', d3.zoomIdentity.scale(zoom))

// trying to get the hospitals to semantically zoom... works on firefox (the bottom function)
    // d3.select("#hospitals").attr('transform', e.transform)
    // d3.selectAll(".hospital")
    //     .attr("transform", function(d) {
    //         console.log(xSkew)
    //         console.log(ySkew)
    //         return d3.zoomIdentity.translate((zoom-1) * (this.x.baseVal.value - this.width.baseVal.value), (zoom-1) * this.y.baseVal.value).scale(1/zoom)
    //     })

    // d3.selectAll(".hospital").attr('transform', function(d){
    //     function blerp(zoom, dimension, location, skew) {
    //         // if you don't want to scale after translation and only move via translation, use the formula:
    //         // (scale - 1) * ({x or y} position + {width or height}*.5) + {x or y translation}
    //         // return location.baseVal.value * zoom + skew
    //         return ((zoom-1) * (location.baseVal.value + (dimension.baseVal.value * .5))) + skew
    //     }
    //     return d3.zoomIdentity.translate(blerp(zoom, this.width, this.x, xSkew), blerp(zoom, this.height, this.y, ySkew))
    // })
})
mapSVG.call(mapZoom)

mapResizer.addEventListener("sl-resize", () => {
    resizeMap()
    if (document.body.clientWidth * 20 / 100 < 220) {
        mainContent.setAttribute("position", 220 * 100 / document.body.clientWidth)
    } else {
        mainContent.setAttribute("position", 20)
    }
})

resetButton.addEventListener("click", () => {
    mapSVG.call(mapZoom.transform, d3.zoomIdentity.translate(0, 0).scale(1))
})

diseaseToggle.addEventListener("sl-change", () => {
    if(diseaseToggle.checked) {
        d3.selectAll(".legend.disease").raise().style("opacity", 1)
        d3.select("#disease-data").raise().style("opacity", 1)
        if(hospitalToggle.checked) {
            hospitalToggle.click()
        }
    } else {
        d3.selectAll(".legend.disease").lower().style("opacity", 0)
        d3.select("#disease-data").lower().style("opacity", 0)
    }
})

hospitalToggle.addEventListener("sl-change", () => {
    if(hospitalToggle.checked) {
        d3.selectAll(".legend.hospital").raise().style("opacity", 1)
        d3.selectAll("#hospital-data").raise().style("opacity", 1)
        if(diseaseToggle.checked) {
            diseaseToggle.click()
        }
    } else {
        d3.selectAll(".legend.hospital").lower().style("opacity", 0)
        d3.selectAll("#hospital-data").lower().style("opacity", 0)
    }
})

showHospitalIcons.addEventListener("sl-change", () => {
    if(showHospitalIcons.checked) {
        d3.select("#hospitals").raise().style("opacity", 1)
        d3.selectAll("#disease-data").raise()
        d3.selectAll("#hospital-data").raise()
    } else {
        d3.select("#hospitals").lower().style("opacity", 0)
    }
})

caseDeathSwitch.addEventListener("sl-change", () => {
    drawDiseaseBubbles(caseDeathSwitch.value)
})

function toolTipCreator(element) {
    tooltip = document.getElementById("tooltip")
    element.addEventListener("mouseenter", function(e) {
        tooltip.innerHTML = element.id
        d3.select("#tooltip")
            .style("opacity", 1)})
    element.addEventListener("mousemove", function(e) {
        tooltip.style.top = (e.pageY + 10) + "px"
        tooltip.style.left = (e.pageX + 15) +"px"
    })
    element.addEventListener("mouseleave", function(e) {
        d3.select("#tooltip")
            .style("opacity", 0)
    })
}

function bubbleToolTip(element) {
    tooltip = document.getElementById("tooltip")
    element.on("mouseenter", function(e) {
        tooltip.innerHTML = ''
        data = element.data()[0]
        ttp = d3.select("#tooltip")
        ttp.style("opacity", 1)
        d3.selectAll(`.${element.attr("bubble-type")}-bubble.${data.county}.${data.date}`)
            .each(function(d) {
                console.log(d)
                ttp.append("p")
                .attr("class", "tooltip text")
                .text(`${d.disease}: ${d.count}`)
            })
    })
        
    element.on("mousemove", function(e) {
        tooltip.style.top = (e.pageY + 10) + "px"
        tooltip.style.left = (e.pageX + 15) +"px"
    })
    element.on("mouseleave", function(e) {
        d3.select("#tooltip")
            .style("opacity", 0)
    })
}