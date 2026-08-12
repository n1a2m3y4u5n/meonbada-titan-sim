class BuoyancyModule {
    constructor() {
        this.chart = null;
        this.currentData = null;
        this.init();
    }

    init() {
        this.setupSliders();
        this.setupChart();
        this.updateCalculation();
        console.log('부력 계산기 모듈 초기화 완료');
    }

    setupSliders() {
        const sliders = [
            { id: 'shipLength', valueId: 'lengthValue', unit: 'm' },
            { id: 'shipWidth', valueId: 'widthValue', unit: 'm' },
            { id: 'shipHeight', valueId: 'heightValue', unit: 'm' }
        ];

        sliders.forEach(({ id, valueId, unit }) => {
            const slider = document.getElementById(id);
            const valueDisplay = document.getElementById(valueId);

            if (slider && valueDisplay) {
                valueDisplay.textContent = `${slider.value}${unit}`;

                slider.addEventListener('input', (e) => {
                    valueDisplay.textContent = `${e.target.value}${unit}`;

                    if (window.app) {
                        window.app.debounce('buoyancy-calculation', () => {
                            this.updateCalculation();
                        }, 150);
                    }

                    if (window.app) {
                        window.app.updateURLParameters();
                    }
                });

                slider.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') {
                        this.updateCalculation();
                    }
                });
            }
        });
    }

    setupChart() {
        const ctx = document.getElementById('buoyancyChart');
        if (!ctx) return;

        const volumes = Array.from({ length: 41 }, (_, i) => (i + 1) * 1000); // 1000m³ ~ 41,000m³
        const earthBuoyancies = volumes.map(v => v * 9800);
        const titanBuoyancies = volumes.map(v => v * 593.6);

        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                datasets: [
                    {
                        label: '지구 부력',
                        data: volumes.map((v, i) => ({ x: v, y: earthBuoyancies[i] })),
                        borderColor: '#3B82F6',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        borderWidth: 3,
                        fill: false,
                        tension: 0.2,
                        pointRadius: 4,
                        pointHoverRadius: 6,
                        pointBackgroundColor: '#3B82F6',
                        pointBorderColor: '#ffffff',
                        pointBorderWidth: 2
                    },
                    {
                        label: '타이탄 부력',
                        data: volumes.map((v, i) => ({ x: v, y: titanBuoyancies[i] })),
                        borderColor: '#FF8C42',
                        backgroundColor: 'rgba(255, 140, 66, 0.1)',
                        borderWidth: 3,
                        fill: false,
                        tension: 0.2,
                        pointRadius: 4,
                        pointHoverRadius: 6,
                        pointBackgroundColor: '#FF8C42',
                        pointBorderColor: '#ffffff',
                        pointBorderWidth: 2
                    },
                    {
                        label: '현재 선박 (지구)',
                        data: [],
                        borderColor: '#10B981',
                        backgroundColor: '#10B981',
                        borderWidth: 3,
                        pointRadius: 8,
                        pointHoverRadius: 10,
                        pointStyle: 'circle',
                        showLine: false,
                        pointBorderColor: '#ffffff',
                        pointBorderWidth: 2
                    },
                    {
                        label: '현재 선박 (타이탄)',
                        data: [],
                        borderColor: '#DC3545',
                        backgroundColor: '#DC3545',
                        borderWidth: 3,
                        pointRadius: 8,
                        pointHoverRadius: 10,
                        pointStyle: 'triangle',
                        showLine: false,
                        pointBorderColor: '#ffffff',
                        pointBorderWidth: 2
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: '선박 부피에 따른 부력 변화',
                        font: {
                            size: 16,
                            weight: 'bold'
                        },
                        color: '#1E3A8A'
                    },
                    legend: {
                        position: 'top',
                        labels: {
                            usePointStyle: true,
                            padding: 20,
                            font: {
                                size: 12
                            }
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: '#fff',
                        bodyColor: '#fff',
                        borderColor: '#FF8C42',
                        borderWidth: 1,
                        cornerRadius: 6,
                        callbacks: {
                            title: function(context) {
                                const volume = context[0].parsed.x;
                                if (context[0].datasetIndex >= 2) {
                                    return '현재 선박 설계';
                                }
                                return `부피: ${window.app.formatNumber(volume, 0)} m³`;
                            },
                            label: function(context) {
                                const value = context.parsed.y;
                                const volume = context.parsed.x;
                                let label = context.dataset.label;

                                if (context.datasetIndex >= 2) {
                                    return [
                                        `부피: ${window.app.formatNumber(volume, 0)} m³`,
                                        `${label}: ${window.app.formatNumber(value/1000, 1)} kN`
                                    ];
                                }

                                return `${label}: ${window.app.formatNumber(value/1000, 1)} kN`;
                            },
                            afterLabel: function(context) {
                                if (context.datasetIndex < 2) {
                                    const volume = context.parsed.x;
                                    const earthBuoyancy = volume * 9800;
                                    const titanBuoyancy = volume * 593.6;
                                    const ratio = earthBuoyancy / titanBuoyancy;
                                    return `비율: 지구가 ${ratio.toFixed(1)}배 높음`;
                                }
                                return '';
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        type: 'linear',
                        position: 'bottom',
                        title: {
                            display: true,
                            text: '선박 부피 (m³)',
                            font: {
                                size: 12,
                                weight: 'bold'
                            }
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        },
                        ticks: {
                            font: {
                                size: 11
                            },
                            callback: function(value) {
                                return (value/1000).toFixed(0) + 'k';
                            }
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: '부력 (kN)',
                            font: {
                                size: 12,
                                weight: 'bold'
                            }
                        },
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        },
                        ticks: {
                            font: {
                                size: 11
                            },
                            callback: function(value) {
                                return (value/1000).toFixed(0) + 'k';
                            }
                        }
                    }
                },
                animation: {
                    duration: 1000,
                    easing: 'easeOutQuart'
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                }
            }
        });
    }

    async updateCalculation() {
        const lengthSlider = document.getElementById('shipLength');
        const widthSlider = document.getElementById('shipWidth');
        const heightSlider = document.getElementById('shipHeight');

        if (!lengthSlider || !widthSlider || !heightSlider) return;

        const length = parseFloat(lengthSlider.value);
        const width = parseFloat(widthSlider.value);
        const height = parseFloat(heightSlider.value);

        try {
            this.showLoading();

            const response = await window.app.apiCall('/api/buoyancy', {
                length: length,
                width: width,
                height: height
            }, 'POST');

            if (response.success) {
                this.currentData = response.data;
                this.displayResults(response.data);
                this.updateChart(response.data);
            } else {
                this.showError(response.error || '계산 중 오류가 발생했습니다.');
            }

        } catch (error) {
            console.error('부력 계산 실패:', error);
            this.showError('서버와의 통신 중 오류가 발생했습니다.');
        }
    }

    displayResults(data) {
        const resultsContainer = document.getElementById('buoyancyResults');
        const explanationContainer = document.getElementById('buoyancyExplanation');

        if (!resultsContainer || !explanationContainer) return;

        resultsContainer.innerHTML = `
            <div class="result-item">
                <div class="result-label">선박 부피</div>
                <div class="result-value">${window.app.formatNumber(data.volume, 0)} m³</div>
            </div>

            <div class="result-item">
                <div class="result-label">지구에서의 부력</div>
                <div class="result-value text-earth">${window.app.formatNumber(data.earth_buoyancy/1000)} kN</div>
            </div>

            <div class="result-item">
                <div class="result-label">타이탄에서의 부력</div>
                <div class="result-value text-titan">${window.app.formatNumber(data.titan_buoyancy/1000)} kN</div>
            </div>

            <div class="result-item bg-warning bg-opacity-10">
                <div class="result-label">부력 비율 (지구/타이탄)</div>
                <div class="result-value text-warning">${window.app.formatNumber(data.buoyancy_ratio, 1)}배</div>
            </div>

            <div class="result-item bg-danger bg-opacity-10">
                <div class="result-label">필요 배수량 증가</div>
                <div class="result-value text-danger">${window.app.formatNumber(data.required_displacement_multiplier, 1)}배</div>
            </div>

            <div class="result-item bg-info bg-opacity-10">
                <div class="result-label">타이탄 필요 부피</div>
                <div class="result-value text-info">${window.app.formatNumber(data.titan_required_volume)} m³</div>
            </div>
        `;

        if (data.explanation) {
            explanationContainer.innerHTML = `
                <div class="mb-3">
                    <h6 class="text-primary">
                        <i class="fas fa-question-circle me-2"></i>왜 중요한가?
                    </h6>
                    <p class="small mb-2">${data.explanation.why_important}</p>

                    <div class="alert alert-warning py-2">
                        <strong>타이탄에서의 도전:</strong><br>
                        ${data.explanation.titan_challenge}
                    </div>

                    <div class="alert alert-info py-2 mb-0">
                        <strong>설계 권장사항:</strong><br>
                        ${data.explanation.design_recommendation}
                    </div>
                </div>

                <div class="card bg-light">
                    <div class="card-body p-2">
                        <h6 class="mb-2">계산 공식</h6>
                        <div class="small font-monospace">
                            F = ρ × g × V<br>
                            <span class="text-muted">F: 부력 (N)</span><br>
                            <span class="text-muted">ρ: 유체밀도 (kg/m³)</span><br>
                            <span class="text-muted">g: 중력가속도 (m/s²)</span><br>
                            <span class="text-muted">V: 선박부피 (m³)</span>
                        </div>
                    </div>
                </div>
            `;
        }

        resultsContainer.classList.add('fade-in-up');
        explanationContainer.classList.add('fade-in-up');
    }

    updateChart(data) {
        if (!this.chart || !data) return;

        const currentVolume = data.volume;
        const earthBuoyancy = data.earth_buoyancy;
        const titanBuoyancy = data.titan_buoyancy;

        // 현재 선박 데이터 포인트 업데이트
        this.chart.data.datasets[2].data = [{ x: currentVolume, y: earthBuoyancy }];
        this.chart.data.datasets[3].data = [{ x: currentVolume, y: titanBuoyancy }];

        const maxBuoyancy = Math.max(earthBuoyancy, titanBuoyancy);
        const maxVolume = Math.max(currentVolume * 1.5, 41000); // 최소 41,000m³까지 보장

        const existingMaxVolume = Math.max(...this.chart.data.datasets[0].data.map(point => point.x));
        const existingMaxBuoyancy = Math.max(
            ...this.chart.data.datasets[0].data.map(point => point.y),
            ...this.chart.data.datasets[1].data.map(point => point.y)
        );

        // 기본 라인 데이터를 현재 볼륨까지 확장
        if (maxVolume > existingMaxVolume) {
            const extendedVolumes = [];
            const extendedEarthBuoyancies = [];
            const extendedTitanBuoyancies = [];

            // 기존 데이터 유지
            this.chart.data.datasets[0].data.forEach(point => {
                extendedVolumes.push(point.x);
                extendedEarthBuoyancies.push(point.y);
            });
            this.chart.data.datasets[1].data.forEach(point => {
                extendedTitanBuoyancies.push(point.y);
            });

            // 새로운 범위까지 데이터 확장
            const stepSize = 2000;
            for (let v = existingMaxVolume + stepSize; v <= maxVolume; v += stepSize) {
                extendedVolumes.push(v);
                extendedEarthBuoyancies.push(v * 9800);
                extendedTitanBuoyancies.push(v * 593.6);
            }

            // 차트 데이터 업데이트
            this.chart.data.datasets[0].data = extendedVolumes.map((v, i) => ({ x: v, y: extendedEarthBuoyancies[i] }));
            this.chart.data.datasets[1].data = extendedVolumes.map((v, i) => ({ x: v, y: extendedTitanBuoyancies[i] }));
        }

        this.chart.options.scales.x.max = maxVolume;
        this.chart.options.scales.y.max = Math.max(maxBuoyancy * 1.1, existingMaxBuoyancy * 1.1);
        this.chart.options.scales.x.min = 0;

        this.chart.options.plugins.title.text =
            `선박 부피에 따른 부력 변화 (현재: ${window.app.formatNumber(currentVolume)} m³)`;

        const isDarkMode = document.body.classList.contains('dark-mode');
        if (isDarkMode) {
            this.chart.options.plugins.title.color = '#e5e5e5';
            this.chart.options.plugins.legend.labels.color = '#e5e5e5';
            this.chart.options.scales.x.title.color = '#e5e5e5';
            this.chart.options.scales.y.title.color = '#e5e5e5';
            this.chart.options.scales.x.ticks.color = '#e5e5e5';
            this.chart.options.scales.y.ticks.color = '#e5e5e5';
            this.chart.options.scales.x.grid.color = 'rgba(229, 229, 229, 0.1)';
            this.chart.options.scales.y.grid.color = 'rgba(229, 229, 229, 0.1)';
        } else {
            this.chart.options.plugins.title.color = '#1E3A8A';
            this.chart.options.plugins.legend.labels.color = '#374151';
            this.chart.options.scales.x.title.color = '#374151';
            this.chart.options.scales.y.title.color = '#374151';
            this.chart.options.scales.x.ticks.color = '#374151';
            this.chart.options.scales.y.ticks.color = '#374151';
            this.chart.options.scales.x.grid.color = 'rgba(0, 0, 0, 0.1)';
            this.chart.options.scales.y.grid.color = 'rgba(0, 0, 0, 0.1)';
        }

        this.chart.update('active');
    }

    showLoading() {
        const resultsContainer = document.getElementById('buoyancyResults');
        if (resultsContainer) {
            resultsContainer.innerHTML = `
                <div class="text-center p-4">
                    <div class="loading mb-2"></div>
                    <p class="small text-muted">계산 중...</p>
                </div>
            `;
        }
    }

    showError(message) {
        const resultsContainer = document.getElementById('buoyancyResults');
        if (resultsContainer) {
            resultsContainer.innerHTML = `
                <div class="alert alert-danger" role="alert">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    ${message}
                </div>
            `;
        }
    }

    refresh() {
        if (this.currentData) {
            this.updateChart(this.currentData);
        }
    }
}

let buoyancyModule;
document.addEventListener('DOMContentLoaded', () => {
    buoyancyModule = new BuoyancyModule();
    window.buoyancyModule = buoyancyModule;
});