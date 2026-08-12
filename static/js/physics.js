class PhysicsCalculator {
    constructor() {
        this.CONSTANTS = {
            EARTH: {
                gravity: 9.8,
                temp_surface: 15,
                fluid_density_water: 1000,
                atm_pressure: 101325
            },
            TITAN: {
                gravity: 1.4,
                temp_surface: -179,
                fluid_density_methane: 424,
                atm_pressure: 146700
            }
        };
    }

    getEnvironmentData() {
        return {
            success: true,
            data: {
                earth: {
                    gravity: this.CONSTANTS.EARTH.gravity,
                    temperature: this.CONSTANTS.EARTH.temp_surface,
                    fluid_density: this.CONSTANTS.EARTH.fluid_density_water,
                    pressure: this.CONSTANTS.EARTH.atm_pressure
                },
                titan: {
                    gravity: this.CONSTANTS.TITAN.gravity,
                    temperature: this.CONSTANTS.TITAN.temp_surface,
                    fluid_density: this.CONSTANTS.TITAN.fluid_density_methane,
                    pressure: this.CONSTANTS.TITAN.atm_pressure
                },
                insights: {
                    gravity_comparison: "타이탄의 중력은 지구의 약 14%로 현저히 낮습니다.",
                    temperature_impact: "극저온 환경(-179°C)에서 재료 물성이 크게 변화합니다.",
                    fluid_difference: "메탄 바다의 밀도가 물보다 2.4배 낮아 부력이 감소합니다.",
                    pressure_effect: "높은 대기압(1.47 atm)이 구조 설계에 영향을 줍니다."
                }
            }
        };
    }

    calculateBuoyancy(length, width, height) {
        try {
            const volume = length * width * height;

            const earth_buoyancy = this.CONSTANTS.EARTH.fluid_density_water *
                                   this.CONSTANTS.EARTH.gravity * volume;
            const titan_buoyancy = this.CONSTANTS.TITAN.fluid_density_methane *
                                   this.CONSTANTS.TITAN.gravity * volume;

            const buoyancy_ratio = earth_buoyancy / titan_buoyancy;
            const required_displacement_multiplier = buoyancy_ratio;
            const titan_required_volume = volume * required_displacement_multiplier;

            return {
                success: true,
                data: {
                    volume: volume,
                    earth_buoyancy: earth_buoyancy,
                    titan_buoyancy: titan_buoyancy,
                    buoyancy_ratio: buoyancy_ratio,
                    required_displacement_multiplier: required_displacement_multiplier,
                    titan_required_volume: titan_required_volume,
                    explanation: {
                        why_important: "부력은 선박의 기본적인 부유 능력을 결정하는 핵심 요소입니다. 타이탄의 낮은 중력과 메탄 바다의 낮은 밀도로 인해 부력이 지구 대비 크게 감소합니다.",
                        titan_challenge: `타이탄에서는 부력이 지구 대비 ${buoyancy_ratio.toFixed(1)}배 낮아, 동일한 화물을 운반하려면 선박 크기를 ${required_displacement_multiplier.toFixed(1)}배 증가시켜야 합니다.`,
                        design_recommendation: "대형 선체 설계와 경량 소재 사용을 통해 부력 효율성을 극대화해야 합니다."
                    }
                }
            };
        } catch (error) {
            return {
                success: false,
                error: `부력 계산 중 오류 발생: ${error.message}`
            };
        }
    }

    calculateWaves(earth_wave_height) {
        try {
            const gravity_ratio = this.CONSTANTS.EARTH.gravity / this.CONSTANTS.TITAN.gravity;
            const amplification_factor = Math.sqrt(gravity_ratio);
            const titan_wave_height = earth_wave_height * amplification_factor;

            const earth_wave_period = 2 * Math.PI * Math.sqrt(earth_wave_height / this.CONSTANTS.EARTH.gravity);
            const titan_wave_period = 2 * Math.PI * Math.sqrt(titan_wave_height / this.CONSTANTS.TITAN.gravity);

            const ship_length = 100;
            const earth_bending_moment = 0.125 * this.CONSTANTS.EARTH.fluid_density_water *
                                        this.CONSTANTS.EARTH.gravity *
                                        Math.pow(ship_length, 4) *
                                        Math.pow(earth_wave_height / ship_length, 2);
            const titan_bending_moment = 0.125 * this.CONSTANTS.TITAN.fluid_density_methane *
                                        this.CONSTANTS.TITAN.gravity *
                                        Math.pow(ship_length, 4) *
                                        Math.pow(titan_wave_height / ship_length, 2);

            return {
                success: true,
                data: {
                    earth_wave_height: earth_wave_height,
                    titan_wave_height: titan_wave_height,
                    amplification_factor: amplification_factor,
                    earth_wave_period: earth_wave_period,
                    titan_wave_period: titan_wave_period,
                    earth_bending_moment: earth_bending_moment,
                    titan_bending_moment: titan_bending_moment,
                    bending_ratio: earth_bending_moment / titan_bending_moment,
                    explanation: {
                        wave_mechanics: `파도의 높이는 중력의 제곱근에 반비례하여 증폭됩니다. 타이탄에서는 지구 대비 ${amplification_factor.toFixed(2)}배 높은 파도가 형성됩니다.`,
                        structural_impact: "높은 파도는 선박 구조에 더 큰 굽힘 모멘트를 가하여 구조적 강도 요구사항을 증가시킵니다.",
                        design_consideration: "파도 증폭을 고려한 강화된 선체 구조와 안정성 시스템이 필요합니다."
                    }
                }
            };
        } catch (error) {
            return {
                success: false,
                error: `파고 계산 중 오류 발생: ${error.message}`
            };
        }
    }

    calculateMaterials(temperature) {
        try {
            const materials = [
                {
                    name: "스테인리스강 316L",
                    baseline_strength: 310,
                    temp_coefficient: 0.003,
                    min_temp: -200,
                    color: "#FF6B6B"
                },
                {
                    name: "알루미늄 5083",
                    baseline_strength: 270,
                    temp_coefficient: 0.004,
                    min_temp: -200,
                    color: "#4ECDC4"
                },
                {
                    name: "티타늄 Grade 2",
                    baseline_strength: 450,
                    temp_coefficient: 0.002,
                    min_temp: -200,
                    color: "#45B7D1"
                },
                {
                    name: "인코넬 718",
                    baseline_strength: 1275,
                    temp_coefficient: 0.001,
                    min_temp: -200,
                    color: "#96CEB4"
                }
            ];

            const material_data = materials.map(material => {
                let strength;
                if (temperature < material.min_temp) {
                    strength = 0;
                } else {
                    const temp_diff = temperature - 20;
                    strength = material.baseline_strength * (1 - material.temp_coefficient * Math.abs(temp_diff));
                    strength = Math.max(0, strength);
                }

                return {
                    name: material.name,
                    strength: strength,
                    color: material.color,
                    baseline_strength: material.baseline_strength
                };
            });

            const titan_material_data = materials.map(material => {
                const titan_temp = this.CONSTANTS.TITAN.temp_surface;
                let strength;
                if (titan_temp < material.min_temp) {
                    strength = 0;
                } else {
                    const temp_diff = titan_temp - 20;
                    strength = material.baseline_strength * (1 - material.temp_coefficient * Math.abs(temp_diff));
                    strength = Math.max(0, strength);
                }

                return {
                    name: material.name,
                    strength: strength,
                    titan_strength: strength
                };
            });

            const best_material = material_data.reduce((best, current) =>
                current.strength > best.strength ? current : best
            );

            let safety_status, safety_class;
            if (best_material.strength > 400) {
                safety_status = "우수";
                safety_class = "safety-excellent";
            } else if (best_material.strength > 250) {
                safety_status = "양호";
                safety_class = "safety-good";
            } else if (best_material.strength > 150) {
                safety_status = "주의";
                safety_class = "safety-caution";
            } else {
                safety_status = "위험";
                safety_class = "safety-danger";
            }

            return {
                success: true,
                data: {
                    temperature: temperature,
                    materials: material_data,
                    titan_materials: titan_material_data,
                    best_material: best_material,
                    safety_status: safety_status,
                    safety_class: safety_class,
                    recommendations: {
                        primary: best_material.name,
                        reason: `현재 온도에서 최고 강도 ${best_material.strength.toFixed(0)} MPa를 보입니다.`,
                        considerations: "극저온 환경에서는 재료 선택이 구조 안전성에 결정적 영향을 미칩니다."
                    },
                    explanation: {
                        temperature_effect: `${temperature}°C에서 재료 강도가 상온 대비 변화합니다.`,
                        titan_challenge: "타이탄의 극저온 환경(-179°C)에서는 대부분의 재료 강도가 크게 저하됩니다.",
                        design_recommendation: "저온에서 우수한 성능을 보이는 특수 합금이나 복합재료 사용을 권장합니다."
                    }
                }
            };
        } catch (error) {
            return {
                success: false,
                error: `재료 분석 중 오류 발생: ${error.message}`
            };
        }
    }
}

window.PhysicsCalculator = PhysicsCalculator;