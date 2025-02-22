// Initialize Mapbox
mapboxgl.accessToken = 'pk.eyJ1IjoibWFoaWFyIiwiYSI6ImNtNDY1YnlwdDB2Z2IybHEwd2w3MHJvb3cifQ.wJqnzFFTwLFwYhiPG3SWJA';

let map;
let hoveredStateId = null;

async function initMap() {
  console.log('Initializing map...');
  
  try {
    map = new mapboxgl.Map({
      container: 'map',
      style: 'mapbox://styles/mapbox/light-v10',
      center: [-98, 40],
      zoom: 3,
      projection: 'mercator'
    });

    // Disable map rotation
    map.dragRotate.disable();
    map.touchZoomRotate.disableRotation();

    // Add minimal navigation controls
    map.addControl(new mapboxgl.NavigationControl({
      showCompass: false
    }));

    map.on('load', async () => {
      console.log('Map loaded successfully');
      
      try {
        // Fetch data from our API
        const response = await fetch('/api/map-data');
        if (!response.ok) {
          throw new Error(`Failed to fetch map data: ${response.statusText}`);
        }
        
        // Log the raw response
        const rawData = await response.text();
        console.log('Raw response first 500 chars:', rawData.substring(0, 500));
        
        const data = JSON.parse(rawData);
        
        // Check data structure
        console.log('Data structure:', {
          type: data.type,
          featureCount: data.features?.length,
          firstFeature: data.features?.[0]
        });

        // Add the data source
        map.addSource('opportunity-data', {
          type: 'geojson',
          data: data
        });
        console.log('Added data source to map');

        // Add fill layer with simpler styling first
        map.addLayer({
          id: 'opportunity-fills',
          type: 'fill',
          source: 'opportunity-data',
          paint: {
            'fill-color': '#2ca25f',  // Static color first
            'fill-opacity': 0.8,
            'fill-outline-color': '#ffffff'
          }
        });
        console.log('Added fill layer with static color');

        // Try to update the style after a short delay
        setTimeout(() => {
          try {
            const values = data.features
              .map(f => f.properties?.value)
              .filter(v => v !== undefined && v !== null && v > 0);
            
            if (values.length > 0) {
              const minValue = Math.min(...values);
              const maxValue = Math.max(...values);
              
              console.log('Updating style with value range:', {
                min: minValue,
                max: maxValue,
                sampleValues: values.slice(0, 5)
              });

              map.setPaintProperty('opportunity-fills', 'fill-color', [
                'case',
                ['==', ['get', 'value'], 0],
                '#f5f5f5',  // Color for regions with no data
                [
                  'interpolate',
                  ['linear'],
                  ['get', 'value'],
                  minValue, '#edf8fb',
                  (minValue + maxValue) / 4, '#b2e2e2',
                  (minValue + maxValue) / 2, '#66c2a4',
                  (3 * maxValue + minValue) / 4, '#2ca25f',
                  maxValue, '#006d2c'
                ]
              ]);
              console.log('Updated fill layer with dynamic colors');
            } else {
              console.warn('No valid values found in the data');
            }
          } catch (error) {
            console.error('Error updating style:', error);
          }
        }, 1000);

        // Add hover effect
        map.on('mousemove', 'opportunity-fills', (e) => {
          if (e.features.length > 0) {
            if (hoveredStateId !== null) {
              map.setFeatureState(
                { source: 'opportunity-data', id: hoveredStateId },
                { hover: false }
              );
            }
            hoveredStateId = e.features[0].id;
            map.setFeatureState(
              { source: 'opportunity-data', id: hoveredStateId },
              { hover: true }
            );
          }
        });

        map.on('mouseleave', 'opportunity-fills', () => {
          if (hoveredStateId !== null) {
            map.setFeatureState(
              { source: 'opportunity-data', id: hoveredStateId },
              { hover: false }
            );
          }
          hoveredStateId = null;
        });

        // Add popup on hover
        const popup = new mapboxgl.Popup({
          closeButton: false,
          closeOnClick: false
        });

        map.on('mousemove', 'opportunity-fills', (e) => {
          if (e.features.length > 0) {
            const feature = e.features[0];
            map.getCanvas().style.cursor = 'pointer';
            
            const popupContent = `
              <h4>${feature.properties.name || 'Region'}</h4>
              <p>Household Income: $${feature.properties.value.toLocaleString()}</p>
            `;

            popup.setLngLat(e.lngLat)
              .setHTML(popupContent)
              .addTo(map);
          }
        });

        map.on('mouseleave', 'opportunity-fills', () => {
          map.getCanvas().style.cursor = '';
          popup.remove();
        });

        // Add legend
        addLegend();

      } catch (error) {
        console.error('Error loading data:', error);
        const errorDiv = document.createElement('div');
        errorDiv.className = 'map-error';
        errorDiv.textContent = 'Error loading map data';
        document.getElementById('map').appendChild(errorDiv);
      }
    });

  } catch (error) {
    console.error('Error initializing map:', error);
  }
}

function addLegend() {
  const legend = document.createElement('div');
  legend.className = 'map-legend';
  legend.innerHTML = `
    <h4>Household Income</h4>
    <div class="legend-scale">
      <div class="legend-item">
        <span style="background: #edf8fb"></span>
        <label>$20,000</label>
      </div>
      <div class="legend-item">
        <span style="background: #b2e2e2"></span>
        <label>$30,000</label>
      </div>
      <div class="legend-item">
        <span style="background: #66c2a4"></span>
        <label>$40,000</label>
      </div>
      <div class="legend-item">
        <span style="background: #2ca25f"></span>
        <label>$50,000</label>
      </div>
      <div class="legend-item">
        <span style="background: #006d2c"></span>
        <label>$50,000+</label>
      </div>
    </div>
  `;
  document.getElementById('map').appendChild(legend);
}

// Initialize map when the page loads
window.addEventListener('load', () => {
  console.log('Window loaded, initializing map...');
  initMap();
});
