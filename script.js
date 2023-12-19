
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

// Function to initialize the buttons
function initializeButtons() {
    const buttonsContainer = document.getElementById('buttons-container');
    Object.keys(apiUrls).forEach(year => {
        const button = document.createElement('button');
        button.textContent = year;
        button.classList.add('button-year'); // Add the general button class
        button.addEventListener('click', function() {
            fetchData(year);
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

        const pieChartData = processDataForPieChart(data);
        const columnChartData = processDataForColumnChart(data); // Add this line

        console.log(`Fields for ${year}:`, Object.keys(data.result.records[0]));

        // Call drawCharts function with both data sets
        google.charts.setOnLoadCallback(() => drawCharts(columnChartData, pieChartData));
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
    'LT': ['Lah. tov < 3,5t', 'Lah. tov. < 3,5t', 'Lah. tov.  < 3,5t'], // All variations
    'ST': ['Sr. tov 3,5-7t', 'Sr. tov. 3,5-7t', 'Sr. tov.  3,5-7t', 'Sr. tov  3,5-7t'],
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
        // Parse string to integer and accumulate counts

        vehicleCounts['MO'] += parseInt(record['Motorji']) || 0;
        vehicleCounts['OV'] += parseInt(record['Osebna vozila']) || 0;
        vehicleCounts['AB'] += parseInt(record['Avtobusi']) || 0;
        vehicleCounts['LT'] += parseInt(record['Lah. tov < 3,5t', 'Lah. tov. < 3,5t', 'Lah. tov.  < 3,5t']) || 0;
        vehicleCounts['ST'] += parseInt(record['Sr. tov 3,5-7t', 'Sr. tov. 3,5-7t', 'Sr. tov.  3,5-7t', 'Sr. tov  3,5-7t']) || 0;
        vehicleCounts['TT'] += parseInt(record['Tež. tov. nad 7t']) || 0;
        vehicleCounts['TP'] += parseInt(record['Tov. s prik.']) || 0;
        vehicleCounts['VL'] += parseInt(record['Vlačilci']) || 0;

    });

    let chartData = [['Vehicle Type', 'Count']];
    for (let type in vehicleCounts) {
        chartData.push([type, vehicleCounts[type]]);
    }
    return chartData;
}


function drawPieChart(dataArray) {
    var dataTable = google.visualization.arrayToDataTable(dataArray);

    var options = {
        title: 'Prometna obremenitev glede na tip vozila',
        // Other options as needed
    };

    var chart = new google.visualization.PieChart(document.getElementById('pie-chart'));
    chart.draw(dataTable, options);
}



function drawCharts(columnChartData, pieChartData) {
    // Draw Column Chart
    drawColumnChart(columnChartData);

    // Draw Pie Chart
    drawPieChart(pieChartData);
}


function drawColumnChart(data) {
    var dataTable = google.visualization.arrayToDataTable(data);

    var options = {
        title: 'Traffic Density by Prometni Odsek',
        legend: { position: 'bottom' }
    };

    var chart = new google.visualization.ColumnChart(document.getElementById('column-chart'));
    chart.draw(dataTable, options);
}

function drawPieChart(data) {
    var dataTable = google.visualization.arrayToDataTable(data);

    var options = {
        title: 'Prometna obremenitev glede na tip vozila',
        pieHole: 0.4,
    };

    var chart = new google.visualization.PieChart(document.getElementById('pie-chart'));
    chart.draw(dataTable, options);
}
