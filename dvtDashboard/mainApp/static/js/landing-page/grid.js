// keep note of div elements
// group data single line graph (1) 
// brush zoom in,  in detailed graph (2)
// change in rate comparision for different counties (done)

// ratio which is the highest over counties use that as maximum scale
// common script file for all the conties loop over county names and csv for each county
//test for toggle button (done)


// button to toggle between total and average cases?
const toggleButton = document.getElementById("toggleButton");
let isToggled = true;
gridPopulationSwitch.addEventListener("sl-change", () => {
    updateCountyGraphs(gridAggregationSwitch.value, gridPopulationSwitch.value)
});

gridAggregationSwitch.addEventListener("sl-change", () => {
    updateCountyGraphs(gridAggregationSwitch.value, gridPopulationSwitch.value)
});

const chosenColumn = 0; // Change this to the column you want to display on the y-axis

countyNames = [
    "abbeville",
    "aiken",
    "allendale",
    "anderson",
    "bamberg",
    "barnwell",
    "beaufort",
    "berkeley",
    "calhoun",
    "charleston",
    "cherokee",
    "chester",
    "chesterfield",
    "clarendon",
    "colleton",
    "darlington",
    "dillon",
    "dorchester",
    "edgefield",
    "fairfield",
    "florence",
    "georgetown",
    "greenville",
    "greenwood",
    "hampton",
    "horry",
    "jasper",
    "kershaw",
    "lancaster",
    "laurens",
    "lee",
    "lexington",
    "marion",
    "marlboro",
    "mccormick",
    "newberry",
    "oconee",
    "orangeburg",
    "pickens",
    "richland",
    "saluda",
    "spartanburg",
    "sumter",
    "union",
    "williamsburg",
    "york",
];

countyPopulation = [
    24527, 170872, 8688, 202558, 14066, 20866, 192122, 227907, 14553, 411406,
    57300, 32244, 45650, 33745, 37677, 66618, 30479, 162809, 27260, 22347, 138293,
    62680, 523542, 70811, 19222, 354081, 30073, 66551, 98012, 67493, 16828,
    298750, 30657, 26118, 9463, 38440, 79546, 86175, 126884, 415759, 20473,
    319785, 106721, 27316, 30368, 280979,
];

countyPOPCsvMapping = [];
for (let i = 0; i < countyNames.length; i++) {
    // countyPOPCsvMapping[countyNames[i]] = countyPopulation[i]
    const mapping = {
        county: countyNames[i],
        countyPop: countyPopulation[i],
    };
    countyPOPCsvMapping.push(mapping);
}

// colors and handy stuff
const colors = ["white", "saddlebrown"] //["#2E1E30", "#331427", "#A20D32", "#FF073A"];
var colorMap = d3.scaleLinear().range(colors)

gridHeight = gridContainer.clientHeight
gridWidth = gridContainer.clientWidth

// console.log(gridHeight, gridWidth)

var margin = { top: em, right: 0, bottom: 0.5*em, left: 0 },
    gridItemWidth = (gridWidth/10) - (margin.left + margin.right),
    gridItemHeight = (gridHeight/8) - (margin.top + margin.bottom);


// create svg's for each county
const cont = d3.select("#grid-container")

countyPOPCsvMapping.forEach(({ county }) => {
    let div = cont.append("div").attr("class", "quadrant")
    let svg = div.append("svg")
        .attr("id", county + "-grid")
        .attr("class", "grid-item")
});



createBaseObjects();
initialVisualisation();

function createBaseObjects() {
    countyPOPCsvMapping.forEach(({ county }) => {
        countyName = county.toUpperCase();

        // display data
        const svg = d3.select("#" + county + "-grid")
            .attr("width", gridItemWidth + margin.left + margin.right)
            .attr("height", gridItemHeight + margin.top + margin.bottom)

        svg
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        // background rep value
        svg
            .append("rect")
            .attr("width", gridItemWidth + margin.left + margin.right)
            .attr("height", gridItemHeight + margin.top + margin.bottom)
            .style("fill", "black");

        // link to county-vis w/ text
        svg
            .append("text")
            .attr("class", "county-label")
            .attr("x", 0.5*em)
            .attr("y", em)
            // .attr("text-anchor", "middle")
            .text(countyName)
            .style("fill", "white")
            .style("font-size", "var(--sl-font-size-small)")

    });

}

function initialVisualisation() {
    uploadAbsolute();
    countyPOPCsvMapping.forEach(({ county }) => {

        d3.select("#" + county + "-grid")
            .select("path")
            .transition()
            .duration(2000)
            .style("opacity", 1);

        d3.select("#" + county + "-grid")
            .select("circle")
            .style("opacity", 1);

        d3.select("#" + county + "-grid")
            .select(".pointlabel")
            .style("opacity", 1);
    });
}

function uploadAbsolute() {
    updateCountyGraphs("aggregated", "total");
}

function uploadAveraged() {
    updateCountyGraphs("aggregated", "popAdjusted");
}

function updateCountyGraphs(diseaseType, popType) {
    d3.json("/get-hospital-zcta-data-by-county", { // zcta hospital data
        "method": "POST",
        "headers": {"Content-Type": "application/json"},
        "body": JSON.stringify({
            "disease": "all",
            "date": "all",
    })}).then(function(result) {
        console.log(diseaseType, popType, result)
        data = result.data
        
        var parseDate = function(date) {return dayjs.tz(date, "YYYY-MM", "America/New_York").toDate()}
        colorMap.domain([0, result.stats['max-cum'] / (popType == "total" ? 1 : countyPop)])

        const x = d3
            .scaleTime()
            .domain([parseDate(result.stats['min-date']), parseDate(result.stats['max-date'])])
            .range([0, gridItemWidth]);

        countyPOPCsvMapping.forEach(({ county, countyPop }) => {
            countyData = result.data[county]
            maxYValue = result.stats['county'][county]['max'] / (popType == "total" ? 1 : countyPop)

            if (diseaseType == "aggregated") {
                countyValue = countyData["cum-sum"] / (popType == "total" ? 1 : countyPop)
            }
            else {
                countyValue = ""
            }

            countyTitle = diseaseType == "aggregated" ? "Total Cases" : "Population Adjusted Cases"

            const y = d3
                .scaleLinear()
                .domain([0, maxYValue * 1.2])
                .nice()
                .range([gridItemHeight + margin.top - margin.bottom, margin.top]);

            const line = d3.line()
                .defined((d) => !isNaN(d.count))
                .x((d) => x(parseDate(d.date)))
                .y((d) => y(d.count / (popType == "total" ? 1 : countyPop)));


            getMaxPoint = function(county, diseaseType, popType, data) {
                console.log(data)
                dataPoint = result.stats['county'][county][diseaseType][data.disease]
                return {
                        'date': parseDate(dataPoint.date),
                        'count': dataPoint.count / (popType == "total" ? 1 : countyPop),
                    }  
            }

            diseasePaths = d3.select("#" + county + "-grid")
                .selectAll(".path-container")
                .data(countyData[diseaseType])

            diseasePaths.exit().remove()

            newPaths = diseasePaths.enter().append("g").attr("class", "path-container")

            newPaths.datum(d => d)
                .append("path")
                .attr("fill", "none")
                .attr("stroke-linejoin", "round")
                .attr("stroke-linecap", "round")
                .attr("stroke-width", 2.0)
            newPaths.datum(d => d)
                .append("circle")
            newPaths.datum(d => d)
                .append("text")
                
            allPaths = newPaths
                .merge(diseasePaths)

            console.log(allPaths)
            console.log(allPaths.data())

            allPaths
                .select("path").transition().duration(750)
                .attr("stroke", d => diseaseType == "aggregated" ? "black" : diseaseColorMap(d.disease))
                .attr("d", d => line(d.data));
            allPaths.datum(d => d)
                .select("circle").transition().duration(750)
                .attr("cx", d => x(getMaxPoint(county, diseaseType, popType, d).date)) // x-coordinate
                .attr("cy", d => y(getMaxPoint(county, diseaseType, popType, d).count)) // y-coordinate
                .attr("r", 2)
                .attr("fill", d => diseaseType == "aggregated" ? d3.color("saddlebrown").brighter() : diseaseColorMap(d.disease))
            allPaths.datum(d => d)
                .select("text").transition().duration(750)
                .attr("x", d => x(getMaxPoint(county, diseaseType, popType, d).date) + 8) // x-coordinate
                .attr("y", d => y(getMaxPoint(county, diseaseType, popType, d).count) - 4) // Adjust the position to be above the circle
                .text(d => Math.round(getMaxPoint(county, diseaseType, popType, d).count));

            d3.select("#" + county + "-grid")
                .select(".totnumb").text(`(${countyValue})`)
                .attr("title", countyTitle);

            d3.select("#" + county + "-grid")
                .select("rect")
                .transition()
                .duration(2000)
                .style("fill", diseaseType == 'aggregated' ? colorMap(countyValue) : "black");
        })
    })
}