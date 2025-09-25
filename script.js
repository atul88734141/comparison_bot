// DOM Elements
const statusElement = document.getElementById('status');
const binanceCountElement = document.getElementById('binance-count');
const deltaCountElement = document.getElementById('delta-count');
const comparisonTableBody = document.querySelector('#comparison-table tbody');
const positiveTableBody = document.querySelector('#positive-table tbody');
const negativeTableBody = document.querySelector('#negative-table tbody');
const binanceTableBody = document.querySelector('#binance-table tbody');
const deltaTableBody = document.querySelector('#delta-table tbody');
const summaryStatsElement = document.getElementById('summary-stats');
const refreshButton = document.getElementById('refresh-btn');
const lastUpdatedElement = document.getElementById('last-updated');
const tabButtons = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');
const loadingContainer = document.getElementById('loading-container');
const loadingBar = document.getElementById('loading-bar');

// API URLs
const BINANCE_API_URL = 'https://fapi.binance.com/fapi/v1/premiumIndex';
const DELTA_API_URL = 'https://api.india.delta.exchange/v2/tickers?contract_types=perpetual_futures';

// Format time with countdown
function formatTimeWithCountdown(targetTime) {
    if (!targetTime) return 'N/A';
    
    // Format time in 12-hour format with AM/PM using user's local timezone
    let timeStr = targetTime.toLocaleTimeString(undefined, {
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
    });
    
    // Create a span with data attribute for live updating
    const timestamp = targetTime.getTime();
    return `${timeStr} (<span class="live-countdown" data-target-time="${timestamp}"></span>)`;
}


// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    setupTabNavigation();
    refreshData();
    refreshButton.addEventListener('click', refreshData);
    
    // Start the live countdown timer
    startLiveCountdown();
});

// Update all countdown timers on the page
function startLiveCountdown() {
    // Update immediately
    updateAllCountdowns();
    
    // Then update every second
    setInterval(updateAllCountdowns, 1000);
}

// Update all countdown elements
function updateAllCountdowns() {
    const countdownElements = document.querySelectorAll('.live-countdown');
    
    countdownElements.forEach(element => {
        const targetTime = parseInt(element.getAttribute('data-target-time'));
        if (!targetTime) return;
        
        const now = new Date();
        const targetDate = new Date(targetTime);
        
        // Calculate time difference in seconds
        const delta = Math.max(0, Math.floor((targetDate - now) / 1000));
        
        // Calculate hours and minutes
        const hours = Math.floor(delta / 3600);
        const minutes = Math.floor((delta % 3600) / 60);
        
        // Format countdown - only show hours if > 0
        const countdown = hours > 0 ? 
            `${hours}h ${minutes.toString().padStart(2, '0')}m` : 
            `${minutes}m`;
        
        // Update the element
        element.textContent = countdown;
    });
}

// Setup tab navigation
function setupTabNavigation() {
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all buttons and contents
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Add active class to clicked button and corresponding content
            button.classList.add('active');
            const tabId = button.getAttribute('data-tab');
            document.getElementById(tabId).classList.add('active');
        });
    });
}

// Refresh data from both exchanges
async function refreshData() {
    updateStatus('loading', 'Loading data from exchanges...');
    clearTables();
    
    // Show loading container and reset loading bar
    loadingContainer.classList.add('active');
    
    try {
        // Simulate progress for loading bar
        const progressInterval = simulateProgress();
        
        // Fetch data from both exchanges in parallel
        const [binanceData, deltaData] = await Promise.all([
            fetchBinanceFunding(),
            fetchDeltaExchangeFunding()
        ]);
        
        // Clear the progress interval
        clearInterval(progressInterval);
        
        // Complete the loading bar
        loadingBar.style.width = '100%';
        setTimeout(() => {
            // Hide loading container after a short delay
            loadingContainer.classList.remove('active');
            loadingBar.style.width = '0%';
        }, 500);
        
        // Update exchange counts
        binanceCountElement.textContent = `Binance: ${Object.keys(binanceData).length}`;
        deltaCountElement.textContent = `Delta: ${Object.keys(deltaData).length}`;
        
        // Check if we have data from both exchanges
        if (Object.keys(binanceData).length === 0 || Object.keys(deltaData).length === 0) {
            let errorMessage = 'Could not fetch data from ';
            if (Object.keys(binanceData).length === 0 && Object.keys(deltaData).length === 0) {
                errorMessage += 'both exchanges';
            } else if (Object.keys(binanceData).length === 0) {
                errorMessage += 'Binance';
            } else {
                errorMessage += 'Delta Exchange';
            }
            updateStatus('error', `❌ Error: ${errorMessage}`);
            loadingContainer.classList.remove('active');
            return;
        }
        
        // Process and display data
        const comparisonData = createComparisonData(binanceData, deltaData);
        displayComparisonData(comparisonData);
        displayIndividualExchangeData(binanceData, deltaData);
        
        // Update status and last updated time
        updateStatus('success', '✅ Data loaded successfully!');
        updateLastUpdated();
        
    } catch (error) {
        console.error('Error fetching data:', error);
        updateStatus('error', `❌ Error: ${error.message || 'Failed to fetch data'}`);
        loadingContainer.classList.remove('active');
    }
}

// Simulate progress for loading bar
function simulateProgress() {
    let progress = 0;
    const interval = setInterval(() => {
        progress += Math.random() * 15;
        if (progress > 70) {
            progress = 70; // Cap at 70% until actual data is loaded
        }
        loadingBar.style.width = `${progress}%`;
    }, 500);
    return interval;
}

// Fetch Binance funding rates with next funding times
async function fetchBinanceFunding() {
    try {
        const response = await fetch(BINANCE_API_URL);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const data = await response.json();
        const fundingData = {};
        
        for (const contract of data) {
            if ((contract.symbol.endsWith('USDT') || contract.symbol.endsWith('BUSD')) && 'lastFundingRate' in contract) {
                const symbol = contract.symbol;
                const rate = parseFloat(contract.lastFundingRate);
                
                // Get next funding time (in milliseconds UTC)
                let nextFundingTime = null;
                if (contract.nextFundingTime) {
                    // Use the timestamp directly - browser will handle timezone conversion
                    nextFundingTime = new Date(parseInt(contract.nextFundingTime));
                } else {
                    // Fallback: ~8 hours from now
                    nextFundingTime = new Date(Date.now() + (8 * 60 * 60 * 1000));
                }
                
                fundingData[symbol] = {
                    rate: rate,
                    nextTime: nextFundingTime
                };
            }
        }
        
        return fundingData;
    } catch (error) {
        console.error('Error fetching Binance data:', error);
        return {};
    }
}

// Fetch Delta Exchange funding rates with next funding times
async function fetchDeltaExchangeFunding() {
    try {
        // Use a CORS proxy for Delta Exchange API if needed
        // const proxyUrl = 'https://cors-anywhere.herokuapp.com/';
        // const response = await fetch(proxyUrl + DELTA_API_URL);
        
        // For GitHub Pages deployment, we'll use a CORS proxy
        // In production, you should set up your own proxy or use a backend service
        const proxyUrl = 'https://api.allorigins.win/raw?url=';
        // const response = await fetch(proxyUrl + encodeURIComponent(DELTA_API_URL));
        const response = await fetch(DELTA_API_URL);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const jsonData = await response.json();
        const fundingData = {};
        
        // Get next Delta funding time (IST schedule: 05:30, 13:30, 21:30)
        const nextDeltaFundingTime = getNextDeltaFundingTime();
        
        for (const item of jsonData.result) {
            if (item.symbol && item.funding_rate !== undefined) {
                fundingData[item.symbol] = {
                    rate: parseFloat(item.funding_rate),
                    nextTime: nextDeltaFundingTime
                };
            }
        }
        
        return fundingData;
    } catch (error) {
        console.error('Error fetching Delta Exchange data:', error);
        return {};
    }
}

// Calculate next Delta funding time (UTC schedule: 00:00, 08:00, 16:00)
function getNextDeltaFundingTime() {
    // Current time in UTC
    const now = new Date();
    
    // Create today's schedule points in UTC
    const today = new Date(now);
    today.setUTCHours(0, 0, 0, 0); // Reset to start of day in UTC
    
    const schedule = [
        new Date(today.getTime() + (0 * 60 * 60 * 1000)),  // 00:00 UTC
        new Date(today.getTime() + (8 * 60 * 60 * 1000)),  // 08:00 UTC
        new Date(today.getTime() + (16 * 60 * 60 * 1000))  // 16:00 UTC
    ];
    
    // Find next occurrence
    for (const time of schedule) {
        if (time > now) {
            return time;
        }
    }
    
    // If no times left today, return first time tomorrow
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return new Date(tomorrow.getTime()); // 00:00 UTC tomorrow
}

// Create comparison data between exchanges
function createComparisonData(binanceData, deltaData) {
    // Extract base symbols for matching
    function getBaseSymbol(symbol, exchange) {
        if (exchange === 'binance') {
            return symbol.replace('USDT', '').replace('BUSD', '');
        } else { // delta
            return symbol.replace('USDT', '').replace('USD', '');
        }
    }
    
    // Create mapping with next funding times
    const binanceBaseMap = {};
    for (const [sym, data] of Object.entries(binanceData)) {
        const baseSymbol = getBaseSymbol(sym, 'binance');
        binanceBaseMap[baseSymbol] = [sym, data.rate, data.nextTime];
    }
    
    const deltaBaseMap = {};
    for (const [sym, data] of Object.entries(deltaData)) {
        const baseSymbol = getBaseSymbol(sym, 'delta');
        deltaBaseMap[baseSymbol] = [sym, data.rate, data.nextTime];
    }
    
    // Get common symbols
    const binanceSymbols = Object.keys(binanceBaseMap);
    const deltaSymbols = Object.keys(deltaBaseMap);
    const commonSymbols = binanceSymbols.filter(symbol => deltaSymbols.includes(symbol)).sort();
    
    // Create comparison data
    const comparisonData = [];
    for (const baseSymbol of commonSymbols) {
        const [binanceSymbol, binanceRate, binanceNextTime] = binanceBaseMap[baseSymbol];
        const [deltaSymbol, deltaRate, deltaNextTime] = deltaBaseMap[baseSymbol];
        
        // Calculate difference (matching Python script logic)
        const difference = deltaRate - (binanceRate * 100);
        
        comparisonData.push({
            symbol: baseSymbol,
            binanceRate: binanceRate * 100, // Convert to percentage
            deltaRate: deltaRate,
            difference: difference,
            binanceSymbol: binanceSymbol,
            deltaSymbol: deltaSymbol,
            binanceNextTime: binanceNextTime,
            deltaNextTime: deltaNextTime
        });
    }
    
    // Sort by difference (descending)
    comparisonData.sort((a, b) => b.difference - a.difference);
    
    return comparisonData;
}

// Display comparison data in tables
function displayComparisonData(comparisonData) {
    if (comparisonData.length === 0) {
        updateStatus('error', '❌ No common symbols found between exchanges!');
        return;
    }
    
    // Clear tables
    comparisonTableBody.innerHTML = '';
    positiveTableBody.innerHTML = '';
    negativeTableBody.innerHTML = '';
    
    // Populate main comparison table
    for (const item of comparisonData) {
        const row = document.createElement('tr');
        
        // Determine if arbitrage opportunity exists
        const isArbitrage = Math.abs(item.difference) > 0.01;
        const arbitrageIcon = isArbitrage ? '💰' : '➡️';
        
        // Format rates with proper sign and decimals
        const binanceRateFormatted = formatRate(item.binanceRate);
        const deltaRateFormatted = formatRate(item.deltaRate);
        const differenceFormatted = formatRate(item.difference);
        
        // Format next funding times
        const binanceNextFormatted = formatTimeWithCountdown(item.binanceNextTime);
        const deltaNextFormatted = formatTimeWithCountdown(item.deltaNextTime);
        
        // Create row content
        row.innerHTML = `
            <td>${item.symbol}</td>
            <td class="${getRateClass(item.binanceRate)}">${binanceRateFormatted}</td>
            <td class="${getRateClass(item.deltaRate)}">${deltaRateFormatted}</td>
            <td class="${getRateClass(item.difference)}">${differenceFormatted}</td>
            <td class="funding-time">${binanceNextFormatted}</td>
            <td class="funding-time">${deltaNextFormatted}</td>
            <td><span class="arbitrage-icon">${arbitrageIcon}</span></td>
        `;
        
        comparisonTableBody.appendChild(row);
    }
    
    // Populate top positive differences table (first 5 items)
    const positiveItems = comparisonData.slice(0, 5);
    for (const item of positiveItems) {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.symbol}</td>
            <td class="${getRateClass(item.binanceRate)}">${formatRate(item.binanceRate)}</td>
            <td class="${getRateClass(item.deltaRate)}">${formatRate(item.deltaRate)}</td>
            <td class="${getRateClass(item.difference)}">${formatRate(item.difference)}</td>
        `;
        positiveTableBody.appendChild(row);
    }
    
    // Populate top negative differences table (last 5 items)
    const negativeItems = comparisonData.slice(-5).reverse();
    for (const item of negativeItems) {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.symbol}</td>
            <td class="${getRateClass(item.binanceRate)}">${formatRate(item.binanceRate)}</td>
            <td class="${getRateClass(item.deltaRate)}">${formatRate(item.deltaRate)}</td>
            <td class="${getRateClass(item.difference)}">${formatRate(item.difference)}</td>
        `;
        negativeTableBody.appendChild(row);
    }
    
    // Display summary statistics
    displaySummaryStats(comparisonData);
}

// Display individual exchange data
function displayIndividualExchangeData(binanceData, deltaData) {
    // Clear tables
    binanceTableBody.innerHTML = '';
    deltaTableBody.innerHTML = '';
    
    // Sort Binance data by rate (descending)
    const binanceSorted = Object.entries(binanceData)
        .sort((a, b) => b[1].rate - a[1].rate);
    
    // Populate Binance table
    for (const [symbol, data] of binanceSorted) {
        const row = document.createElement('tr');
        const nextTimeFormatted = formatTimeWithCountdown(data.nextTime);
        row.innerHTML = `
            <td>${symbol}</td>
            <td class="${getRateClass(data.rate * 100)}">${formatRate(data.rate * 100)}</td>
            <td class="funding-time">${nextTimeFormatted}</td>
        `;
        binanceTableBody.appendChild(row);
    }
    
    // Sort Delta data by rate (descending)
    const deltaSorted = Object.entries(deltaData)
        .sort((a, b) => b[1].rate - a[1].rate);
    
    // Populate Delta table
    for (const [symbol, data] of deltaSorted) {
        const row = document.createElement('tr');
        const nextTimeFormatted = formatTimeWithCountdown(data.nextTime);
        row.innerHTML = `
            <td>${symbol}</td>
            <td class="${getRateClass(data.rate)}">${formatRate(data.rate)}</td>
            <td class="funding-time">${nextTimeFormatted}</td>
        `;
        deltaTableBody.appendChild(row);
    }
}

// Display summary statistics
function displaySummaryStats(comparisonData) {
    if (comparisonData.length === 0) return;
    
    // Calculate statistics
    const differences = comparisonData.map(item => item.difference);
    const avgDiff = differences.reduce((sum, diff) => sum + diff, 0) / differences.length;
    const maxDiff = Math.max(...differences);
    const minDiff = Math.min(...differences);
    const arbitrageCount = differences.filter(diff => Math.abs(diff) > 0.01).length;
    
    // Create summary HTML
    summaryStatsElement.innerHTML = `
        <div class="stat-item">
            <div class="stat-label">Common Assets</div>
            <div class="stat-value">${comparisonData.length}</div>
        </div>
        <div class="stat-item">
            <div class="stat-label">Average Difference</div>
            <div class="stat-value ${getRateClass(avgDiff)}">${formatRate(avgDiff)}</div>
        </div>
        <div class="stat-item">
            <div class="stat-label">Max Difference</div>
            <div class="stat-value ${getRateClass(maxDiff)}">${formatRate(maxDiff)}</div>
        </div>
        <div class="stat-item">
            <div class="stat-label">Min Difference</div>
            <div class="stat-value ${getRateClass(minDiff)}">${formatRate(minDiff)}</div>
        </div>
        <div class="stat-item">
            <div class="stat-label">Arbitrage Opportunities</div>
            <div class="stat-value">${arbitrageCount} assets</div>
        </div>
    `;
}

// Helper function to format rate with sign and decimals
function formatRate(rate) {
    return `${rate >= 0 ? '+' : ''}${rate.toFixed(6)}%`;
}

// Helper function to get CSS class based on rate value
function getRateClass(rate) {
    if (rate > 0) return 'positive';
    if (rate < 0) return 'negative';
    return 'neutral';
}

// Update status message and style
function updateStatus(type, message) {
    statusElement.className = `status ${type}`;
    statusElement.innerHTML = message;
}

// Update last updated timestamp
function updateLastUpdated() {
    const now = new Date();
    const formattedDate = now.toLocaleString();
    lastUpdatedElement.textContent = `Last updated: ${formattedDate}`;
}

// Clear all tables
function clearTables() {
    comparisonTableBody.innerHTML = '';
    positiveTableBody.innerHTML = '';
    negativeTableBody.innerHTML = '';
    binanceTableBody.innerHTML = '';
    deltaTableBody.innerHTML = '';
    summaryStatsElement.innerHTML = '';
}
