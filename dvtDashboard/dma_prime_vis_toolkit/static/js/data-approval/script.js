

tabGroup.addEventListener("sl-tab-show", function(e) {
    document.getElementById(`${e.detail.name}-dashboard`).src = `${e.detail.name}`
})
tabGroup.addEventListener("sl-tab-hide", function(e) {
    try {
        document.getElementById(`${e.detail.name}-dashboard`).src = ""
    } catch (error) {
        
    }
})

d3.selectAll(".preview-data-button").on("click", function(d){
    document.getElementById(`${this.getAttribute("dashboard")}-dashboard`).src = `/${this.getAttribute("dashboard")}?data_version=${this.getAttribute("dataversion")}`
    d3.selectAll(".preview-data-button").attr("variant", "default")
    this.setAttribute("variant", "primary")
})

d3.selectAll(".approve-data-button").on("click", function(d) {
    const requestOptions = {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 'change': this.getAttribute("dataversion"), 'dashboard': this.getAttribute("dashboard")})
    };

    fetch('/data/change-version', requestOptions)
    .then(response => {
        
        if (!this.classList.contains("overview")) {
            document.getElementById(`${this.getAttribute("dashboard")}-dashboard`).src = `/${this.getAttribute("dashboard")}?data_version=current`

            d3.selectAll(".preview-data-button").attr("variant", "default")
            d3.selectAll(".preview-data-button[dataVersion=current]").node().setAttribute("variant", "primary")
        }
        updateDates(this.getAttribute("dashboard"))
    })
    
})

function updateDates(dashboard) {
    d3.json(`/data/get-date/all/${dashboard}`).then(dates => {
        Object.entries(dates[dashboard]).forEach(([version, date]) => {
            console.log(d3.selectAll(`.data-date[dataVersion=${version}][dashboard=${dashboard}]`))
            d3.selectAll(`.data-date[dataVersion=${version}][dashboard=${dashboard}]`).html(date)
            console.log(version, date)
        })
    })
}