class EnvironmentModule {
    constructor() {
        this.chart = null;
        this.currentData = null;
        this.init();
    }

    init() {
        this.setupChart();
        this.loadEnvironmentData();
        console.log('환경 비교 모듈 초기화 완료');
    }

    setupChart() {
        const ctx = document.getElementById('environmentChart');
        if (!ctx) return;

        this.chart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['중력 (m/s²)', '온도 (°C)', '유체밀도 (×10 kg/m³)', '대기압 (kPa)'],
                datasets: [
                    {
                        label: '지구',
                        data: [],
                        backgroundColor: 'rgba(59, 130, 246, 0.8)',
                        borderColor: '#3B82F6',
                        borderWidth: 2,
                        borderRadius: 8,
                        borderSkipped: false,
                    },
                    {
                        label: '타이탄',
                        data: [],
                        backgroundColor: 'rgba(255, 140, 66, 0.8)',
                        borderColor: '#FF8C42',
                        borderWidth: 2,
                        borderRadius: 8,
                        borderSkipped: false,
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: '지구 vs 타이탄 환경 조건 비교',
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
                            label: function(context) {
                                const datasetLabel = context.dataset.label;
                                let value = context.parsed.y;
                                let unit = '';

                                switch (context.dataIndex) {
                                    case 0:
                                        unit = ' m/s²';
                                        break;
                                    case 1:
                                        unit = '°C';
                                        value = value - 200;
                                        break;
                                    case 2:
                                        unit = ' kg/m³';
                                        value = value * 10; // 원래 값으로 복원
                                        break;
                                    case 3:
                                        unit = ' kPa';
                                        break;
                                }

                                return `${datasetLabel}: ${window.app.formatNumber(value, 1)}${unit}`;
                            },
                            afterLabel: function(context) {
                                const earthData = [9.8, 215, 1000, 101.325];
                                const titanData = [1.4, 21, 424, 146.7];
                                const earthValue = earthData[context.dataIndex];
                                const titanValue = titanData[context.dataIndex];

                                let ratio;
                                if (context.dataIndex === 1) {
                                    ratio = Math.abs(earthValue - titanValue);
                                    return `온도 차이: ${ratio.toFixed(0)}°C`;
                                } else {
                                    ratio = earthValue / titanValue;
                                    return `비율: ${ratio.toFixed(1)}:1`;
                                }
                            }
                        }
                    }
                },
                scales: {
                    x: {
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
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        },
                        ticks: {
                            font: {
                                size: 11
                            },
                            callback: function(value, index, values) {
                                return value.toFixed(0);
                            }
                        }
                    }
                },
                animation: {
                    duration: 1200,
                    easing: 'easeOutQuart'
                }
            }
        });
    }

    async loadEnvironmentData() {
        try {
            this.showLoading();

            const response = await window.app.apiCall('/api/environment');

            if (response.success) {
                this.currentData = response.data;
                this.displayEnvironmentInfo(response.data);
                this.displayInsights(response.data.insights);
                this.updateChart(response.data);
            } else {
                this.showError(response.error || '환경 데이터 로딩 실패');
            }

        } catch (error) {
            console.error('환경 데이터 로딩 실패:', error);
            this.showError('환경 데이터를 불러올 수 없습니다.');
        }
    }

    displayEnvironmentInfo(data) {
        const container = document.getElementById('environmentInfo');
        if (!container) return;

        const earthData = data.earth;
        const titanData = data.titan;

        container.innerHTML = `
            <div class="col-6">
                <div class="card bg-earth bg-opacity-10 border-0">
                    <div class="card-body p-2 text-center">
                        <i class="fas fa-globe text-earth mb-2" style="font-size: 1.5rem;"></i>
                        <h6 class="text-earth mb-1">지구</h6>
                        <small class="text-muted d-block">중력: ${earthData.gravity} m/s²</small>
                        <small class="text-muted d-block">온도: ${earthData.temperature}°C</small>
                        <small class="text-muted d-block">밀도: ${earthData.fluid_density} kg/m³</small>
                        <small class="text-muted d-block">압력: ${(earthData.pressure/1000).toFixed(0)} kPa</small>
                    </div>
                </div>
            </div>
            <div class="col-6">
                <div class="card bg-titan bg-opacity-10 border-0">
                    <div class="card-body p-2 text-center">
                        <i class="fas fa-moon text-titan mb-2" style="font-size: 1.5rem;"></i>
                        <h6 class="text-titan mb-1">타이탄</h6>
                        <small class="text-muted d-block">중력: ${titanData.gravity} m/s²</small>
                        <small class="text-muted d-block">온도: ${titanData.temperature}°C</small>
                        <small class="text-muted d-block">밀도: ${titanData.fluid_density} kg/m³</small>
                        <small class="text-muted d-block">압력: ${(titanData.pressure/1000).toFixed(0)} kPa</small>
                    </div>
                </div>
            </div>
        `;

        container.classList.add('fade-in-up');
    }

    displayInsights(insights) {
        const container = document.getElementById('environmentInsights');
        if (!container || !insights) return;

        container.innerHTML = `
            <div class="insight-item mb-3">
                <div class="d-flex align-items-center mb-2">
                    <i class="fas fa-weight-hanging text-titan me-2"></i>
                    <strong>중력</strong>
                </div>
                <p class="small text-muted mb-0">${insights.gravity_comparison}</p>
            </div>

            <div class="insight-item mb-3">
                <div class="d-flex align-items-center mb-2">
                    <i class="fas fa-thermometer-half text-titan me-2"></i>
                    <strong>온도</strong>
                </div>
                <p class="small text-muted mb-0">${insights.temperature_impact}</p>
            </div>

            <div class="insight-item mb-3">
                <div class="d-flex align-items-center mb-2">
                    <i class="fas fa-tint text-titan me-2"></i>
                    <strong>유체 밀도</strong>
                </div>
                <p class="small text-muted mb-0">${insights.fluid_difference}</p>
            </div>

            <div class="insight-item mb-0">
                <div class="d-flex align-items-center mb-2">
                    <i class="fas fa-compress-arrows-alt text-titan me-2"></i>
                    <strong>대기압</strong>
                </div>
                <p class="small text-muted mb-0">${insights.pressure_effect}</p>
            </div>
        `;

        container.classList.add('fade-in-up');
    }

    updateChart(data) {
        if (!this.chart || !data) return;

        const earthData = data.earth;
        const titanData = data.titan;

        const earthValues = [
            earthData.gravity,
            earthData.temperature + 200,
            earthData.fluid_density / 10, // 스케일 조정 (100으로 나누어 표시)
            earthData.pressure / 1000 // kPa 단위로 변환
        ];

        const titanValues = [
            titanData.gravity,
            titanData.temperature + 200,
            titanData.fluid_density / 10, // 스케일 조정 (100으로 나누어 표시)
            titanData.pressure / 1000 // kPa 단위로 변환
        ];

        this.chart.data.datasets[0].data = earthValues;
        this.chart.data.datasets[1].data = titanValues;

        const isDarkMode = document.body.classList.contains('dark-mode');
        if (isDarkMode) {
            this.chart.options.plugins.title.color = '#e5e5e5';
            this.chart.options.plugins.legend.labels.color = '#e5e5e5';
            this.chart.options.scales.x.ticks.color = '#e5e5e5';
            this.chart.options.scales.y.ticks.color = '#e5e5e5';
            this.chart.options.scales.x.grid.color = 'rgba(229, 229, 229, 0.1)';
            this.chart.options.scales.y.grid.color = 'rgba(229, 229, 229, 0.1)';
        } else {
            this.chart.options.plugins.title.color = '#1E3A8A';
            this.chart.options.plugins.legend.labels.color = '#374151';
            this.chart.options.scales.x.ticks.color = '#374151';
            this.chart.options.scales.y.ticks.color = '#374151';
            this.chart.options.scales.x.grid.color = 'rgba(0, 0, 0, 0.1)';
            this.chart.options.scales.y.grid.color = 'rgba(0, 0, 0, 0.1)';
        }

        this.chart.update('active');
    }

    showLoading() {
        const infoContainer = document.getElementById('environmentInfo');
        const insightsContainer = document.getElementById('environmentInsights');

        if (infoContainer) {
            infoContainer.innerHTML = `
                <div class="col-12 text-center p-4">
                    <div class="loading mb-2"></div>
                    <p class="small text-muted">환경 데이터 로딩 중...</p>
                </div>
            `;
        }

        if (insightsContainer) {
            insightsContainer.innerHTML = `
                <div class="text-center p-4">
                    <div class="loading mb-2"></div>
                    <p class="small text-muted">인사이트 생성 중...</p>
                </div>
            `;
        }
    }

    showError(message) {
        const infoContainer = document.getElementById('environmentInfo');
        const insightsContainer = document.getElementById('environmentInsights');

        const errorHtml = `
            <div class="alert alert-danger" role="alert">
                <i class="fas fa-exclamation-triangle me-2"></i>
                ${message}
            </div>
        `;

        if (infoContainer) {
            infoContainer.innerHTML = errorHtml;
        }
        if (insightsContainer) {
            insightsContainer.innerHTML = errorHtml;
        }
    }

    refresh() {
        if (this.currentData) {
            this.updateChart(this.currentData);
        }
    }
}

let environmentModule;
document.addEventListener('DOMContentLoaded', () => {
    environmentModule = new EnvironmentModule();
    window.environmentModule = environmentModule;
});