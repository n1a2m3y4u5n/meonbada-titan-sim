class MaterialsModule {
    constructor() {
        this.chart = null;
        this.currentData = null;
        this.init();
    }

    init() {
        this.setupSliders();
        this.setupChart();
        this.updateCalculation();
        console.log('재료 물성 모듈 초기화 완료');
    }

    setupSliders() {
        const tempSlider = document.getElementById('temperature');
        const valueDisplay = document.getElementById('tempValue');

        if (tempSlider && valueDisplay) {
            valueDisplay.textContent = `${tempSlider.value}°C`;

            tempSlider.addEventListener('input', (e) => {
                valueDisplay.textContent = `${e.target.value}°C`;

                if (window.app) {
                    window.app.debounce('materials-calculation', () => {
                        this.updateCalculation();
                    }, 150);
                }

                if (window.app) {
                    window.app.updateURLParameters();
                }
            });

            tempSlider.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    this.updateCalculation();
                }
            });
        }
    }

    setupChart() {
        const ctx = document.getElementById('materialsChart');
        if (!ctx) return;

        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: []
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: '온도에 따른 재료 강도 변화',
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
                                size: 11
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
                                const temp = context[0].label;
                                return `온도: ${temp}°C`;
                            },
                            label: function(context) {
                                const materialName = context.dataset.label;
                                const strength = context.parsed.y;
                                return `${materialName}: ${strength.toFixed(0)} MPa`;
                            },
                            afterLabel: function(context) {
                                if (context.datasetIndex < 4) {
                                    const baselineStrengths = [310, 270, 450, 1275];
                                    const baseline = baselineStrengths[context.datasetIndex];
                                    const current = context.parsed.y;
                                    const ratio = ((current - baseline) / baseline * 100);
                                    const sign = ratio >= 0 ? '+' : '';
                                    return `기준 대비: ${sign}${ratio.toFixed(1)}%`;
                                }
                                return '';
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: '온도 (°C)',
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
                            }
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: '인장 강도 (MPa)',
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
        const tempSlider = document.getElementById('temperature');
        if (!tempSlider) return;

        const temperature = parseFloat(tempSlider.value);

        try {
            this.showLoading();

            const response = await window.app.apiCall('/api/materials', {
                temperature: temperature
            }, 'POST');

            if (response.success) {
                this.currentData = response.data;
                this.displayResults(response.data);
                this.updateChart(response.data);
            } else {
                this.showError(response.error || '계산 중 오류가 발생했습니다.');
            }

        } catch (error) {
            console.error('재료 분석 실패:', error);
            this.showError('계산 중 오류가 발생했습니다.');
        }
    }

    displayResults(data) {
        const safetyContainer = document.getElementById('materialsSafety');
        const recommendationsContainer = document.getElementById('materialRecommendations');

        if (!safetyContainer || !recommendationsContainer) return;

        safetyContainer.innerHTML = `
            <div class="safety-status ${data.safety_class} p-3 rounded">
                <div class="d-flex align-items-center mb-2">
                    <i class="fas fa-shield-alt me-2"></i>
                    <strong>안전성: ${data.safety_status}</strong>
                </div>
                <div class="small">
                    최고 강도: ${window.app.formatNumber(data.best_material.strength, 0)} MPa<br>
                    <span class="text-muted">${data.best_material.name}</span>
                </div>
            </div>

            <div class="mt-3">
                <h6 class="mb-2">재료별 강도</h6>
                ${data.materials.map(material => `
                    <div class="d-flex justify-content-between align-items-center mb-1 small">
                        <span>${material.name}</span>
                        <span class="fw-bold">${window.app.formatNumber(material.strength, 0)} MPa</span>
                    </div>
                `).join('')}
            </div>
        `;

        if (data.recommendations) {
            recommendationsContainer.innerHTML = `
                <div class="mb-3">
                    <h6 class="text-primary">
                        <i class="fas fa-star me-2"></i>권장 재료
                    </h6>
                    <p class="small mb-2"><strong>${data.recommendations.primary}</strong></p>
                    <p class="small text-muted mb-0">${data.recommendations.reason}</p>
                </div>

                <div class="alert alert-info py-2 mb-0">
                    <strong>고려사항:</strong><br>
                    <span class="small">${data.recommendations.considerations}</span>
                </div>
            `;
        }

        if (data.explanation) {
            recommendationsContainer.innerHTML += `
                <div class="mt-3">
                    <div class="card bg-light">
                        <div class="card-body p-2">
                            <h6 class="mb-2">온도 영향 분석</h6>
                            <div class="small">
                                <p class="mb-1">${data.explanation.temperature_effect}</p>
                                <p class="mb-1 text-warning">${data.explanation.titan_challenge}</p>
                                <p class="mb-0 text-info">${data.explanation.design_recommendation}</p>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }

        safetyContainer.classList.add('fade-in-up');
        recommendationsContainer.classList.add('fade-in-up');
    }

    updateChart(data) {
        if (!this.chart || !data) return;

        const temperatureRange = [];
        for (let temp = -200; temp <= 50; temp += 25) {
            temperatureRange.push(temp);
        }

        const datasets = data.materials.map(material => {
            const strengthData = temperatureRange.map(temp => {
                if (temp < -200) return 0;
                const tempDiff = temp - 20;
                const coefficients = [0.003, 0.004, 0.002, 0.001];
                const baselines = [310, 270, 450, 1275];
                const materialIndex = data.materials.indexOf(material);
                const strength = baselines[materialIndex] * (1 - coefficients[materialIndex] * Math.abs(tempDiff));
                return Math.max(0, strength);
            });

            return {
                label: material.name,
                data: strengthData,
                borderColor: material.color,
                backgroundColor: material.color + '20',
                borderWidth: 3,
                fill: false,
                tension: 0.2,
                pointRadius: 3,
                pointHoverRadius: 5,
                pointBackgroundColor: material.color,
                pointBorderColor: '#ffffff',
                pointBorderWidth: 2
            };
        });

        const currentTempDataset = {
            label: '현재 온도 강도',
            data: temperatureRange.map(temp => {
                if (temp === data.temperature) {
                    return data.materials.map(mat => mat.strength);
                }
                return [];
            }).flat(),
            borderColor: '#FF8C42',
            backgroundColor: '#FF8C42',
            borderWidth: 0,
            pointRadius: 8,
            pointHoverRadius: 10,
            pointStyle: 'diamond',
            showLine: false,
            pointBorderColor: '#ffffff',
            pointBorderWidth: 2
        };

        this.chart.data.labels = temperatureRange;
        this.chart.data.datasets = [...datasets, currentTempDataset];

        const currentTempIndex = temperatureRange.indexOf(data.temperature);
        if (currentTempIndex >= 0) {
            const currentStrengths = data.materials.map(mat => mat.strength);
            currentTempDataset.data = temperatureRange.map((temp, index) => {
                if (index === currentTempIndex) {
                    return currentStrengths;
                }
                return [];
            }).flat();
        }

        const maxStrength = Math.max(...data.materials.map(mat => mat.strength), 1400);
        this.chart.options.scales.y.max = maxStrength * 1.1;

        this.chart.options.plugins.title.text =
            `온도에 따른 재료 강도 변화 (현재: ${data.temperature}°C)`;

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
        const safetyContainer = document.getElementById('materialsSafety');
        if (safetyContainer) {
            safetyContainer.innerHTML = `
                <div class="text-center p-4">
                    <div class="loading mb-2"></div>
                    <p class="small text-muted">분석 중...</p>
                </div>
            `;
        }
    }

    showError(message) {
        const safetyContainer = document.getElementById('materialsSafety');
        if (safetyContainer) {
            safetyContainer.innerHTML = `
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

let materialsModule;
document.addEventListener('DOMContentLoaded', () => {
    materialsModule = new MaterialsModule();
    window.materialsModule = materialsModule;
});