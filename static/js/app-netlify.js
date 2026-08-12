class AppManager {
    constructor() {
        this.physics = new PhysicsCalculator();
        this.debounceTimers = {};
        this.init();
    }

    init() {
        this.setupTabNavigation();
        this.setupDarkMode();
        this.setupExport();
        this.setupKeyboardShortcuts();
        this.loadURLParameters();
        console.log('타이탄 우주선박 시뮬레이터 (Netlify) 초기화 완료');
    }

    setupTabNavigation() {
        const tabButtons = document.querySelectorAll('[data-bs-toggle="pill"]');
        tabButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const targetTab = e.target.getAttribute('data-bs-target').substring(1);
                this.updateURLParameters({ tab: targetTab });
            });
        });
    }

    setupDarkMode() {
        const toggle = document.getElementById('darkModeToggle');
        const icon = document.getElementById('darkModeIcon');

        const savedMode = localStorage.getItem('darkMode');
        if (savedMode === 'true') {
            document.body.classList.add('dark-mode');
            icon.className = 'fas fa-sun';
        }

        toggle.addEventListener('click', () => {
            const isDarkMode = document.body.classList.toggle('dark-mode');
            icon.className = isDarkMode ? 'fas fa-sun' : 'fas fa-moon';
            localStorage.setItem('darkMode', isDarkMode);

            if (window.buoyancyModule && window.buoyancyModule.refresh) {
                window.buoyancyModule.refresh();
            }
            if (window.materialsModule && window.materialsModule.refresh) {
                window.materialsModule.refresh();
            }
            if (window.environmentModule && window.environmentModule.refresh) {
                window.environmentModule.refresh();
            }
        });
    }

    setupExport() {
        const exportBtn = document.getElementById('exportBtn');
        exportBtn.addEventListener('click', () => {
            this.exportData();
        });
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case 'd':
                        e.preventDefault();
                        document.getElementById('darkModeToggle').click();
                        break;
                    case 'e':
                        e.preventDefault();
                        document.getElementById('exportBtn').click();
                        break;
                }
            }

            if (e.key === 'Tab' && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
                const activeTab = document.querySelector('.nav-link.active');
                const allTabs = document.querySelectorAll('.nav-link');
                const currentIndex = Array.from(allTabs).indexOf(activeTab);
                const nextIndex = (currentIndex + 1) % allTabs.length;

                if (nextIndex !== currentIndex) {
                    e.preventDefault();
                    allTabs[nextIndex].click();
                }
            }
        });
    }

    loadURLParameters() {
        const urlParams = new URLSearchParams(window.location.search);

        const tab = urlParams.get('tab');
        if (tab) {
            const tabButton = document.querySelector(`[data-bs-target="#${tab}"]`);
            if (tabButton) {
                tabButton.click();
            }
        }

        const params = ['shipLength', 'shipWidth', 'shipHeight', 'waveHeight', 'temperature'];
        params.forEach(param => {
            const value = urlParams.get(param);
            const slider = document.getElementById(param);
            if (value && slider) {
                slider.value = value;
                slider.dispatchEvent(new Event('input'));
            }
        });
    }

    updateURLParameters(additionalParams = {}) {
        const params = new URLSearchParams();

        const sliders = ['shipLength', 'shipWidth', 'shipHeight', 'waveHeight', 'temperature'];
        sliders.forEach(sliderId => {
            const slider = document.getElementById(sliderId);
            if (slider) {
                params.set(sliderId, slider.value);
            }
        });

        const activeTab = document.querySelector('.nav-link.active');
        if (activeTab) {
            const tabTarget = activeTab.getAttribute('data-bs-target');
            if (tabTarget) {
                params.set('tab', tabTarget.substring(1));
            }
        }

        Object.entries(additionalParams).forEach(([key, value]) => {
            params.set(key, value);
        });

        const newUrl = `${window.location.pathname}?${params.toString()}`;
        window.history.replaceState({}, '', newUrl);
    }

    debounce(key, callback, delay = 300) {
        if (this.debounceTimers[key]) {
            clearTimeout(this.debounceTimers[key]);
        }
        this.debounceTimers[key] = setTimeout(callback, delay);
    }

    formatNumber(value, decimals = 2) {
        if (typeof value !== 'number' || isNaN(value)) {
            return '0';
        }
        return new Intl.NumberFormat('ko-KR', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        }).format(value);
    }

    async apiCall(endpoint, data = null, method = 'GET') {
        try {
            if (endpoint === '/api/environment') {
                return this.physics.getEnvironmentData();
            } else if (endpoint === '/api/buoyancy' && method === 'POST') {
                return this.physics.calculateBuoyancy(data.length, data.width, data.height);
            } else if (endpoint === '/api/waves' && method === 'POST') {
                return this.physics.calculateWaves(data.wave_height);
            } else if (endpoint === '/api/materials' && method === 'POST') {
                return this.physics.calculateMaterials(data.temperature);
            }

            throw new Error('Unknown API endpoint');
        } catch (error) {
            console.error('API 호출 실패:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    exportData() {
        const exportData = {
            timestamp: new Date().toISOString(),
            parameters: {},
            results: {}
        };

        const sliders = ['shipLength', 'shipWidth', 'shipHeight', 'waveHeight', 'temperature'];
        sliders.forEach(sliderId => {
            const slider = document.getElementById(sliderId);
            if (slider) {
                exportData.parameters[sliderId] = parseFloat(slider.value);
            }
        });

        if (window.buoyancyModule && window.buoyancyModule.currentData) {
            exportData.results.buoyancy = window.buoyancyModule.currentData;
        }
        if (window.wavesModule && window.wavesModule.currentData) {
            exportData.results.waves = window.wavesModule.currentData;
        }
        if (window.materialsModule && window.materialsModule.currentData) {
            exportData.results.materials = window.materialsModule.currentData;
        }
        if (window.environmentModule && window.environmentModule.currentData) {
            exportData.results.environment = window.environmentModule.currentData;
        }

        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);

        const link = document.createElement('a');
        link.href = url;
        link.download = `titan-ship-simulator-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        console.log('데이터 내보내기 완료');
    }
}

window.app = new AppManager();