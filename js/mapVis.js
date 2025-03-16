class MapVis {
    constructor(parentElement, geoData, mobilityData, stateData) {
        this.parentElement = parentElement;
        this.geoData = geoData;
        this.mobilityData = mobilityData;
        this.stateData = stateData;
        
        this.initVis();
    }

    initVis() {
        const vis = this;

        // Set up the map container
        const mapContainer = document.getElementById(vis.parentElement);
        if (!mapContainer) {
            console.error('Map container not found');
            return;
        }

        // Initialize the map
        mapboxgl.accessToken = 'pk.eyJ1IjoibWFoaWFyYWhtYW45OTcxIiwiYSI6ImNscnVtdXd1NjBjbXQya3BjOWZsZGt2cGQifQ.FVvLFHQXHH_JyEQ-YtU8Aw';
        vis.map = new mapboxgl.Map({
            container: vis.parentElement,
            style: 'mapbox://styles/mapbox/light-v10',
            center: [-71.1167, 42.3770], // Cambridge, MA coordinates
            zoom: 11
        });

        // Add navigation controls
        vis.map.addControl(new mapboxgl.NavigationControl());

        // Add event listeners
        vis.map.on('load', () => {
            vis.addLayers();
        });
    }

    addLayers() {
        const vis = this;

        // Add source for states
        if (vis.geoData && vis.geoData.objects && vis.geoData.objects.states) {
            const statesGeojson = topojson.feature(vis.geoData, vis.geoData.objects.states);
            
            vis.map.addSource('states', {
                type: 'geojson',
                data: statesGeojson
            });

            // Add layer for state boundaries
            vis.map.addLayer({
                id: 'state-boundaries',
                type: 'line',
                source: 'states',
                paint: {
                    'line-color': '#000',
                    'line-width': 1
                }
            });

            // Add layer for state fills
            vis.map.addLayer({
                id: 'state-fills',
                type: 'fill',
                source: 'states',
                paint: {
                    'fill-color': [
                        'interpolate',
                        ['linear'],
                        ['get', 'mobility_score'],
                        0, '#fee5d9',
                        0.5, '#fcae91',
                        1, '#fb6a4a'
                    ],
                    'fill-opacity': 0.7
                }
            });
        }
    }
}

// Initialize map controls
function initializeMapControls() {
    const controlsElement = document.querySelector('.map-controls');
    if (!controlsElement) {
        console.warn('Map controls element not found, skipping initialization');
        return;
    }

    // Add event listeners for controls
    const viewButtons = controlsElement.querySelectorAll('.view-button');
    viewButtons.forEach(button => {
        button.addEventListener('click', () => {
            const view = button.getAttribute('data-view');
            if (view) {
                currentView = view;
                updateMapView();
            }
        });
    });
}

// Update map view based on current settings
function updateMapView() {
    if (!mapVis || !mapVis.map) {
        console.warn('Missing map visualization or opportunity data');
        return;
    }

    // Update map layers based on current view
    const map = mapVis.map;
    if (map.loaded()) {
        if (currentView === 'commuting') {
            // Show commuting zones
            map.setLayoutProperty('state-boundaries', 'visibility', 'none');
            map.setLayoutProperty('state-fills', 'visibility', 'none');
        } else {
            // Show state view
            map.setLayoutProperty('state-boundaries', 'visibility', 'visible');
            map.setLayoutProperty('state-fills', 'visibility', 'visible');
        }
    }
}

// Load data
const promises = [
    d3.csv("data/mobility.csv"),
    d3.json("data/us.json"),
    d3.json("data/states.json"),
    d3.csv("data/commuting_zones.csv"),
    d3.csv("data/white_male_opp.csv"),
    d3.csv("data/white_female_opp.csv"),
    d3.csv("data/black_male_opp.csv"),
    d3.csv("data/black_female_opp.csv"),
    d3.csv("data/hispanic_male_opp.csv"),
    d3.csv("data/hispanic_female_opp.csv")
].map(promise => promise.catch(error => {
    console.error('Error loading data:', error);
    return null;
}));

Promise.all(promises)
    .then(function(data) {
        try {
            // Filter out any failed loads
            const validData = data.filter(d => d !== null);
            if (validData.length !== data.length) {
                console.warn('Some data files failed to load');
            }

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
            ] = validData;

            // Initialize opportunity data
            opportunityData = {
                'White': {
                    'Male': wMaleOpp || [],
                    'Female': wFemaleOpp || []
                },
                'Black': {
                    'Male': bMaleOpp || [],
                    'Female': bFemaleOpp || []
                },
                'Hispanic': {
                    'Male': hMaleOpp || [],
                    'Female': hFemaleOpp || []
                }
            };

            commutingZonesData = commutingZones || [];
            
            // Initialize visualization if we have the minimum required data
            if (geoData && mobilityData && stateData) {
                mapVis = new MapVis("map-vis", geoData, mobilityData, stateData);
                initializeMapControls();
            } else {
                console.error('Missing required data for visualization');
            }
        } catch (error) {
            console.error('Error processing data:', error);
        }
    })
    .catch(function(err) {
        console.error('Error loading data:', err);
    });

// Initialize map when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const mapContainer = document.getElementById('map-vis');
    if (!mapContainer) {
        console.error('Map container not found');
        return;
    }
});
