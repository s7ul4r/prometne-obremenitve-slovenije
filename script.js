
const apiUrls = {       // API URL for each year
    '2021': 'https://podatki.gov.si/api/3/action/datastore_search?resource_id=e2b03b21-26fe-44c1-b0e6-58fabe325d1e',
    '2020': 'https://podatki.gov.si/api/3/action/datastore_search?resource_id=7ec91f10-1015-404c-901a-ff1ac4718471',
    '2019': 'https://podatki.gov.si/api/3/action/datastore_search?resource_id=fc1f28f1-2311-4cea-be63-6fed0792f0e0',
    '2018': 'https://podatki.gov.si/api/3/action/datastore_search?resource_id=58b4454f-8816-48b6-bf26-786a2de3e87c',
    '2017': 'https://podatki.gov.si/api/3/action/datastore_search?resource_id=d4f38c82-eef4-4510-9861-a97657f3f548',
    '2016': 'https://podatki.gov.si/api/3/action/datastore_search?resource_id=883505d2-530f-4d3f-bb5f-a4fb6a344020',
    '2015': 'https://podatki.gov.si/api/3/action/datastore_search?resource_id=d1423187-b763-48a1-bf3c-4d461f8c5018',
    '2014': 'https://podatki.gov.si/api/3/action/datastore_search?resource_id=dffe04b4-5ce8-49d0-8092-c1a8ed44013a',
    '2013': 'https://podatki.gov.si/api/3/action/datastore_search?resource_id=96c74e82-82ec-4173-a16b-087faeccc98f',
    '2012': 'https://podatki.gov.si/api/3/action/datastore_search?resource_id=934074fa-34b0-40c5-82cc-04f1a889afd2',
    '2011': 'https://podatki.gov.si/api/3/action/datastore_search?resource_id=4913b207-ab2c-4fd3-b91b-1889fa1c7054'
};

var selectedYear = 2021;

// Function to initialize the buttons
function initializeButtons() {
    const buttonsContainer = document.getElementById('buttons-container');
    Object.keys(apiUrls).forEach(year => {
        const button = document.createElement('button');
        button.textContent = year;
        button.classList.add('button-year'); // Add the general button class
        button.addEventListener('click', function() {
            fetchData(year);
            selectedYear = year;
            updateButtonStyles(button); // Function to update button styles
        });
        buttonsContainer.appendChild(button);
    });
}
// Call the function to initialize buttons
initializeButtons();

function updateButtonStyles(selectedButton) {
    // Remove 'selected' class from all buttons
    document.querySelectorAll('.button-year').forEach(btn => {
        btn.classList.remove('selected');
    });
    // Add 'selected' class to the clicked button
    selectedButton.classList.add('selected');
}


google.charts.load('current', {'packages':['corechart']});


async function fetchData(year) {
    const url = apiUrls[year];
    try {
        const response = await fetch(url);
        const data = await response.json();

 
        const columnChartData = processDataForColumnChart(data);
        const geoChartData = processDataForGeoChart(data);
        const pieChartData = processDataForPieChart(data);

        console.log(data.result.records);

        // Call drawCharts function with both data sets
        google.charts.setOnLoadCallback(() => drawCharts(columnChartData, geoChartData, pieChartData));

        updateTable(data);

    } catch (error) {
        console.error('Error fetching data:', error);
    }
    
}

const fieldMappings = {
    'Prometni odsek': ['Prometni odsek'],
    'MO': ['Motorji'],
    'OV': ['Osebna vozila'],
    'AB': ['Avtobusi'],
    'LT': ['Lah. tov.  < 3,5t', 'Lah. tov < 3,5t', 'Lah. tov. < 3,5t'], // All variations
    'ST': ['Sr. tov  3,5-7t', 'Sr. tov.  3,5-7t'],
    'TT': ['Tež. tov. nad 7t'],
    'TP': ['Tov. s prik.'],
    'VL': ['Vlačilci'],
    'Vsa vozila': ['Vsa vozila (PLDP)']
};


function updateTable(apiResponse) {
    const dataTable = document.getElementById('data-table');
    dataTable.innerHTML = '';

    if (apiResponse && apiResponse.result && apiResponse.result.records && apiResponse.result.records.length > 0) {
        const data = apiResponse.result.records;
        const table = document.createElement('table');

        // Create table header based on the fieldMappings keys (shortened names)
        const headerRow = document.createElement('tr');
        Object.keys(fieldMappings).forEach(shortName => {
            const headerCell = document.createElement('th');
            headerCell.textContent = shortName;
            headerRow.appendChild(headerCell);
        });
        table.appendChild(headerRow);

        // Create table rows
        data.forEach(item => {
            const row = document.createElement('tr');
            Object.keys(fieldMappings).forEach(shortName => {
                const cell = document.createElement('td');
                const actualFieldName = findFieldName(item, fieldMappings[shortName]);
                let value = actualFieldName ? item[actualFieldName] : '-';

                if (!isNaN(value)) {
                    value = parseInt(value, 10);
                }

                cell.textContent = value;
                row.appendChild(cell);
            });
            table.appendChild(row);
        });

        dataTable.appendChild(table);
    } else {
        const noData = document.createElement('p');
        noData.textContent = 'No data available for this year.';
        dataTable.appendChild(noData);
    }
}


function findFieldName(dataItem, possibleFieldNames) {
    for (let i = 0; i < possibleFieldNames.length; i++) {
        if (dataItem.hasOwnProperty(possibleFieldNames[i])) {
            return possibleFieldNames[i];
        }
    }
    return null; // Return null if none of the field names are found
}


function processDataForColumnChart(apiResponse) {
    let sections = {};

    apiResponse.result.records.forEach(record => {
        const sectionName = record['Prometni odsek'];
        const vehicleCount = parseInt(record['Vsa vozila (PLDP)']) || 0;

        if (sections[sectionName]) {
            sections[sectionName] += vehicleCount;
        } else {
            sections[sectionName] = vehicleCount;
        }
    });

    // Convert to array and sort
    let sortedSections = Object.entries(sections).sort((a, b) => b[1] - a[1]);
    
    // Slice to get top 5 sections
    sortedSections = sortedSections.slice(0, 5);

    let chartData = [['Prometni Odsek', 'Vsa vozila']];
    chartData.push(...sortedSections);
    return chartData;
}

function processDataForGeoChart(apiResponse) {
    // New logic to process traffic data for GeoChart
    let cityTrafficCounts = {};
    apiResponse.result.records.forEach(record => {
        let section = record['Prometni odsek'];
        let trafficCount = parseInt(record['Vsa vozila (PLDP)']) || 0;
        if (trafficSections.hasOwnProperty(section)) {
            let city = trafficSections[section];
            if (!cityTrafficCounts[city]) {
                cityTrafficCounts[city] = 0;
            }
            cityTrafficCounts[city] += trafficCount;
        }
    });

    return cityTrafficCounts;
}


function processDataForPieChart(apiResponse) {
    let vehicleCounts = {
        'MO': 0,
        'OV': 0,
        'AB': 0,
        'LT': 0,
        'ST': 0,
        'TT': 0,
        'TP': 0,
        'VL': 0
    };


    apiResponse.result.records.forEach(record => {
        // Determine the structure based on the year
        let year = parseInt(selectedYear);

        console.log(selectedYear, year);

        // Common structure for all years
    vehicleCounts['MO'] += parseInt(record['Motorji']) || 0;
    vehicleCounts['OV'] += parseInt(record['Osebna vozila']) || 0;
    vehicleCounts['AB'] += parseInt(record['Avtobusi']) || 0;
    vehicleCounts['LT'] += parseInt(record['Lah. tov. < 3,5t']) || 0;
    vehicleCounts['ST'] += parseInt(record['Sr. tov.  3,5-7t']) || 0;
    vehicleCounts['TT'] += parseInt(record['Tež. tov. nad 7t']) || 0;
    vehicleCounts['TP'] += parseInt(record['Tov. s prik.']) || 0;
    vehicleCounts['VL'] += parseInt(record['Vlačilci']) || 0;

    // Adjustments for specific year ranges
    if (year >= 2011 && year <= 2014) {
        // No additional adjustments needed
    } else if (year >= 2015 && year <= 2016) {
        vehicleCounts['LT'] += parseInt(record['Lah. tov < 3,5t']) || 0;
        vehicleCounts['ST'] += parseInt(record['Sr. tov  3,5-7t']) || 0;
    } else if (year >= 2017 && year <= 2021) {
        vehicleCounts['LT'] += parseInt(record['Lah. tov.  < 3,5t']) || 0;
    }

    });

    let chartData = [['Vehicle Type', 'Count']];
    for (let type in vehicleCounts) {
        console.log(vehicleCounts);
        chartData.push([type, vehicleCounts[type]]);
    }
    return chartData;
}


function drawColumnChart(data) {
    var dataTable = google.visualization.arrayToDataTable(data);

    var options = {
        colors: ['#109619']
    };

    var chart = new google.visualization.ColumnChart(document.getElementById('column-chart'));
    chart.draw(dataTable, options);
}

function drawPieChart(dataArray) {
    var dataTable = google.visualization.arrayToDataTable(dataArray);

    var options = {

    };

    var chart = new google.visualization.PieChart(document.getElementById('pie-chart'));
    chart.draw(dataTable, options);
}



function drawGeoChart(cityTrafficCounts) {
    // Ensure Google Visualization API is loaded
    google.charts.load('current', {
        'packages': ['geochart'],
        // Note: Depending on your locale, you might need to set other options
    });
    google.charts.setOnLoadCallback(drawChart);

    function drawChart() {
        var data = new google.visualization.DataTable();
        data.addColumn('string', 'City');
        data.addColumn('number', 'Traffic Density');

        for (var city in cityTrafficCounts) {
            data.addRow([city, cityTrafficCounts[city]]);
        }

        var options = {
            region: 'SI', // Set the region to Slovenia; change as needed
            displayMode: 'regions',
            resolution: 'provinces',
            colorAxis: {colors: ['#e6f2ff', '#0000ff']}, // Color range; adjust as needed
            datalessRegionColor: 'ffffff'
        };

        var chart = new google.visualization.GeoChart(document.getElementById('geo-chart'));
        chart.draw(data, options);
    }
}

function initMap() {
    const map = new google.maps.Map(document.getElementById('map'), {
        center: { lat: -34.397, lng: 150.644 },
        zoom: 8
    });
}



function drawCharts(columnChartData, geoChartData, pieChartData) {
    // Draw Column Chart
    drawColumnChart(columnChartData);

    drawGeoChart(geoChartData);

    // Draw Pie Chart
    drawPieChart(pieChartData);
}