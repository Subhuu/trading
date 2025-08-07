// 🚀 REAL Options Trading System - Live Market Data
// Fixed Version with ACTUAL market data integration

class RealTradingSystem {
    constructor() {
        // REAL market data structure
        this.marketData = {
            nifty_spot: 0,
            bank_nifty: 0,
            vix: 0,
            market_status: "UNKNOWN",
            is_market_open: false,
            last_update: null,
            data_source: "yahoo",
            api_errors: 0
        };
        
        // Real data tracking
        this.historicalData = [];
        this.realTimeUpdates = [];
        this.apiEndpoints = {
            yahoo: 'https://query1.finance.yahoo.com/v8/finance/chart/',
            marketStatus: 'https://query1.finance.yahoo.com/v1/finance/search'
        };
        
        // Settings
        this.settings = {
            updateInterval: 10000, // 10 seconds
            autoRefresh: true,
            dataSource: 'yahoo',
            apiKey: null
        };
        
        // System state
        this.isUpdating = false;
        this.chart = null;
        this.updateTimer = null;
        this.selectedSymbol = '^NSEI'; // NIFTY 50
        
        this.init();
    }
    
    init() {
        this.loadSettings();
        this.setupEventListeners();
        this.checkMarketStatus();
        this.initializeChart();
        this.startRealTimeUpdates();
        this.addSystemMessage('System initialized with real market data integration', 'success');
    }
    
    // REAL MARKET STATUS CHECK (Not fake!)
    checkMarketStatus() {
        const now = new Date();
        const istTime = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Kolkata"}));
        
        // NSE Market Hours: 9:15 AM to 3:30 PM (Mon-Fri)
        const day = istTime.getDay(); // 0 = Sunday, 6 = Saturday
        const hours = istTime.getHours();
        const minutes = istTime.getMinutes();
        const timeInMinutes = hours * 60 + minutes;
        
        // Market hours in minutes from midnight
        const marketOpen = 9 * 60 + 15; // 9:15 AM
        const marketClose = 15 * 60 + 30; // 3:30 PM
        
        let isMarketOpen = false;
        let marketStatusText = "CLOSED";
        
        // Check if it's a weekday (Monday = 1, Friday = 5)
        if (day >= 1 && day <= 5) {
            if (timeInMinutes >= marketOpen && timeInMinutes <= marketClose) {
                isMarketOpen = true;
                marketStatusText = "OPEN";
            } else if (timeInMinutes < marketOpen) {
                marketStatusText = "PRE-MARKET";
            } else {
                marketStatusText = "POST-MARKET";
            }
        } else {
            marketStatusText = "WEEKEND";
        }
        
        // Check for holidays (basic implementation)
        const holidays2024 = [
            '2024-01-26', '2024-03-08', '2024-03-25', '2024-04-11', 
            '2024-04-17', '2024-05-01', '2024-06-17', '2024-08-15',
            '2024-10-02', '2024-11-01', '2024-11-15', '2024-12-25'
        ];
        
        const todayString = istTime.toISOString().split('T')[0];
        if (holidays2024.includes(todayString)) {
            isMarketOpen = false;
            marketStatusText = "HOLIDAY";
        }
        
        this.marketData.is_market_open = isMarketOpen;
        this.marketData.market_status = marketStatusText;
        
        this.updateMarketStatusDisplay(marketStatusText, isMarketOpen, istTime);
        this.calculateTimeToMarket(istTime, isMarketOpen);
        
        this.addLiveEvent(`Market Status: ${marketStatusText}`);
        return { isOpen: isMarketOpen, status: marketStatusText, time: istTime };
    }
    
    updateMarketStatusDisplay(status, isOpen, istTime) {
        const marketStatusEl = document.getElementById('marketStatus');
        const marketStatusTextEl = document.getElementById('marketStatusText');
        const currentTimeEl = document.getElementById('currentTime');
        const detailedStatusEl = document.getElementById('detailedMarketStatus');
        const currentTimeDetailedEl = document.getElementById('currentTimeDetailed');
        
        if (marketStatusTextEl) marketStatusTextEl.textContent = status;
        if (currentTimeEl) currentTimeEl.textContent = istTime.toLocaleTimeString('en-IN');
        if (currentTimeDetailedEl) currentTimeDetailedEl.textContent = istTime.toLocaleString('en-IN');
        
        if (marketStatusEl) {
            marketStatusEl.className = `market-status ${isOpen ? 'open' : 'closed'}`;
        }
        
        if (detailedStatusEl) {
            let detailText = `Market is currently ${status}`;
            if (isOpen) {
                detailText += " - Live trading active";
            } else if (status === "PRE-MARKET") {
                detailText += " - Trading starts at 9:15 AM";
            } else if (status === "POST-MARKET") {
                detailText += " - Market closed at 3:30 PM";
            } else if (status === "WEEKEND") {
                detailText += " - Markets closed on weekends";
            } else if (status === "HOLIDAY") {
                detailText += " - Market holiday today";
            }
            detailedStatusEl.textContent = detailText;
        }
    }
    
    calculateTimeToMarket(currentTime, isOpen) {
        const timeToMarketEl = document.getElementById('timeToMarket');
        const nextMarketOpenEl = document.getElementById('nextMarketOpen');
        
        if (!timeToMarketEl || !nextMarketOpenEl) return;
        
        let nextOpen = new Date(currentTime);
        
        if (isOpen) {
            // Market is open - calculate time to close (3:30 PM)
            nextOpen.setHours(15, 30, 0, 0);
            const timeDiff = nextOpen - currentTime;
            
            if (timeDiff > 0) {
                const hours = Math.floor(timeDiff / (1000 * 60 * 60));
                const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
                timeToMarketEl.textContent = `${hours}h ${minutes}m to market close`;
            } else {
                timeToMarketEl.textContent = "Market closing soon";
            }
            nextMarketOpenEl.textContent = "Market is currently open";
        } else {
            // Market is closed - calculate time to next open
            const day = currentTime.getDay();
            
            if (day === 0) { // Sunday
                nextOpen.setDate(nextOpen.getDate() + 1); // Monday
            } else if (day === 6) { // Saturday
                nextOpen.setDate(nextOpen.getDate() + 2); // Monday
            } else if (currentTime.getHours() >= 15 && currentTime.getMinutes() >= 30) {
                nextOpen.setDate(nextOpen.getDate() + 1); // Next day
            }
            
            nextOpen.setHours(9, 15, 0, 0);
            
            const timeDiff = nextOpen - currentTime;
            const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
            
            let timeText = "";
            if (days > 0) timeText += `${days}d `;
            if (hours > 0) timeText += `${hours}h `;
            timeText += `${minutes}m`;
            
            timeToMarketEl.textContent = `${timeText} to market open`;
            nextMarketOpenEl.textContent = nextOpen.toLocaleString('en-IN', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        }
    }
    
    // REAL DATA FETCHING (Not fake!)
    async fetchRealMarketData(symbol = '^NSEI') {
        try {
            this.addLiveEvent(`Fetching real data for ${symbol}...`);
            
            // Use Yahoo Finance API (free, no key required)
            const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1m&range=1d`;
            
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.chart && data.chart.result && data.chart.result[0]) {
                const result = data.chart.result[0];
                const meta = result.meta;
                const quote = result.indicators.quote[0];
                
                // Extract REAL data
                const currentPrice = meta.regularMarketPrice || meta.previousClose;
                const change = (meta.regularMarketPrice || meta.previousClose) - meta.previousClose;
                const changePercent = ((change / meta.previousClose) * 100);
                
                const marketData = {
                    symbol: symbol,
                    currentPrice: currentPrice,
                    previousClose: meta.previousClose,
                    change: change,
                    changePercent: changePercent,
                    open: meta.regularMarketOpen || meta.previousClose,
                    high: meta.regularMarketDayHigh || meta.previousClose,
                    low: meta.regularMarketDayLow || meta.previousClose,
                    volume: meta.regularMarketVolume || 0,
                    timestamp: new Date(),
                    currency: meta.currency || 'INR'
                };
                
                this.updateDisplayWithRealData(marketData);
                this.marketData.last_update = new Date();
                this.addLiveEvent(`✅ Real data updated: ${currentPrice.toFixed(2)}`);
                
                // Update API status
                document.getElementById('yahooStatus').textContent = '🟢 Connected';
                document.getElementById('apiStatus').textContent = 'CONNECTED';
                
                return marketData;
                
            } else {
                throw new Error('Invalid data structure received');
            }
            
        } catch (error) {
            this.marketData.api_errors++;
            console.error('Error fetching real market data:', error);
            this.addSystemMessage(`API Error: ${error.message}`, 'error');
            this.addLiveEvent(`❌ API Error: ${error.message}`);
            
            // Update API status
            document.getElementById('yahooStatus').textContent = '🔴 Error';
            document.getElementById('apiStatus').textContent = 'ERROR';
            
            return null;
        }
    }
    
    updateDisplayWithRealData(data) {
        // Update main price display
        document.getElementById('currentPrice').textContent = 
            `₹${data.currentPrice.toFixed(2)}`;
        
        const changeEl = document.getElementById('priceChange');
        const changePercentEl = document.getElementById('priceChangePercent');
        
        if (changeEl) {
            changeEl.textContent = data.change >= 0 ? 
                `+₹${data.change.toFixed(2)}` : `₹${data.change.toFixed(2)}`;
            changeEl.className = data.change >= 0 ? 'change-value positive' : 'change-value negative';
        }
        
        if (changePercentEl) {
            changePercentEl.textContent = data.changePercent >= 0 ? 
                `(+${data.changePercent.toFixed(2)}%)` : `(${data.changePercent.toFixed(2)}%)`;
            changePercentEl.className = data.changePercent >= 0 ? 'change-percent positive' : 'change-percent negative';
        }
        
        // Update statistics
        document.getElementById('openPrice').textContent = `₹${data.open.toFixed(2)}`;
        document.getElementById('highPrice').textContent = `₹${data.high.toFixed(2)}`;
        document.getElementById('lowPrice').textContent = `₹${data.low.toFixed(2)}`;
        document.getElementById('prevClose').textContent = `₹${data.previousClose.toFixed(2)}`;
        document.getElementById('volume').textContent = this.formatVolume(data.volume);
        
        // Update header stats
        if (data.symbol === '^NSEI') {
            document.getElementById('niftyValue').textContent = data.currentPrice.toFixed(2);
            const niftyChangeEl = document.getElementById('niftyChange');
            niftyChangeEl.textContent = data.changePercent >= 0 ? 
                `+${data.changePercent.toFixed(2)}%` : `${data.changePercent.toFixed(2)}%`;
            niftyChangeEl.className = `stat-change ${data.changePercent >= 0 ? 'positive' : 'negative'}`;
        }
        
        // Update last update time
        const now = new Date().toLocaleTimeString('en-IN');
        document.getElementById('lastDataUpdate').textContent = now;
        document.getElementById('lastUpdate').textContent = now;
        document.getElementById('lastUpdateFooter').textContent = `Last update: ${now}`;
        
        // Update connection indicator
        document.getElementById('updateIndicator').textContent = '🟢 Live';
        document.getElementById('connectionStatus').textContent = '🟢 Connected';
    }
    
    // MULTIPLE SYMBOL SUPPORT
    async fetchMultipleSymbols() {
        const symbols = ['^NSEI', '^NSEBANK', '^INDIAVIX'];
        const promises = symbols.map(symbol => this.fetchRealMarketData(symbol));
        
        try {
            const results = await Promise.all(promises);
            
            results.forEach((data, index) => {
                if (data) {
                    const symbol = symbols[index];
                    if (symbol === '^NSEI') {
                        this.marketData.nifty_spot = data.currentPrice;
                    } else if (symbol === '^NSEBANK') {
                        this.marketData.bank_nifty = data.currentPrice;
                        document.getElementById('bankNiftyValue').textContent = data.currentPrice.toFixed(2);
                        const bankNiftyChangeEl = document.getElementById('bankNiftyChange');
                        bankNiftyChangeEl.textContent = data.changePercent >= 0 ? 
                            `+${data.changePercent.toFixed(2)}%` : `${data.changePercent.toFixed(2)}%`;
                        bankNiftyChangeEl.className = `stat-change ${data.changePercent >= 0 ? 'positive' : 'negative'}`;
                    } else if (symbol === '^INDIAVIX') {
                        this.marketData.vix = data.currentPrice;
                        document.getElementById('vixValue').textContent = data.currentPrice.toFixed(2);
                        const vixChangeEl = document.getElementById('vixChange');
                        vixChangeEl.textContent = data.changePercent >= 0 ? 
                            `+${data.changePercent.toFixed(2)}%` : `${data.changePercent.toFixed(2)}%`;
                        vixChangeEl.className = `stat-change ${data.changePercent >= 0 ? 'positive' : 'negative'}`;
                    }
                }
            });
            
        } catch (error) {
            this.addSystemMessage(`Error fetching multiple symbols: ${error.message}`, 'error');
        }
    }
    
    startRealTimeUpdates() {
        if (this.updateTimer) {
            clearInterval(this.updateTimer);
        }
        
        // Initial fetch
        this.fetchRealMarketData(this.selectedSymbol);
        
        if (this.settings.autoRefresh) {
            this.updateTimer = setInterval(() => {
                if (!this.isUpdating) {
                    this.isUpdating = true;
                    
                    // Check market status first
                    const marketStatus = this.checkMarketStatus();
                    
                    // Only fetch live data during market hours or show delayed data
                    this.fetchMultipleSymbols()
                        .then(() => {
                            this.isUpdating = false;
                        })
                        .catch(() => {
                            this.isUpdating = false;
                        });
                }
            }, this.settings.updateInterval);
            
            this.addSystemMessage(`Auto-refresh enabled (${this.settings.updateInterval/1000}s)`, 'success');
        }
    }
    
    setupEventListeners() {
        // Tab navigation
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
        });
        
        // Controls
        document.getElementById('refreshData')?.addEventListener('click', () => this.manualRefresh());
        document.getElementById('autoRefreshToggle')?.addEventListener('click', () => this.toggleAutoRefresh());
        document.getElementById('indexSelector')?.addEventListener('change', (e) => this.changeSymbol(e.target.value));
        document.getElementById('clearLogs')?.addEventListener('click', () => this.clearLiveEvents());
        document.getElementById('downloadData')?.addEventListener('click', () => this.downloadData());
        
        // Settings
        document.getElementById('updateInterval')?.addEventListener('change', (e) => {
            this.settings.updateInterval = parseInt(e.target.value) * 1000;
            this.startRealTimeUpdates();
        });
        
        document.getElementById('autoRefreshSetting')?.addEventListener('change', (e) => {
            this.settings.autoRefresh = e.target.checked;
            if (e.target.checked) {
                this.startRealTimeUpdates();
            } else {
                clearInterval(this.updateTimer);
            }
        });
    }
    
    manualRefresh() {
        this.addLiveEvent('Manual refresh triggered');
        this.checkMarketStatus();
        this.fetchMultipleSymbols();
    }
    
    toggleAutoRefresh() {
        this.settings.autoRefresh = !this.settings.autoRefresh;
        const toggleBtn = document.getElementById('autoRefreshToggle');
        
        if (this.settings.autoRefresh) {
            toggleBtn.textContent = '🔁 Auto: ON';
            toggleBtn.classList.add('active');
            this.startRealTimeUpdates();
        } else {
            toggleBtn.textContent = '🔁 Auto: OFF';
            toggleBtn.classList.remove('active');
            clearInterval(this.updateTimer);
        }
    }
    
    changeSymbol(symbol) {
        const symbolMap = {
            'NSEI': '^NSEI',
            'NSEBANK': '^NSEBANK',
            'NSEIT': '^CNXIT',
            'NIFTY_FIN_SERVICE.NS': 'NIFTY_FIN_SERVICE.NS'
        };
        
        this.selectedSymbol = symbolMap[symbol] || symbol;
        this.addLiveEvent(`Changed to ${symbol}`);
        this.fetchRealMarketData(this.selectedSymbol);
    }
    
    switchTab(tabName) {
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.remove('active');
        });
        
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        const targetTab = document.getElementById(`${tabName}-tab`);
        if (targetTab) {
            targetTab.classList.add('active');
        }
        
        const targetBtn = document.querySelector(`[data-tab="${tabName}"]`);
        if (targetBtn) {
            targetBtn.classList.add('active');
        }
    }
    
    initializeChart() {
        const ctx = document.getElementById('priceChart');
        if (!ctx) return;
        
        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Price',
                    data: [],
                    borderColor: '#00ff88',
                    backgroundColor: 'rgba(0, 255, 136, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { 
                        labels: { color: '#ffffff' } 
                    }
                },
                scales: {
                    x: { 
                        ticks: { color: '#cccccc' }, 
                        grid: { color: '#333333' } 
                    },
                    y: { 
                        ticks: { color: '#cccccc' }, 
                        grid: { color: '#333333' } 
                    }
                }
            }
        });
    }
    
    // Utility functions
    formatVolume(volume) {
        if (volume >= 10000000) {
            return (volume / 10000000).toFixed(1) + 'Cr';
        } else if (volume >= 100000) {
            return (volume / 100000).toFixed(1) + 'L';
        } else if (volume >= 1000) {
            return (volume / 1000).toFixed(1) + 'K';
        }
        return volume.toString();
    }
    
    addLiveEvent(message) {
        const eventsContainer = document.getElementById('liveEvents');
        if (!eventsContainer) return;
        
        const eventEl = document.createElement('div');
        eventEl.className = 'event-item';
        eventEl.innerHTML = `
            <span class="event-time">${new Date().toLocaleTimeString('en-IN')}</span>
            <span class="event-msg">${message}</span>
        `;
        
        eventsContainer.insertBefore(eventEl, eventsContainer.firstChild);
        
        // Keep only last 50 events
        while (eventsContainer.children.length > 50) {
            eventsContainer.removeChild(eventsContainer.lastChild);
        }
    }
    
    addSystemMessage(message, type = 'info') {
        const messagesContainer = document.getElementById('systemMessages');
        if (!messagesContainer) return;
        
        const messageEl = document.createElement('div');
        messageEl.className = `message ${type}`;
        messageEl.innerHTML = `<strong>${type.toUpperCase()}:</strong> ${message}`;
        
        messagesContainer.insertBefore(messageEl, messagesContainer.firstChild);
        
        // Auto remove after 10 seconds
        setTimeout(() => {
            if (messageEl.parentNode) {
                messageEl.parentNode.removeChild(messageEl);
            }
        }, 10000);
    }
    
    clearLiveEvents() {
        const eventsContainer = document.getElementById('liveEvents');
        if (eventsContainer) {
            eventsContainer.innerHTML = '<div class="event-item"><span class="event-time">--:--:--</span><span class="event-msg">Events cleared</span></div>';
        }
    }
    
    downloadData() {
        const data = {
            timestamp: new Date().toISOString(),
            market_data: this.marketData,
            settings: this.settings,
            system_info: {
                errors: this.marketData.api_errors,
                last_update: this.marketData.last_update,
                market_status: this.marketData.market_status
            }
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `market_data_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.addSystemMessage('Data exported successfully', 'success');
    }
    
    loadSettings() {
        const saved = localStorage.getItem('tradingSystemSettings');
        if (saved) {
            try {
                this.settings = { ...this.settings, ...JSON.parse(saved) };
            } catch (e) {
                console.warn('Failed to load settings:', e);
            }
        }
    }
    
    saveSettings() {
        localStorage.setItem('tradingSystemSettings', JSON.stringify(this.settings));
    }
    
    destroy() {
        if (this.updateTimer) {
            clearInterval(this.updateTimer);
        }
        if (this.chart) {
            this.chart.destroy();
        }
        this.saveSettings();
    }
}

// Initialize the REAL trading system
let realTradingSystem;

document.addEventListener('DOMContentLoaded', () => {
    realTradingSystem = new RealTradingSystem();
    
    // Add initial system messages
    setTimeout(() => {
        realTradingSystem.addSystemMessage('✅ Real market data integration active', 'success');
        realTradingSystem.addSystemMessage('📡 Using Yahoo Finance API for live data', 'info');
        realTradingSystem.addSystemMessage('⏰ Market hours: 9:15 AM - 3:30 PM IST (Mon-Fri)', 'info');
    }, 1000);
});

window.addEventListener('beforeunload', () => {
    if (realTradingSystem) {
        realTradingSystem.destroy();
    }
});

// Export for global access
window.realTradingSystem = realTradingSystem;