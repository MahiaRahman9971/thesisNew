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

let promises = [
    d3.csv("data/mobility_counties.csv"),
    d3.json("https://d3js.org/us-10m.v1.json"),
    d3.json("https://d3js.org/us-10m.v1.json")
];

Promise.all(promises)
    .then(function(data) {
        // Prepare the data
        mobilityData = data[0];
        geoData = data[1];
        stateData = data[2];

        // Initialize visualization
        mapVis = new MapVis("map-vis", geoData, mobilityData, stateData);
    })
    .catch(function(err) {
        console.log(err);
    });

// Initialize map and variables
mapboxgl.accessToken = 'pk.eyJ1IjoibWFoaWFyIiwiYSI6ImNtNDY1YnlwdDB2Z2IybHEwd2w3MHJvb3cifQ.wJqnzFFTwLFwYhiPG3SWJA';

let map;
let currentView = 'commuting';
let userDetails = {};

// Initialize map when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initializeMap();
    initializeForm();
    initializeMapControls();
});

function initializeMap() {
    if (map) return; // Don't initialize if already exists

    map = new mapboxgl.Map({
        container: 'zip-map',
        style: 'mapbox://styles/mapbox/light-v10',
        center: [-95.7129, 37.0902], // Center of US
        zoom: 3,
        projection: 'mercator'
    });

    // Add zoom and rotation controls
    map.addControl(new mapboxgl.NavigationControl());

    // Initialize with default view
    map.on('load', () => {
        loadMapData(currentView);
    });
}

function initializeMapControls() {
    const mapControls = document.querySelectorAll('.map-toggle');
    mapControls.forEach(control => {
        control.addEventListener('click', (e) => {
            const view = e.target.dataset.view;
            if (view === currentView) return;

            // Update active state
            document.querySelector('.map-toggle.active').classList.remove('active');
            e.target.classList.add('active');

            // Switch map view
            currentView = view;
            loadMapData(view);
        });
    });
}

function initializeForm() {
    const form = document.getElementById('personalization-form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Get form data
        const formData = new FormData(form);
        userDetails = {
            zipCode: formData.get('zipCode'),
            income: formData.get('income'),
            country: formData.get('country'),
            children: [
                {
                    name: formData.get('child1-name'),
                    gender: formData.get('child1-gender'),
                    age: formData.get('child1-age'),
                    ethnicity: formData.get('child1-ethnicity')
                }
            ]
        };

        // Add second child if data exists
        if (formData.get('child2-name')) {
            userDetails.children.push({
                name: formData.get('child2-name'),
                gender: formData.get('child2-gender'),
                age: formData.get('child2-age'),
                ethnicity: formData.get('child2-ethnicity')
            });
        }

        // Update map and scores based on form data
        updateMapView(userDetails.zipCode);
        updateScores(userDetails);
    });
}

async function loadGeographicData() {
    try {
        // Load commuting zones GeoJSON
        const czResponse = await fetch('/data/us-commuting-zones.json');
        commutingZonesData = await czResponse.json();

        // Load census tracts GeoJSON
        const ctResponse = await fetch('/data/census-tracts.geojson');
        censusTractsData = await ctResponse.json();

        console.log('Geographic data loaded successfully');
    } catch (error) {
        console.error('Error loading geographic data:', error);
    }
}

function updateScoresFromData() {
    // Calculate scores based on the loaded opportunity data
    // This is a placeholder implementation - you'll need to adjust the calculation
    // based on your specific requirements
    const scores = {
        segregation: calculateScore('segregation'),
        income_inequality: calculateScore('income_inequality'),
        school_quality: calculateScore('school_quality'),
        family_structure: calculateScore('family_structure'),
        social_capital: calculateScore('social_capital')
    };

    updateScores(scores);
}

function calculateScore(metric) {
    // This is a placeholder score calculation
    // You'll need to implement the actual scoring logic based on your data
    return Math.round(Math.random() * 40 + 60); // Returns a random score between 60-100
}

async function loadOpportunityData(race, gender) {
    try {
        // Construct filenames based on race and gender
        const czFilename = `/data/commuting_zones_opp/cz_kfr_r${race}_g${gender}_p25.csv`;
        const tractFilename = `/data/census_tracts_opp/tract_kfr_r${race}_g${gender}_p25.csv`;

        // Load both CSV files
        const [czResponse, tractResponse] = await Promise.all([
            fetch(czFilename),
            fetch(tractFilename)
        ]);

        const [czText, tractText] = await Promise.all([
            czResponse.text(),
            tractResponse.text()
        ]);

        // Parse CSV data
        opportunityData.commuting = parseCsvData(czText, 'commuting');
        opportunityData.census = parseCsvData(tractText, 'census');

        console.log('Opportunity data loaded successfully');
    } catch (error) {
        console.error('Error loading opportunity data:', error);
        throw error;
    }
}

function parseCsvData(csvText, type) {
    const rows = csvText.trim().split('\n');
    const header = rows[0].split(',');
    const data = new Map();

    rows.slice(1).forEach(row => {
        const values = row.split(',');
        const id = type === 'commuting' ? 
            String(parseInt(values[0].replace(/^cz/i, ''), 10)) : // For commuting zones
            values[0]; // For census tracts
        
        data.set(id, {
            name: values[1],
            income: parseFloat(values[2])
        });
    });

    return data;
}

async function initializeMap() {
    if (!map) {
        map = new mapboxgl.Map({
            container: 'zip-map',
            style: 'mapbox://styles/mapbox/light-v11',
            center: [-95.7129, 37.0902], // Center of US
            zoom: 3.5,
            projection: 'mercator',
            preserveDrawingBuffer: true
        });
        
        // Restrict map panning to US bounds
        const bounds = [
            [-167.276413, 15.436089], // Southwest coordinates (includes Alaska)
            [-52.233040, 52.964264]   // Northeast coordinates (includes Maine)
        ];
        map.setMaxBounds(bounds);
        
        map.addControl(new mapboxgl.NavigationControl());

        // Ensure map resizes properly
        window.addEventListener('resize', () => {
            map.resize();
        });
        
        // Wait for map to load before proceeding
        await new Promise(resolve => map.on('load', resolve));

        // Customize map colors
        map.on('style.load', () => {
            map.setPaintProperty('water', 'fill-color', '#30b4a4');
            map.setPaintProperty('land', 'background-color', '#ffffff');
            map.setPaintProperty('landuse', 'fill-color', '#9dbda9');
        });
    }
    
    // Geocode ZIP code and fly to location
    try {
        const response = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${userDetails.zipCode}.json?access_token=${mapboxgl.accessToken}`);
        const data = await response.json();
        
        if (data.features && data.features.length > 0) {
            const [lng, lat] = data.features[0].center;
            
            map.flyTo({
                center: [lng, lat],
                zoom: 10,
                essential: true
            });
            
            // Add a marker for the ZIP code
            new mapboxgl.Marker()
                .setLngLat([lng, lat])
                .addTo(map);
            
            // Update map layers with opportunity data
            updateMapLayers();
        }
    } catch (error) {
        console.error('Error geocoding ZIP code:', error);
        throw new Error('Could not locate ZIP code');
    }
}

function updateMapLayers() {
    if (!map.isStyleLoaded()) return;

    const currentData = currentView === 'commuting' ? 
        { geojson: commutingZonesData, opportunities: opportunityData.commuting } :
        { geojson: censusTractsData, opportunities: opportunityData.census };

    if (!currentData.geojson || !currentData.opportunities) {
        console.error('Required data not loaded');
        return;
    }

    // Combine geographic and opportunity data
    const combinedData = {
        type: 'FeatureCollection',
        features: currentData.geojson.features.map(feature => {
            const id = currentView === 'commuting' ?
                String(feature.properties.cz || feature.properties.CZ) :
                feature.properties.GEOID;
            
            const opportunityInfo = currentData.opportunities.get(id);
            
            return {
                ...feature,
                properties: {
                    ...feature.properties,
                    income: opportunityInfo ? opportunityInfo.income : null,
                    name: opportunityInfo ? opportunityInfo.name : 'Unknown Area'
                }
            };
        })
    };

    const sourceId = `${currentView}-source`;
    const layerId = `${currentView}-layer`;

    // Add or update the source
    if (map.getSource(sourceId)) {
        map.getSource(sourceId).setData(combinedData);
    } else {
        map.addSource(sourceId, {
            type: 'geojson',
            data: combinedData
        });

        // Add fill layer with updated color scheme
        map.addLayer({
            id: layerId,
            type: 'fill',
            source: sourceId,
            paint: {
                'fill-color': [
                    'interpolate',
                    ['linear'],
                    ['get', 'income'],
                    20000, '#9b252f',  // accent-color-1
                    30000, '#b65441',  // accent-color-2
                    40000, '#d07e59',  // accent-color-3
                    50000, '#e5a979',  // accent-color-4
                    60000, '#f4d79e',  // accent-color-5
                    70000, '#fcfdc1',  // accent-color-6
                    80000, '#cdddb5',  // accent-color-7
                    90000, '#9dbda9',  // accent-color-8
                    100000, '#729d9d', // accent-color-9
                    110000, '#4f7f8b', // accent-color-10
                    120000, '#34687e'  // accent-color-11
                ],
                'fill-opacity': 0.7
            }
        });

        // Add hover effect with updated colors
        map.addLayer({
            id: `${layerId}-hover`,
            type: 'fill',
            source: sourceId,
            paint: {
                'fill-color': '#30b4a4', // primary-color
                'fill-opacity': [
                    'case',
                    ['boolean', ['feature-state', 'hover'], false],
                    0.3,
                    0
                ]
            }
        });

        // Add outline with updated color
        map.addLayer({
            id: `${layerId}-outline`,
            type: 'line',
            source: sourceId,
            paint: {
                'line-color': '#333333', // text-color
                'line-width': 1,
                'line-opacity': 0.3
            }
        });

        // Add hover interactions
        let hoveredStateId = null;

        map.on('mousemove', layerId, (e) => {
            if (e.features.length > 0) {
                if (hoveredStateId !== null) {
                    map.setFeatureState(
                        { source: sourceId, id: hoveredStateId },
                        { hover: false }
                    );
                }
                hoveredStateId = e.features[0].id;
                map.setFeatureState(
                    { source: sourceId, id: hoveredStateId },
                    { hover: true }
                );

                // Show popup
                const props = e.features[0].properties;
                const income = props.income ? `$${Math.round(props.income).toLocaleString()}` : 'No data';
                const popupContent = `
                    <div style="padding: 8px;">
                        <strong>${props.name || 'Unknown Area'}</strong><br/>
                        Household Income: ${income}
                    </div>
                `;
                new mapboxgl.Popup()
                    .setLngLat(e.lngLat)
                    .setHTML(popupContent)
                    .addTo(map);
            }
        });

        map.on('mouseleave', layerId, () => {
            if (hoveredStateId !== null) {
                map.setFeatureState(
                    { source: sourceId, id: hoveredStateId },
                    { hover: false }
                );
            }
            hoveredStateId = null;
        });
    }
}

function initializeMapControls() {
    const viewCommuting = document.getElementById('view-commuting');
    const viewCensus = document.getElementById('view-census');
    
    viewCommuting.addEventListener('click', () => {
        currentView = 'commuting';
        updateMapView();
        viewCommuting.classList.add('active');
        viewCensus.classList.remove('active');
    });
    
    viewCensus.addEventListener('click', () => {
        currentView = 'census';
        updateMapView();
        viewCensus.classList.add('active');
        viewCommuting.classList.remove('active');
    });
}

function updateMapView() {
    if (!map) return;
    
    // Update map layers with new view
    updateMapLayers();
}

function updateScores(scores) {
    // Update the score bars and values
    Object.entries(scores).forEach(([metric, score]) => {
        const bar = document.getElementById(`${metric.replace('_', '-')}-bar`);
        const scoreElement = document.getElementById(`${metric.replace('_', '-')}-score`);
        
        if (bar && scoreElement) {
            bar.style.width = `${score}%`;
            scoreElement.textContent = score;
        }
    });
    
    // Calculate and update total score
    const totalScore = Math.round(
        Object.values(scores).reduce((sum, score) => sum + score, 0) / Object.keys(scores).length
    );
    
    const totalScoreElement = document.getElementById('total-score');
    if (totalScoreElement) {
        totalScoreElement.textContent = totalScore;
    }
}
