class MapVis {
    constructor(parentElement, geoData, mobilityData, stateData) {
        this.parentElement = parentElement;
        this.geoData = geoData;
        this.mobilityData = mobilityData;
        this.stateData = stateData;
        this.initVis()
    }

    initVis() {
        let vis = this;

        // Set margins and dimensions
        vis.margin = { top: 20, right: 10, bottom: 20, left: 10 };

        vis.width = document.getElementById(vis.parentElement).getBoundingClientRect().width - vis.margin.left - vis.margin.right,
        vis.height = vis.width * 0.6;

        // SVG drawing area
        vis.svg = d3.select("#" + vis.parentElement).append("svg")
            .attr("width", vis.width + vis.margin.left + vis.margin.right)
            .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
            .append("g")
            .attr("transform", `translate(${vis.margin.left},${vis.margin.top})`);

        // Converting TopoJSON data into GeoJSON data structure
        vis.geo = topojson.feature(vis.geoData, vis.geoData.objects.counties).features;

        // Drawing counties
        vis.viewpoint = {'width': 975, 'height': 610};
        vis.zoom = (vis.width / vis.viewpoint.width) * 0.95;  // Slightly decreased zoom

        // Calculate translation to center the map
        let translate = [
            vis.margin.left,
            (vis.height - vis.viewpoint.height * vis.zoom) / 2 + vis.margin.top
        ];

        // Adjusting map position
        vis.map = vis.svg.append("g")
            .attr("class", "counties")
            .attr('transform', `translate(${translate[0]},${translate[1]}) scale(${vis.zoom})`);

        vis.path = d3.geoPath();

        // Drawing the map
        vis.counties = vis.map.selectAll(".county")
            .data(vis.geo)
            .enter()
            .append("path")
            .attr("class", d => {
                let value = handleGetMobility(d);
                return "county " + handleGetColor(value);
            })
            .attr("d", vis.path)
            .on("mouseover", handleMouseOver)
            .on("mouseout", handleMouseOut);

        vis.statesGeo = topojson.feature(vis.stateData, vis.stateData.objects.states).features;

        // Draw state borders
        vis.map.append("g")
            .attr("class", "states")
            .selectAll("path")
            .data(vis.statesGeo)
            .enter().append("path")
            .attr("class", "state")
            .attr("d", vis.path)
            .attr("fill", "none")
            .attr("stroke", "black")
            .attr("stroke-linejoin", "round")
            .attr("stroke-width", "2");

        function handleGetMobility(d) {
            for (let i = 0; i < vis.mobilityData.length; i++){
                if (d.id == vis.mobilityData[i].geoid) {
                    return vis.mobilityData[i].kfr_pooled_pooled_p25;
                }
            }
        }

        function handleGetColor(value) {
            if (value === undefined || value === null) return "color-error";
            if (value <= 0.35) return "color-01";
            if (value <= 0.38) return "color-02";
            if (value <= 0.40) return "color-03";
            if (value <= 0.42) return "color-04";
            if (value <= 0.44) return "color-05";
            if (value <= 0.46) return "color-06";
            if (value <= 0.48) return "color-07";
            if (value <= 0.50) return "color-08";
            if (value <= 0.52) return "color-09";
            if (value <= 0.54) return "color-10";
            return "color-11";
        }

        var tooltip = d3.select("#" + vis.parentElement)
            .append("div")
            .style("position", "absolute")
            .style("visibility", "hidden")
            .style("background-color", "#fcfbfb")
            .style("color", "black")
            .style("border", "solid")
            .style("border-width", "0px")
            .style("border-radius", "5px")
            .style("padding", "10px")
            .style("box-shadow", "2px 2px 20px")
            .attr("id", "tooltip");

        let usStates = [
            "","Alabama","Alaska","","Arizona", "Arkansas", "California","","Colorado",
            "Connecticut", "Delaware","District of Columbia","Florida", "Georgia","","Hawaii", "Idaho",
            "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky", "Louisiana", "Maine",
            "Maryland", "Massachusetts", "Michigan", "Minnesota", "Mississippi",
            "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire", "New Jersey",
            "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio", "Oklahoma",
            "Oregon", "Pennsylvania","", "Rhode Island", "South Carolina", "South Dakota",
            "Tennessee", "Texas", "Utah", "Vermont", "Virginia","","Washington",
            "West Virginia", "Wisconsin", "Wyoming"
        ];

        function handleGetLocation(x) {
            for (let i = 0; i < vis.mobilityData.length; i++) {
                if (x == vis.mobilityData[i].geoid) {
                    return vis.mobilityData[i].czname + ", " + usStates[(vis.mobilityData[i].state)] + ": " + 
                           Number(vis.mobilityData[i].kfr_pooled_pooled_p25).toLocaleString(undefined,{style: "percent", minimumFractionDigits:2});
                }
            }
        }

        function handleMouseOver(event, d) {
            d3.select(this)
                .attr("stroke", "black")
                .attr("stroke-width", "3");

            tooltip
                .style("visibility", "visible")
                .style("top", (event.pageY) - 40 + "px")
                .style("left", (event.pageX) + 10 + "px")
                .html("<center> " + handleGetLocation(d.id) + " </center>");
        }

        function handleMouseOut(event, d) {
            d3.select(this)
                .attr("stroke", "none")
                .attr("stroke-width", "1");

            tooltip.style("visibility", "hidden");
        }

        vis.wrangleData()
    }

    wrangleData() {
        let vis = this;
        vis.updateVis();
    }

    updateVis() {
        let vis = this;
    }
}

let mapVis;
let commutingZonesData = [];
let opportunityData = {};
let currentView = 'commuting';
let userDetails = {};

// Load initial data
let promises = [
    d3.csv("../data/mobility_counties.csv"),
    d3.json("../data/counties-10m.json"),
    d3.json("../data/states-10m.json"),
    d3.json("../data/us-commuting-zones.json"),
    // Load commuting zones opportunity data
    d3.csv("../data/commuting_zones_opp/cz_kfr_rW_gM_p25.csv"),
    d3.csv("../data/commuting_zones_opp/cz_kfr_rW_gF_p25.csv"),
    d3.csv("../data/commuting_zones_opp/cz_kfr_rB_gM_p25.csv"),
    d3.csv("../data/commuting_zones_opp/cz_kfr_rB_gF_p25.csv"),
    d3.csv("../data/commuting_zones_opp/cz_kfr_rH_gM_p25.csv"),
    d3.csv("../data/commuting_zones_opp/cz_kfr_rH_gF_p25.csv")
];

Promise.all(promises)
    .then(function(data) {
        try {
            // Store the loaded data
            const [
                mobilityData,
                geoData,
                stateData,
                commutingZones,
                wMaleOpp,
                wFemaleOpp,
                bMaleOpp,
                bFemaleOpp,
                hMaleOpp,
                hFemaleOpp
            ] = data;

            // Parse CSV data if needed
            const parseCSV = (csvData) => {
                if (typeof csvData === 'string') {
                    return csvData.split('\n')
                        .map(row => row.split(','))
                        .filter(row => row.length > 1);
                }
                return csvData;
            };

            // Initialize opportunity data
            opportunityData = {
                'White': {
                    'Male': parseCSV(wMaleOpp),
                    'Female': parseCSV(wFemaleOpp)
                },
                'Black': {
                    'Male': parseCSV(bMaleOpp),
                    'Female': parseCSV(bFemaleOpp)
                },
                'Hispanic': {
                    'Male': parseCSV(hMaleOpp),
                    'Female': parseCSV(hFemaleOpp)
                }
            };

            commutingZonesData = commutingZones;
            
            // Initialize visualization
            mapVis = new MapVis("map-vis", geoData, mobilityData, stateData);
            
            // Initialize controls after data is loaded
            initializeMapControls();
        } catch (error) {
            console.error('Error processing data:', error);
        }
    })
    .catch(function(err) {
        console.error('Error loading data:', err);
    });

function initializeMapControls() {
    const mapControls = document.getElementById('map-controls');
    if (!mapControls) {
        console.log('Map controls element not found, skipping initialization');
        return;
    }
    
    try {
        const form = document.querySelector('form');
        if (form) {
            form.addEventListener('submit', function(e) {
                e.preventDefault();
                updateMapView();
            });
        }
    } catch (error) {
        console.error('Error setting up map controls:', error);
    }
}

async function updateMapLayers(center) {
    if (!center) {
        console.log('No center coordinates provided');
        return;
    }
    
    try {
        const quizData = JSON.parse(localStorage.getItem('personalizationQuiz') || '{}');
        const ethnicity = quizData.ethnicity || 'White';
        const gender = quizData.gender || 'Female';
        
        // Get opportunity data for the selected demographic
        const demoOpportunityData = opportunityData[ethnicity]?.[gender] || [];
        
        // Update map with opportunity data
        if (mapVis && demoOpportunityData.length > 0) {
            // Your existing map update code here
            console.log('Updating map with opportunity data for:', ethnicity, gender);
        } else {
            console.log('Missing map visualization or opportunity data');
        }
    } catch (error) {
        console.error('Error updating map layers:', error);
    }
}

async function initializeMap() {
    try {
        mapboxgl.accessToken = 'pk.eyJ1IjoibWFoaWFyIiwiYSI6ImNtNDY1YnlwdDB2Z2IybHEwd2w3MHJvb3cifQ.wJqnzFFTwLFwYhiPG3SWJA';
        const quizData = JSON.parse(localStorage.getItem('personalizationQuiz') || '{}');
        if (!quizData.zipCode) {
            console.log('No ZIP code found in quiz data');
            return;
        }

        const response = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${quizData.zipCode}.json?access_token=${mapboxgl.accessToken}`);
        if (!response.ok) {
            throw new Error('Geocoding request failed');
        }

        const data = await response.json();
        if (!data.features || data.features.length === 0) {
            throw new Error('Could not locate ZIP code');
        }

        await updateMapLayers(data.features[0].center);
    } catch (error) {
        console.error('Error initializing map:', error);
        throw error;
    }
}

// Initialize map when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initializeMap();
    initializeMapControls();
});
