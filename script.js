
const apiUrls = {       // Year with and API URL
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


function initializeButtons() {      // Function to initialize the buttons
    const buttonsContainer = document.getElementById('buttons-container');
    Object.keys(apiUrls).forEach(year => {
        const button = document.createElement('button');
        button.textContent = year;
        if (button.textContent === '2021') {
             document.getElementById('loadingScreen').style.display = 'block';
             fetchData(year);
             selectedYear = year;
             updateButtonStyles(button);
        }
        button.classList.add('button-year');
        button.addEventListener('click', function() {
            document.getElementById('loadingScreen').style.display = 'block';
            fetchData(year);
            selectedYear = year;
            updateButtonStyles(button); 
        });
        buttonsContainer.appendChild(button);
    });
}

initializeButtons();

function updateButtonStyles(selectedButton) {       // Function to update the selected button styles
    document.querySelectorAll('.button-year').forEach(btn => {
        btn.classList.remove('selected');
    });
    selectedButton.classList.add('selected');
}


google.charts.load('current', {'packages':['corechart']});


async function fetchData(year) {
    const url = apiUrls[year];
    let allData = [];
    let keepFetching = true;
    let offset = 0;
    try {
        while (keepFetching) {
            const paginatedUrl = `${url}&offset=${offset}`;
            const response = await fetch(paginatedUrl);
            const apiResponse = await response.json();
            const incorrectValues = ["Števec QLTC10 loči 10 kategorij vozil", "Tip izračuna : ", "Števno mesto", "TT - Težki tovornjaki nad 7t", "Oznaka števnega mesta", "Tež. tov. nad 7t", "Ime števnega mesta",
            "TP - Tovorni s prikolico", "Ime števnega mesta", "Tov. s prik.", "TIP", "Tip izračuna", "QLD-6         Števec QLD-6 loči 10 kategorij vozil", "QLTC-8       Števec QLTC-8 loči 10 kategorij vozil",
            "PRAZNO     V letu 2011 števec ni deloval", "R 11x4        Ročno štetje", "                   11x4 Leto zadnjega ročnega štetja (2011) in število štetij v letu (4)", "tip izračuna : WIM za izračun NOO na osnovi WIM meritev na merjenem odseku, ",
            "P                  Privzet  (na tem odseku se ne izvaja štetje,  promet je ocenjen)", "Vsa vozila (PLDP)", "PLDP - Povp. letni dnevni promet vseh motornih vozil", "Motorji", "MO - Motorji", "Osebna vozila",  "OA - Osebna vozila", "Avtobusi",
            "BUS - Avtobusi", "Lahka tov. < 3,5t", "LT - Lahki tovorni promet do 3,5t", "Sr. tov.  3,5-7t", "ST - Srednje težki tovornjaki 3,5-7t", "Vlačilci", "TPP - Vlačilci", "NOO", "nominalna osna obremenitev, 20 letno povprečje", "Tip štetja",
            "QLD5         Števec QLD5 loči 5 kategorij vozil" ];
            if (apiResponse && apiResponse.result && apiResponse.result.records) {
                for (const record of apiResponse.result.records) {
                    let emptyStringCount = 0;
                    let allRecords = [];
                    let isIncorrect = false;
                    for (const key in record) {
                        allRecords.push(record[key])
                        if (allRecords.some(key => incorrectValues.includes(key))) {
                            isIncorrect = true;
                            break;
                        } else if (record[key] === '') {
                            emptyStringCount++;

                            if (emptyStringCount === 13) {
                                keepFetching = false;
                                console.log("Log that breaks:  ", record);
                                break;
                            }
                        }
                    }
                    if (keepFetching == true) {
                        if (isIncorrect === false) {
                            allData.push(record);
                        }
                    } else {
                        isIncorrect = false;
                        break;
                    }
                }
                if (keepFetching) {
                    offset += apiResponse.result.records.length;
                }
            } else {
                console.log('Unexpected API response:', apiResponse);
                keepFetching = false;
            }
        }        
        const columnChartData = processDataForColumnChart(allData);
        const geoChartData = processDataForGeoChart(allData);
        const pieChartData = processDataForPieChart(allData);
        const tableData = allData;

        google.charts.setOnLoadCallback(() => drawCharts(columnChartData, geoChartData, pieChartData, tableData));
        document.getElementById('loadingScreen').style.display = 'none';

    } catch (error) {
        console.error('Failed to fetch data:', error);
        keepFetching = false;
    }
}

const fieldMappings = {
    'Prometni odsek': ['Prometni odsek'],
    'MO': ['Motorji'],
    'OV': ['Osebna vozila'],
    'AB': ['Avtobusi'],
    'LT': ['Lah. tov.  < 3,5t', 'Lah. tov < 3,5t', 'Lah. tov. < 3,5t'],     // All variations of LT
    'ST': ['Sr. tov  3,5-7t', 'Sr. tov.  3,5-7t'],      // All variations of ST
    'TT': ['Tež. tov. nad 7t'],
    'TP': ['Tov. s prik.'],
    'VL': ['Vlačilci'],
    'Vsa vozila': ['Vsa vozila (PLDP)']
};


function updateTable(apiResponse) {
    const dataTable = document.getElementById('data-table');
    dataTable.innerHTML = '';

    console.log("LENGTH:   ", apiResponse.length);

    if (apiResponse.length > 0) {
        const data = apiResponse;
        const table = document.createElement('table');
        const headerRow = document.createElement('tr');
        Object.keys(fieldMappings).forEach(shortName => {
            const headerCell = document.createElement('th');
            headerCell.textContent = shortName;
            headerRow.appendChild(headerCell);
        });
        table.appendChild(headerRow);

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
    return null;
}


function processDataForColumnChart(apiResponse) {
    let sections = {};

    apiResponse.forEach(record => {
        const sectionName = record['Prometni odsek'];
        const vehicleCount = parseInt(record['Vsa vozila (PLDP)']) || 0;

        if (sections[sectionName]) {
            sections[sectionName] += vehicleCount;
        } else {
            sections[sectionName] = vehicleCount;
        }
    });

    let sortedSections = Object.entries(sections).sort((a, b) => b[1] - a[1]);
    
    sortedSections = sortedSections.slice(0, 5);

    let chartData = [['Prometni Odsek', 'Vsa vozila']];
    chartData.push(...sortedSections);
    return chartData;
}

function processDataForGeoChart(apiResponse) {

    function stripWhitespaceFromKeys(inputObject) {
        const strippedObject = {};
        for (const key in inputObject) {
          if (inputObject.hasOwnProperty(key)) {
            const strippedKey = key.replace(/\s/g, '');
            strippedObject[strippedKey] = inputObject[key];
          }
        }
        return strippedObject;
      }

    let cityTrafficCounts = {};
    apiResponse.forEach(record => {
        let section = record['Prometni odsek'];
        let trafficCount = parseInt(record['Vsa vozila (PLDP)']) || 0;
        if (stripWhitespaceFromKeys(trafficSections).hasOwnProperty(section.replace(/\s/g, ''))) {
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

    apiResponse.forEach(record => {
        let year = parseInt(selectedYear);
        console.log('SELECTED YEAR:  ', selectedYear);

        vehicleCounts['MO'] += parseInt(record['Motorji']) || 0;
        vehicleCounts['OV'] += parseInt(record['Osebna vozila']) || 0;
        vehicleCounts['AB'] += parseInt(record['Avtobusi']) || 0;
        vehicleCounts['LT'] += parseInt(record['Lah. tov. < 3,5t']) || 0;
        vehicleCounts['ST'] += parseInt(record['Sr. tov.  3,5-7t']) || 0;
        vehicleCounts['TT'] += parseInt(record['Tež. tov. nad 7t']) || 0;
        vehicleCounts['TP'] += parseInt(record['Tov. s prik.']) || 0;
        vehicleCounts['VL'] += parseInt(record['Vlačilci']) || 0;

        if (year >= 2011 && year <= 2014) {
            // No adjustments needed
        } else if (year >= 2015 && year <= 2016) {
            vehicleCounts['LT'] += parseInt(record['Lah. tov < 3,5t']) || 0;
            vehicleCounts['ST'] += parseInt(record['Sr. tov  3,5-7t']) || 0;
        } else if (year >= 2017 && year <= 2022) {
            vehicleCounts['LT'] += parseInt(record['Lah. tov.  < 3,5t']) || 0;
        }
    });

    let chartData = [['Vehicle Type', 'Count']];
    for (let type in vehicleCounts) {
        chartData.push([type, vehicleCounts[type]]);
    }
    return chartData;
}

function drawColumnChart(data) {
    var dataTable = google.visualization.arrayToDataTable(data);

    var options = {
        'title':'Pet najbolj obremenjenih prometnih odsekov',
        colors: ['#109619'],

        titleTextStyle: {
            fontSize: 20
        }
    }

    var chart = new google.visualization.ColumnChart(document.getElementById('column-chart'));
    chart.draw(dataTable, options);
}

function drawGeoChart(cityTrafficCounts) {
    google.charts.load('current', {
        'packages': ['geochart'],
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
            region: 'SI',
            displayMode: 'regions',
            resolution: 'provinces',
            colorAxis: {colors: ['#e6f2ff', '#0000ff']},
            datalessRegionColor: 'ffffff'
        };
        var chart = new google.visualization.GeoChart(document.getElementById('geo-chart'));
        chart.draw(data, options);
    }
}

function drawPieChart(dataArray) {
    var dataTable = google.visualization.arrayToDataTable(dataArray);
    var options = {
        'title':'Prometna obremenitev glede na tip vozila',

        titleTextStyle: {
            fontSize: 20,
        }
    };
    var chart = new google.visualization.PieChart(document.getElementById('pie-chart'));
    chart.draw(dataTable, options);
}

function initMap() {
    const map = new google.maps.Map(document.getElementById('map'), {
        center: { lat: -34.397, lng: 150.644 },
        zoom: 8
    });
}

function drawCharts(columnChartData, geoChartData, pieChartData, tableData) {
    drawColumnChart(columnChartData);
    drawGeoChart(geoChartData);
    drawPieChart(pieChartData);

    updateTable(tableData);
}