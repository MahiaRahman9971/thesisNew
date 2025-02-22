const express = require('express');
const path = require('path');
const AWS = require('aws-sdk');
const { parse } = require('csv-parse');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Check required environment variables
const requiredEnvVars = [
  'AWS_ACCESS_KEY_ID',
  'AWS_SECRET_ACCESS_KEY',
  'AWS_REGION',
  'S3_BUCKET_NAME'
];

const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingEnvVars.length > 0) {
  console.error('Missing required environment variables:', missingEnvVars);
  process.exit(1);
}

// Configure AWS with debug logging
const awsConfig = {
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
  logger: console
};

console.log('Configuring AWS with region:', process.env.AWS_REGION);
AWS.config.update(awsConfig);

const s3 = new AWS.S3();

// Test S3 connection
async function testS3Connection() {
  try {
    console.log('Testing S3 connection...');
    const data = await s3.listObjects({
      Bucket: process.env.S3_BUCKET_NAME,
      MaxKeys: 1
    }).promise();
    console.log('Successfully connected to S3. Found objects:', data.Contents.length);
    
    // List specific files we need
    const files = await s3.listObjects({
      Bucket: process.env.S3_BUCKET_NAME,
      Prefix: 'commuting_zones_opp/'
    }).promise();
    console.log('Available files in commuting_zones_opp:', 
      files.Contents.map(f => f.Key));
  } catch (error) {
    console.error('Failed to connect to S3:', error);
    process.exit(1);
  }
}

// Call test function before starting server
testS3Connection();

app.use(express.static(path.join(__dirname)));

// API endpoint to fetch data from S3
app.get('/api/map-data', async (req, res) => {
  try {
    console.log('Starting data fetch...');
    
    // Get both the GeoJSON boundaries and CSV data
    const boundariesParams = {
      Bucket: process.env.S3_BUCKET_NAME,
      Key: 'geojson/us-commuting-zones.json'
    };

    const dataParams = {
      Bucket: process.env.S3_BUCKET_NAME,
      Key: 'commuting_zones_opp/cz_kfr_rA_gF_p25.csv'
    };

    console.log('S3 configuration:', {
      bucket: process.env.S3_BUCKET_NAME,
      boundariesKey: boundariesParams.Key,
      dataKey: dataParams.Key
    });

    // Get both files in parallel
    try {
      const [boundariesResponse, dataResponse] = await Promise.all([
        s3.getObject(boundariesParams).promise(),
        s3.getObject(dataParams).promise()
      ]);
      console.log('Successfully downloaded both files');

      try {
        const boundaries = JSON.parse(boundariesResponse.Body.toString());
        console.log('Parsed GeoJSON:', {
          type: boundaries.type,
          featureCount: boundaries.features.length,
          sampleFeatureCz: boundaries.features[0].properties.cz
        });

        const csvData = dataResponse.Body.toString();
        console.log('CSV data first 200 chars:', csvData.substring(0, 200));

        // Parse CSV data
        parse(csvData, {
          columns: true,
          skip_empty_lines: true,
          trim: true,
          relaxColumnCount: true  // Allow varying column counts
        }, (err, records) => {
          if (err) {
            console.error('Error parsing CSV:', err);
            return res.status(500).json({ error: 'Failed to parse CSV data', details: err.message });
          }

          try {
            if (!records || records.length === 0) {
              console.error('No records found in CSV');
              return res.status(500).json({ error: 'No records found in CSV' });
            }

            console.log('CSV parsing results:', {
              recordCount: records.length,
              columns: Object.keys(records[0]),
              firstRecord: records[0],
              // Log first few records to see the structure
              sampleRecords: records.slice(0, 3).map(r => ({
                columns: Object.keys(r),
                values: Object.values(r)
              }))
            });

            // Create a map of CZ to its data
            const czData = {};
            let processedRecords = 0;
            let validRecords = 0;

            records.forEach((record, index) => {
              processedRecords++;
              
              // First, let's log a few raw records to see what we're dealing with
              if (index < 3) {
                console.log(`Raw record ${index}:`, record);
              }

              // Try different possible column names for the commuting zone ID
              const czId = record.cz || record.czname || record.CZ || record.commuting_zone;
              if (!czId) {
                if (index < 5) {
                  console.warn('Record missing cz:', {
                    availableColumns: Object.keys(record),
                    record
                  });
                }
                return;
              }

              // Try different possible column names for household income
              const possibleColumns = [
                'kfr_pooled_pooled_p25',
                'Household_Income_at_Age_35_rA_gF_p25',
                'household_income',
                'kfr_top20_pooled_p25',
                'kfr_rA_gF_p25',
                'kfr',
                'income',
                'median_household_income'
              ];

              let value = null;
              let usedColumn = null;

              // First try exact column matches
              for (const column of possibleColumns) {
                if (record[column] !== undefined && record[column] !== '') {
                  const parsed = parseFloat(record[column]);
                  if (!isNaN(parsed)) {
                    value = parsed;
                    usedColumn = column;
                    break;
                  }
                }
              }

              // If no exact match, try case-insensitive matches
              if (value === null) {
                const recordKeys = Object.keys(record);
                for (const column of possibleColumns) {
                  const matchingKey = recordKeys.find(k => k.toLowerCase() === column.toLowerCase());
                  if (matchingKey && record[matchingKey] !== undefined && record[matchingKey] !== '') {
                    const parsed = parseFloat(record[matchingKey]);
                    if (!isNaN(parsed)) {
                      value = parsed;
                      usedColumn = matchingKey;
                      break;
                    }
                  }
                }
              }

              if (value === null || isNaN(value)) {
                if (index < 5) {
                  console.warn('No valid income value found for CZ:', {
                    czId,
                    availableColumns: Object.keys(record),
                    recordSample: record
                  });
                }
                return;
              }

              validRecords++;
              czData[czId] = {
                name: record.name || record.Name || record.ZONE_NAME || `Commuting Zone ${czId}`,
                value: value
              };

              // Log the first few successful matches
              if (validRecords <= 3) {
                console.log('Successfully processed record:', {
                  czId,
                  value,
                  usedColumn,
                  name: czData[czId].name
                });
              }
            });

            console.log('CSV processing stats:', {
              processedRecords,
              validRecords,
              uniqueCzIds: Object.keys(czData).length
            });

            // Merge data into GeoJSON
            let matchedFeatures = 0;
            const mergedGeoJSON = {
              type: 'FeatureCollection',
              features: boundaries.features.map((feature, index) => {
                const featureCz = feature.properties.cz?.toString();
                
                if (!featureCz) {
                  if (index < 5) console.warn('Feature missing cz property:', feature.properties);
                  return feature;
                }

                const data = czData[featureCz];
                if (!data) {
                  if (index < 5) {
                    console.warn('No data found for CZ:', {
                      featureCz,
                      featureProps: feature.properties
                    });
                  }
                  return {
                    ...feature,
                    id: index,
                    properties: {
                      ...feature.properties,
                      name: `Commuting Zone ${featureCz}`,
                      value: 0
                    }
                  };
                }

                matchedFeatures++;
                return {
                  type: 'Feature',
                  id: index,
                  geometry: feature.geometry,
                  properties: {
                    ...feature.properties,
                    name: data.name,
                    value: data.value
                  }
                };
              })
            };

            console.log('Final merge stats:', {
              totalFeatures: boundaries.features.length,
              matchedFeatures,
              sampleValues: mergedGeoJSON.features
                .slice(0, 5)
                .map(f => ({ cz: f.properties.cz, value: f.properties.value }))
            });

            res.json(mergedGeoJSON);
          } catch (error) {
            console.error('Error processing data:', error);
            res.status(500).json({ error: 'Error processing data', details: error.message });
          }
        });
      } catch (error) {
        console.error('Error parsing response data:', error);
        res.status(500).json({ error: 'Error parsing response data', details: error.message });
      }
    } catch (error) {
      console.error('Error fetching from S3:', error);
      res.status(500).json({ error: 'Error fetching from S3', details: error.message });
    }
  } catch (error) {
    console.error('Top level error:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
