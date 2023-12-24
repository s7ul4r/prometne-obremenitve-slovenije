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

            console.log('Row Fecthed: ', apiResponse);

            // Check if the expected data is present in the response
            if (apiResponse && apiResponse.result && apiResponse.result.records) {
                for (const record of apiResponse.result.records) {
                    let emptyStringCount = 0;

                    // Check each property of the record
                    for (const key in record) {
                        if (record[key] === '') {
                            emptyStringCount++;
                            // Break the loop if three empty strings are found
                            if (emptyStringCount === 3) {
                                keepFetching = false;
                                break;
                            }
                        }
                    }

                    // If not breaking, add the record to allData
                    if (keepFetching) {
                        allData.push(record);
                    } else {
                        break; // Break out of the records loop if three empty strings are found
                    }
                }

                

                // Update the offset if keepFetching is still true
                if (keepFetching) {
                    offset += apiResponse.result.records.length;
                }
            } else {
                console.log('Unexpected API response:', apiResponse);
                keepFetching = false;
            }

            
        }
        console.log(allData);


        // Process and display the data as before
        
        const columnChartData = processDataForColumnChart(allData);
        const geoChartData = processDataForGeoChart(allData);
        const pieChartData = processDataForPieChart(allData);

        // Call drawCharts function with both data sets
        google.charts.setOnLoadCallback(() => drawCharts(columnChartData, geoChartData, pieChartData));

    } catch (error) {
        console.error('Failed to fetch data:', error);
        keepFetching = false;
    }
}