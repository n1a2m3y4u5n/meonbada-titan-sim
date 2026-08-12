class WavesModule {
    constructor() {
        this.chart = null;
        this.currentData = null;
        this.canvas = null;
        this.ctx = null;
        this.animationId = null;
        this.time = 0;
        this.isAnimating = false;
        this.init();
    }

    init() {
        this.setupSliders();
        this.setupCanvas();
        this.setupChart();
        this.updateCalculation();
        console.log('파도 증폭 모듈 초기화 완료');
    }

    setupSliders() {
        const waveSlider = document.getElementById('waveHeight');
        const valueDisplay = document.getElementById('waveHeightValue');

        if (waveSlider && valueDisplay) {
            valueDisplay.textContent = `${waveSlider.value}m`;

            waveSlider.addEventListener('input', (e) => {
                valueDisplay.textContent = `${e.target.value}m`;

                if (window.app) {
                    window.app.debounce('wave-calculation', () => {
                        this.updateCalculation();
                    }, 150);
                }

                if (window.app) {
                    window.app.updateURLParameters();
                }
            });

            waveSlider.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    this.updateCalculation();
                }
            });
        }
    }

    setupCanvas() {
        this.canvas = document.getElementById('waveCanvas');
        if (!this.canvas) return;

        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = 1000;
        this.canvas.height = 600;

        this.startAnimation();
    }

    setupChart() {
        const ctx = document.getElementById('bendingChart');
        if (!ctx) return;

        this.chart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['지구', '타이탄'],
                datasets: [{
                    label: '굽힘 모멘트 (kN⋅m)',
                    data: [0, 0],
                    backgroundColor: ['rgba(59, 130, 246, 0.8)', 'rgba(255, 140, 66, 0.8)'],
                    borderColor: ['#3B82F6', '#FF8C42'],
                    borderWidth: 2,
                    borderRadius: 8,
                    borderSkipped: false,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: '파도에 의한 선박 굽힘 모멘트',
                        font: {
                            size: 14,
                            weight: 'bold'
                        },
                        color: '#1E3A8A'
                    },
                    legend: {
                        display: false
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
                                const value = context.parsed.y;
                                return `굽힘 모멘트: ${window.app.formatNumber(value/1000, 1)} kN⋅m`;
                            },
                            afterLabel: function(context) {
                                if (context.dataIndex === 1) {
                                    const earthValue = context.chart.data.datasets[0].data[0];
                                    const titanValue = context.parsed.y;
                                    if (earthValue > 0) {
                                        const ratio = titanValue / earthValue;
                                        return `지구 대비: ${ratio.toFixed(1)}배`;
                                    }
                                }
                                return '';
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
                        title: {
                            display: true,
                            text: '굽힘 모멘트 (kN⋅m)',
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
                }
            }
        });
    }

    async updateCalculation() {
        const waveSlider = document.getElementById('waveHeight');
        if (!waveSlider) return;

        const waveHeight = parseFloat(waveSlider.value);

        try {
            this.showLoading();

            const response = await window.app.apiCall('/api/waves', {
                wave_height: waveHeight
            }, 'POST');

            if (response.success) {
                this.currentData = response.data;
                this.displayResults(response.data);
                this.updateChart(response.data);
                this.updateAmplificationDisplay(response.data);
            } else {
                this.showError(response.error || '계산 중 오류가 발생했습니다.');
            }

        } catch (error) {
            console.error('파고 계산 실패:', error);
            this.showError('계산 중 오류가 발생했습니다.');
        }
    }

    displayResults(data) {
        const resultsContainer = document.getElementById('waveResults');
        const explanationContainer = document.getElementById('waveExplanation');

        if (!resultsContainer || !explanationContainer) return;

        resultsContainer.innerHTML = `
            <div class="result-item">
                <div class="result-label">지구 파고</div>
                <div class="result-value text-earth">${window.app.formatNumber(data.earth_wave_height, 1)} m</div>
            </div>

            <div class="result-item">
                <div class="result-label">타이탄 파고</div>
                <div class="result-value text-titan">${window.app.formatNumber(data.titan_wave_height, 1)} m</div>
            </div>

            <div class="result-item bg-warning bg-opacity-10">
                <div class="result-label">파고 증폭 계수</div>
                <div class="result-value text-warning">${window.app.formatNumber(data.amplification_factor, 2)}배</div>
            </div>

            <div class="result-item bg-info bg-opacity-10">
                <div class="result-label">지구 파도 주기</div>
                <div class="result-value text-info">${window.app.formatNumber(data.earth_wave_period, 1)} s</div>
            </div>

            <div class="result-item bg-info bg-opacity-10">
                <div class="result-label">타이탄 파도 주기</div>
                <div class="result-value text-info">${window.app.formatNumber(data.titan_wave_period, 1)} s</div>
            </div>

            <div class="result-item bg-danger bg-opacity-10">
                <div class="result-label">굽힘 모멘트 비율</div>
                <div class="result-value text-danger">${window.app.formatNumber(data.bending_ratio, 1)}배</div>
            </div>
        `;

        if (data.explanation) {
            explanationContainer.innerHTML = `
                <div class="mb-3">
                    <h6 class="text-primary">
                        <i class="fas fa-question-circle me-2"></i>파도 역학
                    </h6>
                    <p class="small mb-2">${data.explanation.wave_mechanics}</p>

                    <div class="alert alert-warning py-2">
                        <strong>구조적 영향:</strong><br>
                        ${data.explanation.structural_impact}
                    </div>

                    <div class="alert alert-info py-2 mb-0">
                        <strong>설계 고려사항:</strong><br>
                        ${data.explanation.design_consideration}
                    </div>
                </div>
            `;
        }

        resultsContainer.classList.add('fade-in-up');
        explanationContainer.classList.add('fade-in-up');
    }

    updateChart(data) {
        if (!this.chart || !data) return;

        this.chart.data.datasets[0].data = [
            data.earth_bending_moment,
            data.titan_bending_moment
        ];

        const isDarkMode = document.body.classList.contains('dark-mode');
        if (isDarkMode) {
            this.chart.options.plugins.title.color = '#e5e5e5';
            this.chart.options.scales.x.ticks.color = '#e5e5e5';
            this.chart.options.scales.y.ticks.color = '#e5e5e5';
            this.chart.options.scales.y.title.color = '#e5e5e5';
            this.chart.options.scales.x.grid.color = 'rgba(229, 229, 229, 0.1)';
            this.chart.options.scales.y.grid.color = 'rgba(229, 229, 229, 0.1)';
        } else {
            this.chart.options.plugins.title.color = '#1E3A8A';
            this.chart.options.scales.x.ticks.color = '#374151';
            this.chart.options.scales.y.ticks.color = '#374151';
            this.chart.options.scales.y.title.color = '#374151';
            this.chart.options.scales.x.grid.color = 'rgba(0, 0, 0, 0.1)';
            this.chart.options.scales.y.grid.color = 'rgba(0, 0, 0, 0.1)';
        }

        this.chart.update('active');
    }

    updateAmplificationDisplay(data) {
        const amplificationElement = document.getElementById('amplificationFactor');
        if (amplificationElement) {
            amplificationElement.textContent = data.amplification_factor.toFixed(2);
        }
    }

    startAnimation() {
        if (!this.canvas || !this.ctx) return;

        this.isAnimating = true;
        this.animate();
    }

    animate() {
        if (!this.isAnimating) return;

        this.time += 0.05;
        this.drawWaves();

        this.animationId = requestAnimationFrame(() => this.animate());
    }

    drawWaves() {
        if (!this.ctx || !this.canvas) return;

        const width = this.canvas.width;
        const height = this.canvas.height;

        this.ctx.clearRect(0, 0, width, height);

        const gradient = this.ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, '#87CEEB');
        gradient.addColorStop(0.5, '#4682B4');
        gradient.addColorStop(1, '#191970');

        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, width, height);

        const earthWaveHeight = this.currentData ? this.currentData.earth_wave_height : 5;
        const titanWaveHeight = this.currentData ? this.currentData.titan_wave_height : 13.25;

        const earthAmplitude = earthWaveHeight * 3;
        const titanAmplitude = titanWaveHeight * 3;

        this.drawWaveSet(width / 2 - 200, height / 2 - 50, earthAmplitude, 0.02, '#3B82F6', '지구');
        this.drawWaveSet(width / 2 + 200, height / 2 - 50, titanAmplitude, 0.015, '#FF8C42', '타이탄');

        this.drawShips(width, height, earthAmplitude, titanAmplitude);
    }

    drawWaveSet(centerX, centerY, amplitude, frequency, color, label) {
        if (!this.ctx) return;

        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();

        const waveLength = 100;
        const startX = centerX - waveLength;
        const endX = centerX + waveLength;

        for (let x = startX; x <= endX; x += 2) {
            const y = centerY + amplitude * Math.sin(frequency * (x - centerX) + this.time);
            if (x === startX) {
                this.ctx.moveTo(x, y);
            } else {
                this.ctx.lineTo(x, y);
            }
        }

        this.ctx.stroke();

        this.ctx.fillStyle = color;
        this.ctx.font = '14px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(`${label} 파도`, centerX, centerY - amplitude - 20);
        this.ctx.fillText(`높이: ${(amplitude/3).toFixed(1)}m`, centerX, centerY - amplitude - 5);
    }

    drawShips(width, height, earthAmplitude, titanAmplitude) {
        const earthCenterX = width / 2 - 200;
        const titanCenterX = width / 2 + 200;
        const earthCenterY = height / 2 - 50;
        const titanCenterY = height / 2 - 50;

        const earthShipY = earthCenterY + earthAmplitude * Math.sin(0.02 * (earthCenterX - earthCenterX) + this.time) - 15;
        const titanShipY = titanCenterY + titanAmplitude * Math.sin(0.015 * (titanCenterX - titanCenterX) + this.time) - 15;

        this.drawShip(earthCenterX, earthShipY, '#3B82F6');
        this.drawShip(titanCenterX, titanShipY, '#FF8C42');
    }

    drawShip(x, y, color) {
        if (!this.ctx) return;

        this.ctx.fillStyle = color;
        this.ctx.strokeStyle = '#FFFFFF';
        this.ctx.lineWidth = 2;

        this.ctx.beginPath();
        this.ctx.ellipse(x, y, 25, 8, 0, 0, 2 * Math.PI);
        this.ctx.fill();
        this.ctx.stroke();

        this.ctx.fillStyle = color;
        this.ctx.fillRect(x - 3, y - 15, 6, 15);

        this.ctx.strokeStyle = '#FFFFFF';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(x - 3, y - 15, 6, 15);
    }

    showLoading() {
        const resultsContainer = document.getElementById('waveResults');
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
        const resultsContainer = document.getElementById('waveResults');
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

    destroy() {
        this.isAnimating = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
    }
}

let wavesModule;
document.addEventListener('DOMContentLoaded', () => {
    wavesModule = new WavesModule();
    window.wavesModule = wavesModule;
});