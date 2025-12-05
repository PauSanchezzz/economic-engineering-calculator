function showSection(sectionId) {
    const sections = document.querySelectorAll('.calculator-section');
    sections.forEach(section => section.classList.remove('active'));
    const tabs = document.querySelectorAll('.nav-tab');
    tabs.forEach(tab => tab.classList.remove('active'));

    document.getElementById(sectionId).classList.add('active');

    const activeTab = document.querySelector(`[data-section="${sectionId}"]`);
    if (activeTab) activeTab.classList.add('active');
}

function formatNumber(num, decimals = 2) {
    return new Intl.NumberFormat('es-CO', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    }).format(num);
}

function formatCurrency(num) {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 2
    }).format(num);
}

function esBisiesto(año) {
    return (año % 4 === 0 && (año % 100 !== 0 || año % 400 === 0));
}

function diasDelMes(mes, año) {
    const diasPorMes = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    if (mes === 2 && esBisiesto(año)) {
        return 29;
    }
    return diasPorMes[mes - 1];
}

function calcularDiasExactos(fechaInicial, fechaFinal) {
    const inicio = new Date(fechaInicial);
    const fin = new Date(fechaFinal);
    const diffTime = fin - inicio;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

function parseFormattedNumber(value) {
    if (!value) return 0;
    if (typeof value === 'number') return value;
    return parseFloat(value.replace(/\./g, '').replace(',', '.')) || 0;
}

function getInputValue(id) {
    const element = document.getElementById(id);
    if (!element) return 0;
    return parseFormattedNumber(element.value);
}

function setupFormattedInputs() {
    const inputs = document.querySelectorAll('input[type="number"], input.input-field');
    inputs.forEach(input => {
        if (input.type === 'date' || input.readOnly) return;

        input.type = 'text';
        input.inputMode = 'decimal';

        input.addEventListener('input', function (e) {
            let value = this.value;
            let selectionStart = this.selectionStart;
            let initialLength = value.length;

            if (value === '') return;

            let rawValue = value.replace(/[^\d,]/g, '');

            let parts = rawValue.split(',');
            let integerPart = parts[0];
            let decimalPart = parts.length > 1 ? ',' + parts[1] : '';

            let formattedInteger = integerPart;
            if (integerPart.length > 0) {
                try {
                    formattedInteger = new Intl.NumberFormat('es-CO').format(BigInt(integerPart));
                } catch (e) {
                }
            }

            let newValue = formattedInteger + decimalPart;

            if (newValue !== value) {
                this.value = newValue;
                let newLength = newValue.length;
                let newCursor = selectionStart + (newLength - initialLength);
                if (newCursor < 0) newCursor = 0;
                this.setSelectionRange(newCursor, newCursor);
            }
        });

        if (input.value) {
            let val = parseFloat(input.value);
            if (!isNaN(val)) {
                input.value = new Intl.NumberFormat('es-CO').format(val);
            }
        }
    });
}

function updateRepartoFields() {
    generateRepartoInputs();
}

function generateRepartoInputs() {
    const numPartes = getInputValue('numPartes') || 3;
    const tipoReparto = document.getElementById('tipoReparto').value;
    const container = document.getElementById('repartoInputsContainer');

    let html = '<div class="grid md:grid-cols-2 gap-4">';

    for (let i = 1; i <= numPartes; i++) {
        if (tipoReparto === 'directoSimple' || tipoReparto === 'inversoSimple') {
            html += `
                <div class="form-group">
                    <label class="form-label">Índice ${i}</label>
                    <input type="number" id="indice1_${i}" class="input-field" placeholder="Valor" step="0.01">
                </div>
            `;
        } else if (tipoReparto === 'compuesto') {
            html += `
                <div class="form-group">
                    <label class="form-label">Parte ${i}</label>
                    <div class="grid grid-cols-2 gap-2">
                        <input type="number" id="indice1_${i}" class="input-field" placeholder="Índice 1" step="0.01">
                        <input type="number" id="indice2_${i}" class="input-field" placeholder="Índice 2" step="0.01">
                    </div>
                </div>
            `;
        } else if (tipoReparto === 'mixto') {
            html += `
                <div class="form-group">
                    <label class="form-label">Parte ${i}</label>
                    <div class="grid grid-cols-2 gap-2">
                        <input type="number" id="indice1_${i}" class="input-field" placeholder="Índice 1" step="0.01">
                        <input type="number" id="indice2_${i}" class="input-field" placeholder="Índice 2 (divisor)" step="0.01">
                    </div>
                </div>
            `;
        }
    }

    html += '</div>';
    container.innerHTML = html;
}

function calcularReparto() {
    const total = getInputValue('totalReparto');
    const numPartes = getInputValue('numPartes');
    const tipoReparto = document.getElementById('tipoReparto').value;
    const metodo = document.getElementById('metodoReparto').value;

    if (!total || !numPartes) {
        alert('Por favor, complete todos los campos requeridos');
        return;
    }

    const indices = [];

    for (let i = 1; i <= numPartes; i++) {
        const indice1 = getInputValue(`indice1_${i}`);

        if (tipoReparto === 'directoSimple') {
            indices.push(indice1);
        } else if (tipoReparto === 'inversoSimple') {
            indices.push(indice1);
        } else if (tipoReparto === 'compuesto') {
            const indice2 = getInputValue(`indice2_${i}`);
            indices.push(indice1 * indice2);
        } else if (tipoReparto === 'mixto') {
            const indice2 = getInputValue(`indice2_${i}`);
            indices.push(indice1 / indice2);
        }
    }

    let indicesCalculados = indices;
    if (tipoReparto === 'inversoSimple') {
        indicesCalculados = indices.map(idx => 1 / idx);
    }

    const sumaIndices = indicesCalculados.reduce((sum, idx) => sum + idx, 0);
    const partes = [];

    if (metodo === 'reduccion') {
        for (let i = 0; i < numPartes; i++) {
            partes.push((total * indicesCalculados[i]) / sumaIndices);
        }
    } else {

        for (let i = 0; i < numPartes; i++) {
            partes.push((indicesCalculados[i] / sumaIndices) * total);
        }
    }

    let html = '<h3 class="text-xl font-bold mb-4 text-white">Resultados del Reparto</h3>';
    html += '<div class="space-y-3">';

    for (let i = 0; i < numPartes; i++) {
        html += `
            <div class="result-item">
                <span class="result-label">Parte ${i + 1}:</span>
                <span class="result-value">${formatCurrency(partes[i])}</span>
            </div>
        `;
    }

    html += `
        <div class="result-item" style="border-top: 2px solid rgba(255,255,255,0.2); padding-top: 1rem; margin-top: 1rem;">
            <span class="result-label font-bold">Total Repartido:</span>
            <span class="highlight-value">${formatCurrency(partes.reduce((sum, p) => sum + p, 0))}</span>
        </div>
    `;

    html += '</div>';

    const steps = [];

    const tipoNombres = {
        'directoSimple': 'Directo Simple',
        'inversoSimple': 'Inverso Simple',
        'compuesto': 'Compuesto',
        'mixto': 'Mixto'
    };

    steps.push({
        title: 'Tipo de Reparto',
        description: `Se utilizará el método de reparto ${tipoNombres[tipoReparto]}.`,
        calculation: `Método: ${metodo === 'reduccion' ? 'Reducción a la Unidad' : 'Partes Alícuotas'}\nTotal: ${formatCurrency(total)}`
    });

    let indicesDesc = '';
    for (let i = 0; i < numPartes; i++) {
        indicesDesc += `Índice ${i + 1} = ${formatNumber(indicesCalculados[i], 15)}\n`;
    }

    steps.push({
        title: 'Índices Calculados',
        description: 'Los índices de reparto (ya procesados) son:',
        calculation: indicesDesc.trim()
    });

    steps.push({
        title: 'Suma de Índices',
        formula: '\\sum \\text{índices} = ' + formatNumber(sumaIndices, 4),
        calculation: `Suma total = ${formatNumber(sumaIndices, 4)}`
    });

    let formulaTexto = metodo === 'reduccion' ?
        '\\text{Parte}_i = \\frac{\\text{Total} \\times \\text{índice}_i}{\\sum \\text{índices}}' :
        '\\text{Parte}_i = \\frac{\\text{índice}_i}{\\sum \\text{índices}} \\times \\text{Total}';

    let calculosTexto = '';
    for (let i = 0; i < numPartes; i++) {
        calculosTexto += `Parte ${i + 1} = ${formatCurrency(partes[i])}\n`;
    }

    steps.push({
        title: 'Distribución Final',
        description: 'Aplicamos la fórmula a cada parte:',
        formula: formulaTexto,
        calculation: calculosTexto.trim(),
        result: `Total repartido: ${formatCurrency(partes.reduce((sum, p) => sum + p, 0))}`
    });

    html += generateProcedureSection('reparto', steps);

    const resultDiv = document.getElementById('resultadoReparto');
    resultDiv.innerHTML = html;
    resultDiv.classList.remove('hidden');
}

function calcularInteresSimple() {
    const capital = getInputValue('capitalSimple');
    const tasaAnual = getInputValue('tasaSimple') / 100;
    const fechaInicial = document.getElementById('fechaInicialSimple').value;
    const fechaFinal = document.getElementById('fechaFinalSimple').value;
    const tipoInteres = document.getElementById('tipoInteres').value;

    if (!capital || !tasaAnual || !fechaInicial || !fechaFinal) {
        alert('Por favor, complete todos los campos');
        return;
    }

    const inicio = new Date(fechaInicial);
    const fin = new Date(fechaFinal);

    let interes = 0;
    let diasCalculados = 0;
    let base = 0;

    if (tipoInteres === 'comercial') {
        // Comercial: 30/360
        const meses = (fin.getFullYear() - inicio.getFullYear()) * 12 +
            (fin.getMonth() - inicio.getMonth());
        diasCalculados = 30;
        base = 360;
        interes = capital * tasaAnual * (30 / 360) * (meses || 1);
    } else if (tipoInteres === 'bancario') {
        // Bancario: días exactos/360
        diasCalculados = calcularDiasExactos(fechaInicial, fechaFinal);
        base = 360;
        interes = capital * tasaAnual * (diasCalculados / 360);
    } else if (tipoInteres === 'racional') {
        // Racional: días exactos/365 o 366
        diasCalculados = calcularDiasExactos(fechaInicial, fechaFinal);
        const año = inicio.getFullYear();
        base = esBisiesto(año) ? 366 : 365;
        interes = capital * tasaAnual * (diasCalculados / base);
    } else if (tipoInteres === 'ideal') {
        // Ideal: días ideales/365 (febrero siempre 28)
        let diasIdeales = 0;
        let currentDate = new Date(inicio);

        while (currentDate < fin) {
            const mes = currentDate.getMonth() + 1;
            const año = currentDate.getFullYear();
            let diasMes = diasDelMes(mes, año);

            // Para ideal, febrero siempre es 28 días
            if (mes === 2) diasMes = 28;

            diasIdeales += diasMes;
            currentDate.setMonth(currentDate.getMonth() + 1);
        }

        diasCalculados = diasIdeales;
        base = 365;
        interes = capital * tasaAnual * (diasCalculados / 365);
    }

    const montoFinal = capital + interes;

    let html = '<h3 class="text-xl font-bold mb-4 text-white">Resultados del Interés Simple</h3>';
    html += '<div class="space-y-3">';
    html += `
        <div class="result-item">
            <span class="result-label">Tipo de Interés:</span>
            <span class="result-value">${tipoInteres.charAt(0).toUpperCase() + tipoInteres.slice(1)}</span>
        </div>
        <div class="result-item">
            <span class="result-label">Capital Inicial:</span>
            <span class="result-value">${formatCurrency(capital)}</span>
        </div>
        <div class="result-item">
            <span class="result-label">Tasa de Interés:</span>
            <span class="result-value">${formatNumber(tasaAnual * 100, 2)}%</span>
        </div>
        <div class="result-item">
            <span class="result-label">Días Calculados:</span>
            <span class="result-value">${diasCalculados}</span>
        </div>
        <div class="result-item">
            <span class="result-label">Base:</span>
            <span class="result-value">${base}</span>
        </div>
        <div class="result-item">
            <span class="result-label">Interés Generado:</span>
            <span class="result-value">${formatCurrency(interes)}</span>
        </div>
        <div class="result-item" style="border-top: 2px solid rgba(255,255,255,0.2); padding-top: 1rem; margin-top: 1rem;">
            <span class="result-label font-bold">Monto Final:</span>
            <span class="highlight-value">${formatCurrency(montoFinal)}</span>
        </div>
    `;
    html += '</div>';

    const steps = [];

    steps.push({
        title: 'Tipo de Interés Simple',
        description: `Se calculará usando el método ${tipoInteres.toUpperCase()}.`,
        calculation: `Tipo: ${tipoInteres}\nBase: ${base} días`
    });

    steps.push({
        title: 'Datos Iniciales',
        description: 'Los valores dados son:',
        calculation: `Capital (P): ${formatCurrency(capital)}\nTasa anual (r): ${formatNumber(tasaAnual * 100, 2)}%\nDías calculados: ${diasCalculados}\nBase: ${base}`
    });

    let formulaInteres = '';
    if (tipoInteres === 'comercial') {
        formulaInteres = 'I = P \\times r \\times \\frac{30}{360}';
    } else if (tipoInteres === 'bancario') {
        formulaInteres = 'I = P \\times r \\times \\frac{\\text{días}}{360}';
    } else if (tipoInteres === 'racional') {
        formulaInteres = 'I = P \\times r \\times \\frac{\\text{días}}{' + base + '}';
    } else {
        formulaInteres = 'I = P \\times r \\times \\frac{\\text{días}}{365}';
    }

    steps.push({
        title: 'Fórmula de Interés',
        description: 'La fórmula para este tipo de interés es:',
        formula: formulaInteres
    });

    steps.push({
        title: 'Cálculo del Interés',
        description: 'Sustituimos los valores:',
        calculation: `I = ${formatCurrency(capital)} × ${formatNumber(tasaAnual, 4)} × (${diasCalculados}/${base})\nI = ${formatCurrency(interes)}`,
        result: `Interés generado: ${formatCurrency(interes)}`
    });

    steps.push({
        title: 'Monto Final',
        formula: 'S = P + I',
        calculation: `S = ${formatCurrency(capital)} + ${formatCurrency(interes)}`,
        result: `Monto final: ${formatCurrency(montoFinal)}`
    });

    html += generateProcedureSection('interesSimple', steps);

    const resultDiv = document.getElementById('resultadoInteresSimple');
    resultDiv.innerHTML = html;
    resultDiv.classList.remove('hidden');
}

function calcularDescuento() {
    const valorFuturo = getInputValue('valorFuturoDesc');
    const tasaDesc = getInputValue('tasaDescuento') / 100;
    const fechaInicial = document.getElementById('fechaInicialDesc').value;
    const fechaFinal = document.getElementById('fechaFinalDesc').value;
    const tipoTasa = document.getElementById('tipoTasaDescuento').value;

    if (!valorFuturo || !tasaDesc || !fechaInicial || !fechaFinal) {
        alert('Por favor, complete todos los campos');
        return;
    }

    const diasExactos = calcularDiasExactos(fechaInicial, fechaFinal);
    let base = 0;

    if (tipoTasa === 'comercial' || tipoTasa === 'bancario') {
        base = 360;
    } else if (tipoTasa === 'racional') {
        const año = new Date(fechaInicial).getFullYear();
        base = esBisiesto(año) ? 366 : 365;
    } else if (tipoTasa === 'ideal') {
        base = 365;
    }

    const N = diasExactos / base;
    const factorDescuento = 1 - (tasaDesc * N);
    const valorActual = valorFuturo * factorDescuento;
    const descuento = valorFuturo - valorActual;

    let html = '<h3 class="text-xl font-bold mb-4 text-white">Resultados del Descuento</h3>';
    html += '<div class="space-y-3">';
    html += `
        <div class="result-item">
            <span class="result-label">Tipo de Tasa:</span>
            <span class="result-value">${tipoTasa.charAt(0).toUpperCase() + tipoTasa.slice(1)}</span>
        </div>
        <div class="result-item">
            <span class="result-label">Valor Futuro:</span>
            <span class="result-value">${formatCurrency(valorFuturo)}</span>
        </div>
        <div class="result-item">
            <span class="result-label">Tasa de Descuento:</span>
            <span class="result-value">${formatNumber(tasaDesc * 100, 2)}%</span>
        </div>
        <div class="result-item">
            <span class="result-label">Días Exactos:</span>
            <span class="result-value">${diasExactos}</span>
        </div>
        <div class="result-item">
            <span class="result-label">Base:</span>
            <span class="result-value">${base}</span>
        </div>
        <div class="result-item">
            <span class="result-label">Factor N:</span>
            <span class="result-value">${formatNumber(N, 6)}</span>
        </div>
        <div class="result-item">
            <span class="result-label">Descuento:</span>
            <span class="result-value">${formatCurrency(descuento)}</span>
        </div>
        <div class="result-item" style="border-top: 2px solid rgba(255,255,255,0.2); padding-top: 1rem; margin-top: 1rem;">
            <span class="result-label font-bold">Valor Actual (VT):</span>
            <span class="highlight-value">${formatCurrency(valorActual)}</span>
        </div>
    `;
    html += '</div>';

    const steps = [];

    steps.push({
        title: 'Tipo de Descuento',
        description: `Descuento ${tipoTasa} con base de ${base} días.`,
        calculation: `Valor Futuro (S): ${formatCurrency(valorFuturo)}\nTasa (d): ${formatNumber(tasaDesc * 100, 2)}%\nDías: ${diasExactos}\nBase: ${base}`
    });

    steps.push({
        title: 'Calcular Factor N',
        description: 'El factor N representa la fracción del año:',
        formula: 'N = \\frac{\\text{días}}{\\text{base}}',
        calculation: `N = ${diasExactos} ÷ ${base} = ${formatNumber(N, 6)}`
    });

    steps.push({
        title: 'Factor de Descuento',
        description: 'Calculamos el factor de descuento:',
        formula: '\\text{Factor} = 1 - (d \\times N)',
        calculation: `Factor = 1 - (${formatNumber(tasaDesc, 4)} × ${formatNumber(N, 6)})\nFactor = ${formatNumber(factorDescuento, 6)}`
    });

    steps.push({
        title: 'Valor Actual',
        description: 'Aplicamos el descuento al valor futuro:',
        formula: 'VT = S \\times \\text{Factor}',
        calculation: `VT = ${formatCurrency(valorFuturo)} × ${formatNumber(factorDescuento, 6)}\nVT = ${formatCurrency(valorActual)}`,
        result: `Valor Actual: ${formatCurrency(valorActual)}`
    });

    steps.push({
        title: 'Descuento Total',
        formula: 'D = S - VT',
        calculation: `D = ${formatCurrency(valorFuturo)} - ${formatCurrency(valorActual)}`,
        result: `Descuento: ${formatCurrency(descuento)}`
    });

    html += generateProcedureSection('descuento', steps);

    const resultDiv = document.getElementById('resultadoDescuento');
    resultDiv.innerHTML = html;
    resultDiv.classList.remove('hidden');
}

document.getElementById('calcularCompuesto')?.addEventListener('change', function () {
    const calcular = this.value;
    const vpGroup = document.getElementById('valorPresenteGroup');
    const vfGroup = document.getElementById('valorFuturoGroup');

    if (calcular === 'futuro') {
        vpGroup.classList.remove('hidden');
        vfGroup.classList.add('hidden');
    } else {
        vpGroup.classList.add('hidden');
        vfGroup.classList.remove('hidden');
    }
});

function calcularInteresCompuesto() {
    const calcular = document.getElementById('calcularCompuesto').value;
    const tasa = getInputValue('tasaCompuesto') / 100;
    const periodos = getInputValue('periodosCompuesto');

    if (!tasa || !periodos) {
        alert('Por favor, complete todos los campos');
        return;
    }

    let resultado = 0;
    let valorPresente = 0;
    let valorFuturo = 0;

    if (calcular === 'futuro') {
        valorPresente = getInputValue('valorPresente');
        if (!valorPresente) {
            alert('Por favor, ingrese el valor presente');
            return;
        }
        valorFuturo = valorPresente * Math.pow(1 + tasa, periodos);
        resultado = valorFuturo;
    } else {
        valorFuturo = getInputValue('valorFuturo');
        if (!valorFuturo) {
            alert('Por favor, ingrese el valor futuro');
            return;
        }
        valorPresente = valorFuturo / Math.pow(1 + tasa, periodos);
        resultado = valorPresente;
    }

    const interes = valorFuturo - valorPresente;

    let html = '<h3 class="text-xl font-bold mb-4 text-white">Resultados del Interés Compuesto</h3>';
    html += '<div class="space-y-3">';
    html += `
        <div class="result-item">
            <span class="result-label">Valor Presente (P):</span>
            <span class="result-value">${formatCurrency(valorPresente)}</span>
        </div>
        <div class="result-item">
            <span class="result-label">Valor Futuro (S):</span>
            <span class="result-value">${formatCurrency(valorFuturo)}</span>
        </div>
        <div class="result-item">
            <span class="result-label">Tasa Efectiva:</span>
            <span class="result-value">${formatNumber(tasa * 100, 2)}%</span>
        </div>
        <div class="result-item">
            <span class="result-label">Períodos:</span>
            <span class="result-value">${periodos}</span>
        </div>
        <div class="result-item">
            <span class="result-label">Interés Generado:</span>
            <span class="result-value">${formatCurrency(interes)}</span>
        </div>
        <div class="result-item" style="border-top: 2px solid rgba(255,255,255,0.2); padding-top: 1rem; margin-top: 1rem;">
            <span class="result-label font-bold">${calcular === 'futuro' ? 'Valor Futuro Calculado:' : 'Valor Presente Calculado:'}</span>
            <span class="highlight-value">${formatCurrency(resultado)}</span>
        </div>
    `;
    html += '</div>';

    const steps = [];

    if (calcular === 'futuro') {
        steps.push({
            title: 'Fórmula de Valor Futuro',
            description: 'Para calcular el valor futuro usamos:',
            formula: 'S = P \\times (1 + i)^n'
        });

        steps.push({
            title: 'Valores Dados',
            description: 'Identificamos los valores:',
            calculation: `P (Valor Presente) = ${formatCurrency(valorPresente)}\ni (Tasa por período) = ${formatNumber(tasa * 100, 2)}% = ${tasa}\nn (Períodos) = ${periodos}`
        });

        const factor = Math.pow(1 + tasa, periodos);
        steps.push({
            title: 'Calcular Factor',
            description: 'Calculamos (1 + i)^n:',
            formula: `(1 + ${tasa})^{${periodos}}`,
            calculation: `Factor = ${formatNumber(factor, 6)}`
        });

        steps.push({
            title: 'Valor Futuro',
            description: 'Multiplicamos el valor presente por el factor:',
            formula: `S = \\text{${formatCurrency(valorPresente).replace('$', '\\$')}} \\times \\text{${formatNumber(factor, 6)}}`,
            calculation: `S = ${formatCurrency(valorFuturo)}`,
            result: `Valor Futuro: ${formatCurrency(valorFuturo)}`
        });
    } else {
        steps.push({
            title: 'Fórmula de Valor Presente',
            description: 'Para calcular el valor presente usamos:',
            formula: 'P = \\frac{S}{(1 + i)^n}'
        });

        steps.push({
            title: 'Valores Dados',
            description: 'Identificamos los valores:',
            calculation: `S (Valor Futuro) = ${formatCurrency(valorFuturo)}\ni = ${formatNumber(tasa * 100, 2)}% = ${tasa}\nn = ${periodos}`
        });

        const factor = Math.pow(1 + tasa, periodos);
        steps.push({
            title: 'Calcular Factor',
            formula: `(1 + i)^n = ${formatNumber(factor, 6)}`,
            calculation: `Factor = ${formatNumber(factor, 6)}`
        });

        steps.push({
            title: 'Valor Presente',
            description: 'Dividimos el valor futuro entre el factor:',
            formula: `P = \\frac{${formatCurrency(valorFuturo)}}{${formatNumber(factor, 6)}}`,
            calculation: `P = ${formatCurrency(valorPresente)}`,
            result: `Valor Presente: ${formatCurrency(valorPresente)}`
        });
    }

    steps.push({
        title: 'Interés Generado',
        formula: 'I = S - P',
        calculation: `I = ${formatCurrency(valorFuturo)} - ${formatCurrency(valorPresente)}`,
        result: `Interés total: ${formatCurrency(interes)}`
    });

    html += generateProcedureSection('compuesto', steps);

    const resultDiv = document.getElementById('resultadoCompuesto');
    resultDiv.innerHTML = html;
    resultDiv.classList.remove('hidden');
}

function convertirTasa() {
    const tasaOrigen = getInputValue('tasaOrigen') / 100;
    const tipoOrigen = document.getElementById('tipoOrigen').value;
    const periodoOrigen = getInputValue('periodoOrigen');
    const tipoDestino = document.getElementById('tipoDestino').value;
    const periodoDestino = getInputValue('periodoDestino');

    if (!tasaOrigen) {
        alert('Por favor, ingrese la tasa de origen');
        return;
    }

    let tasaEfectivaOrigen = tasaOrigen;
    if (tipoOrigen === 'nominal') {
        tasaEfectivaOrigen = tasaOrigen / periodoOrigen;
    }

    const tasaEfectivaDestino = Math.pow(1 + tasaEfectivaOrigen, periodoOrigen / periodoDestino) - 1;

    let tasaResultado = tasaEfectivaDestino;
    if (tipoDestino === 'nominal') {
        tasaResultado = tasaEfectivaDestino * periodoDestino;
    }

    const nombresPeriodo = {
        1: 'Anual',
        2: 'Semestral',
        3: 'Cuatrimestral',
        4: 'Trimestral',
        6: 'Bimestral',
        12: 'Mensual'
    };

    let html = '<h3 class="text-xl font-bold mb-4 text-white">Resultados de la Conversión</h3>';
    html += '<div class="space-y-3">';
    html += `
        <div class="alert alert-info">
            <strong>Tasa Origen:</strong> ${formatNumber(tasaOrigen * 100, 4)}% 
            ${tipoOrigen === 'efectiva' ? 'Efectiva' : 'Nominal'} 
            ${nombresPeriodo[periodoOrigen]}
        </div>
        <div class="result-item">
            <span class="result-label">Tasa Efectiva Origen:</span>
            <span class="result-value">${formatNumber(tasaEfectivaOrigen * 100, 6)}%</span>
        </div>
        <div class="result-item">
            <span class="result-label">Tasa Efectiva Destino:</span>
            <span class="result-value">${formatNumber(tasaEfectivaDestino * 100, 6)}%</span>
        </div>
        <div class="result-item" style="border-top: 2px solid rgba(255,255,255,0.2); padding-top: 1rem; margin-top: 1rem;">
            <span class="result-label font-bold">Tasa Convertida:</span>
            <span class="highlight-value">${formatNumber(tasaResultado * 100, 4)}%</span>
        </div>
        <div class="alert alert-success mt-4">
            <strong>Resultado:</strong> ${formatNumber(tasaResultado * 100, 4)}% 
            ${tipoDestino === 'efectiva' ? 'Efectiva' : 'Nominal'} 
            ${nombresPeriodo[periodoDestino]}
        </div>
    `;
    html += '</div>';

    const steps = [];

    steps.push({
        title: 'Tasa Origen',
        description: `Tasa ${tipoOrigen} ${nombresPeriodo[periodoOrigen]}`,
        calculation: `Tasa = ${formatNumber(tasaOrigen * 100, 4)}%\nPeríodos por año (m₁) = ${periodoOrigen}`
    });

    if (tipoOrigen === 'nominal') {
        steps.push({
            title: 'Convertir a Efectiva',
            description: 'Primero convertimos la tasa nominal a efectiva:',
            formula: 'i = \\frac{j}{m}',
            calculation: `i = ${formatNumber(tasaOrigen * 100, 4)}% ÷ ${periodoOrigen} = ${formatNumber(tasaEfectivaOrigen * 100, 6)}%`
        });
    }

    steps.push({
        title: 'Equivalencia de Tasas',
        description: 'Calculamos la tasa efectiva equivalente:',
        formula: 'i_2 = (1 + i_1)^{\\frac{m_1}{m_2}} - 1',
        calculation: `i₂ = (1 + ${formatNumber(tasaEfectivaOrigen, 6)})^(${periodoOrigen}/${periodoDestino}) - 1\ni₂ = ${formatNumber(tasaEfectivaDestino, 6)}`
    });

    if (tipoDestino === 'nominal') {
        steps.push({
            title: 'Convertir a Nominal',
            description: 'Finalmente convertimos a tasa nominal:',
            formula: 'j = i \\times m',
            calculation: `j = ${formatNumber(tasaEfectivaDestino * 100, 6)}% × ${periodoDestino} = ${formatNumber(tasaResultado * 100, 4)}%`
        });
    }

    steps.push({
        title: 'Resultado Final',
        description: `Tasa ${tipoDestino} ${nombresPeriodo[periodoDestino]}`,
        result: `${formatNumber(tasaResultado * 100, 4)}%`
    });

    html += generateProcedureSection('conversion', steps);

    const resultDiv = document.getElementById('resultadoConversion');
    resultDiv.innerHTML = html;
    resultDiv.classList.remove('hidden');
}

let deudasArray = [];
let pagosArray = [];

function agregarDeuda() {
    const id = Date.now();
    const html = `
        <div class="item-entry" id="deuda_${id}">
            <div class="form-group">
                <label class="form-label">Valor</label>
                <input type="number" id="deuda_valor_${id}" class="input-field" placeholder="Ej: 10000" step="0.01">
            </div>
            <div class="form-group">
                <label class="form-label">Período</label>
                <input type="number" id="deuda_periodo_${id}" class="input-field" placeholder="Ej: 3" min="0">
            </div>
            <button onclick="eliminarDeuda(${id})" class="btn-danger">Eliminar</button>
        </div>
    `;
    document.getElementById('deudasContainer').insertAdjacentHTML('beforeend', html);
    deudasArray.push(id);
}

function eliminarDeuda(id) {
    document.getElementById(`deuda_${id}`).remove();
    deudasArray = deudasArray.filter(d => d !== id);
}

function agregarPago() {
    const id = Date.now();
    const html = `
        <div class="item-entry" id="pago_${id}">
            <div class="form-group">
                <label class="form-label">Valor</label>
                <input type="number" id="pago_valor_${id}" class="input-field" placeholder="Ej: 5000" step="0.01">
            </div>
            <div class="form-group">
                <label class="form-label">Período</label>
                <input type="number" id="pago_periodo_${id}" class="input-field" placeholder="Ej: 5" min="0">
            </div>
            <button onclick="eliminarPago(${id})" class="btn-danger">Eliminar</button>
        </div>
    `;
    document.getElementById('pagosContainer').insertAdjacentHTML('beforeend', html);
    pagosArray.push(id);
}

function eliminarPago(id) {
    document.getElementById(`pago_${id}`).remove();
    pagosArray = pagosArray.filter(p => p !== id);
}

function calcularEcuacion() {
    const tasa = getInputValue('tasaEcuacion') / 100;
    const focal = getInputValue('fechaFocal');
    const tipoX = document.getElementById('tipoX').value;
    const periodoX = getInputValue('periodoX');

    if (isNaN(tasa) || isNaN(focal) || isNaN(periodoX)) {
        alert('Por favor, complete todos los campos requeridos');
        return;
    }

    let totalDeudas = 0;
    const detalleDeudas = [];

    deudasArray.forEach(id => {
        const valor = getInputValue(`deuda_valor_${id}`) || 0;
        const periodo = getInputValue(`deuda_periodo_${id}`) || 0;
        const n = focal - periodo;
        const valorTraslado = valor * Math.pow(1 + tasa, n);
        totalDeudas += valorTraslado;
        detalleDeudas.push({ valor, periodo, valorTraslado });
    });

    let totalPagos = 0;
    const detallePagos = [];

    pagosArray.forEach(id => {
        const valor = getInputValue(`pago_valor_${id}`) || 0;
        const periodo = getInputValue(`pago_periodo_${id}`) || 0;
        const n = focal - periodo;
        const valorTraslado = valor * Math.pow(1 + tasa, n);
        totalPagos += valorTraslado;
        detallePagos.push({ valor, periodo, valorTraslado });
    });

    const factorX = Math.pow(1 + tasa, focal - periodoX);
    let valorX = 0;

    if (tipoX === 'deuda') {
        valorX = (totalPagos - totalDeudas) / factorX;
    } else {
        valorX = (totalDeudas - totalPagos) / factorX;
    }

    let html = '<h3 class="text-xl font-bold mb-4 text-white">Resultados de la Ecuación de Valor</h3>';
    html += '<div class="space-y-3">';
    html += `
        <div class="result-item">
            <span class="result-label">Fecha Focal:</span>
            <span class="result-value">Período ${focal}</span>
        </div>
        <div class="result-item">
            <span class="result-label">Tasa de Interés:</span>
            <span class="result-value">${formatNumber(tasa * 100, 2)}%</span>
        </div>
        <div class="result-item">
            <span class="result-label">Total Deudas (en fecha focal):</span>
            <span class="result-value">${formatCurrency(totalDeudas)}</span>
        </div>
        <div class="result-item">
            <span class="result-label">Total Pagos (en fecha focal):</span>
            <span class="result-value">${formatCurrency(totalPagos)}</span>
        </div>
        <div class="result-item">
            <span class="result-label">Tipo de X:</span>
            <span class="result-value">${tipoX === 'deuda' ? 'Deuda' : 'Pago'}</span>
        </div>
        <div class="result-item">
            <span class="result-label">Período de X:</span>
            <span class="result-value">Período ${periodoX}</span>
        </div>
        <div class="result-item" style="border-top: 2px solid rgba(255,255,255,0.2); padding-top: 1rem; margin-top: 1rem;">
            <span class="result-label font-bold">Valor de X:</span>
            <span class="highlight-value">${formatCurrency(valorX)}</span>
        </div>
    `;
    html += '</div>';

    const steps = [];

    steps.push({
        title: 'Parámetros de la Ecuación',
        description: 'Valores de referencia:',
        calculation: `Fecha Focal: Período ${focal}\nTasa de interés: ${formatNumber(tasa * 100, 2)}%`
    });

    steps.push({
        title: 'Trasladar Deudas a Fecha Focal',
        description: 'Cada deuda se traslada usando:',
        formula: 'V_{focal} = V \\times (1 + i)^{(focal - período)}',
        calculation: `Total deudas en fecha focal: ${formatCurrency(totalDeudas)}`
    });

    steps.push({
        title: 'Trasladar Pagos a Fecha Focal',
        description: 'Cada pago se traslada de la misma forma:',
        calculation: `Total pagos en fecha focal: ${formatCurrency(totalPagos)}`
    });

    steps.push({
        title: 'Factor de X',
        description: `X está en el período ${periodoX}, factor de traslado:`,
        formula: `\\text{factor}_X = (1 + ${tasa})^{(${focal} - ${periodoX})}`,
        calculation: `Factor = ${formatNumber(factorX, 6)}`
    });

    const formulaX = tipoX === 'deuda' ?
        'X = \\frac{\\text{Total Pagos} - \\text{Total Deudas}}{\\text{factor}_X}' :
        'X = \\frac{\\text{Total Deudas} - \\text{Total Pagos}}{\\text{factor}_X}';

    steps.push({
        title: `Calcular X (${tipoX === 'deuda' ? 'Deuda' : 'Pago'})`,
        description: 'Despejamos X de la ecuación de valor:',
        formula: formulaX,
        calculation: `X = ${formatCurrency(valorX)}`,
        result: `Valor de X: ${formatCurrency(valorX)}`
    });

    html += generateProcedureSection('ecuacion', steps);

    const resultDiv = document.getElementById('resultadoEcuacion');
    resultDiv.innerHTML = html;
    resultDiv.classList.remove('hidden');
}

function toggleDiferimiento() {
    const tipo = document.getElementById('tipoAnualidad').value;
    const diferimientoGroup = document.getElementById('diferimientoGroup');
    const periodosGroup = document.getElementById('periodosAnualidadGroup');

    if (tipo === 'diferida') {
        diferimientoGroup.classList.remove('hidden');
    } else {
        diferimientoGroup.classList.add('hidden');
    }

    if (tipo === 'perpetua') {
        periodosGroup.classList.add('hidden');
    } else {
        periodosGroup.classList.remove('hidden');
    }
}

function toggleAnualidadFields() {
    const calcular = document.getElementById('calcularAnualidad').value;
    const pagoGroup = document.getElementById('pagoAnualidadGroup');
    const vpGroup = document.getElementById('valorPresenteAnualidadGroup');
    const vfGroup = document.getElementById('valorFuturoAnualidadGroup');

    if (calcular === 'p' || calcular === 's') {
        pagoGroup.classList.remove('hidden');
        vpGroup.classList.add('hidden');
        vfGroup.classList.add('hidden');
    } else if (calcular === 'a') {
        pagoGroup.classList.add('hidden');
        vpGroup.classList.remove('hidden');
        vfGroup.classList.remove('hidden');
    }
}

function calcularAnualidad() {
    const tipoAnualidad = document.getElementById('tipoAnualidad').value;
    const calcular = document.getElementById('calcularAnualidad').value;
    const tasa = parseFormattedNumber(document.getElementById('tasaAnualidad').value) / 100;

    if (isNaN(tasa)) {
        alert('Por favor, ingrese la tasa de interés');
        return;
    }

    let resultado = 0;
    let A, P, S, n, k;

    if (tipoAnualidad === 'perpetua') {
        if (calcular === 'p') {
            A = parseFloat(document.getElementById('pagoAnualidad').value);
            
            if (!A) {
                alert('Por favor, ingrese el pago periódico');
                return;
            }
            // P = A / i
            resultado = A / tasa;
        } else if (calcular === 'a') {
            P = parseFloat(document.getElementById('valorPresenteAnualidad').value);
            if (!P) {
                alert('Por favor, ingrese el valor presente');
                return;
            }
            // A = P × i
            resultado = P * tasa;
        } else {
            alert('No se puede calcular valor futuro para anualidad perpetua');
            return;
        }
    } else {
        n = parseInt(document.getElementById('periodosAnualidad').value);
        if (!n) {
            alert('Por favor, ingrese el número de períodos');
            return;
        }

        k = 0;
        if (tipoAnualidad === 'diferida') {
            k = parseInt(document.getElementById('diferimiento').value) || 0;
        }

        if (calcular === 'p') {
            A = parseFormattedNumber(document.getElementById('pagoAnualidad').value);
            if (!A) {
                alert('Por favor, ingrese el pago periódico');
                return;
            }

            // Calcular P según el tipo de anualidad
            const factor = (1 - Math.pow(1 + tasa, -n)) / tasa;

            if (tipoAnualidad === 'ordinaria') {
                // P = A × [(1 - (1 + i)^(-n)) / i]
                resultado = A * factor;
            } else if (tipoAnualidad === 'anticipada') {
                // P = A × [(1 - (1 + i)^(-n)) / i] × (1 + i)
                resultado = A * factor * (1 + tasa);
            } else if (tipoAnualidad === 'diferida') {
                // P = A × [(1 - (1 + i)^(-n)) / i] × (1 + i)^(-k)
                resultado = A * factor * Math.pow(1 + tasa, -k);
            }
        } else if (calcular === 's') {
            A = getInputValue('pagoAnualidad');
            if (!A) {
                alert('Por favor, ingrese el pago periódico');
                return;
            }

            const factor = (Math.pow(1 + tasa, n) - 1) / tasa;

            if (tipoAnualidad === 'ordinaria') {
                // S = A × [(1 + i)^n - 1] / i
                resultado = A * factor;
            } else if (tipoAnualidad === 'anticipada') {
                // S = A × [(1 + i)^n - 1] / i × (1 + i)
                resultado = A * factor * (1 + tasa);
            } else if (tipoAnualidad === 'diferida') {
                // S = A × [(1 + i)^n - 1] / i × (1 + i)^k
                resultado = A * factor * Math.pow(1 + tasa, k);
            }
        } else if (calcular === 'a') {
            P = getInputValue('valorPresenteAnualidad');
            S = getInputValue('valorFuturoAnualidad');

            if (P) {
                const factor = (1 - Math.pow(1 + tasa, -n)) / tasa;

                if (tipoAnualidad === 'ordinaria') {
                    resultado = P / factor;
                } else if (tipoAnualidad === 'anticipada') {
                    resultado = P / (factor * (1 + tasa));
                } else if (tipoAnualidad === 'diferida') {
                    resultado = P / (factor * Math.pow(1 + tasa, -k));
                }
            } else if (S) {
                const factor = (Math.pow(1 + tasa, n) - 1) / tasa;

                if (tipoAnualidad === 'ordinaria') {
                    resultado = S / factor;
                } else if (tipoAnualidad === 'anticipada') {
                    resultado = S / (factor * (1 + tasa));
                } else if (tipoAnualidad === 'diferida') {
                    resultado = S / (factor * Math.pow(1 + tasa, k));
                }
            } else {
                alert('Por favor, ingrese el valor presente o el valor futuro');
                return;
            }
        }
    }

    const nombres = {
        'ordinaria': 'Ordinaria o Vencida',
        'anticipada': 'Anticipada',
        'diferida': 'Diferida',
        'perpetua': 'Perpetua'
    };

    let html = '<h3 class="text-xl font-bold mb-4 text-white">Resultados de la Anualidad</h3>';
    html += '<div class="space-y-3">';
    html += `
        <div class="result-item">
            <span class="result-label">Tipo de Anualidad:</span>
            <span class="result-value">${nombres[tipoAnualidad]}</span>
        </div>
        <div class="result-item">
            <span class="result-label">Tasa de Interés:</span>
            <span class="result-value">${formatNumber(tasa * 100, 2)}%</span>
        </div>
    `;

    if (tipoAnualidad !== 'perpetua') {
        html += `
            <div class="result-item">
                <span class="result-label">Número de Períodos:</span>
                <span class="result-value">${n}</span>
            </div>
        `;
    }

    if (tipoAnualidad === 'diferida') {
        html += `
            <div class="result-item">
                <span class="result-label">Períodos de Diferimiento:</span>
                <span class="result-value">${k}</span>
            </div>
        `;
    }

    let resultadoLabel = '';
    if (calcular === 'p') {
        resultadoLabel = 'Valor Presente (P):';
    } else if (calcular === 's') {
        resultadoLabel = 'Valor Futuro (S):';
    } else if (calcular === 'a') {
        resultadoLabel = 'Pago Periódico (A):';
    }

    html += `
        <div class="result-item" style="border-top: 2px solid rgba(255,255,255,0.2); padding-top: 1rem; margin-top: 1rem;">
            <span class="result-label font-bold">${resultadoLabel}</span>
            <span class="highlight-value">${formatCurrency(resultado)}</span>
        </div>
    `;
    html += '</div>';

    const steps = [];

    steps.push({
        title: 'Tipo de Anualidad',
        description: `Anualidad ${nombres[tipoAnualidad]}`,
        calculation: `Tasa por período: ${formatNumber(tasa * 100, 2)}%${tipoAnualidad !== 'perpetua' ? `\nPeríodos (n): ${n}` : ''}${tipoAnualidad === 'diferida' ? `\nDiferimiento (k): ${k}` : ''}`
    });

    if (tipoAnualidad === 'perpetua') {
        if (calcular === 'p') {
            steps.push({
                title: 'Fórmula de Anualidad Perpetua',
                description: 'Para valor presente de anualidad perpetua:',
                formula: 'P = \\frac{A}{i}'
            });

            steps.push({
                title: 'Cálculo',
                calculation: `P = ${formatCurrency(A)} ÷ ${formatNumber(tasa, 4)} = ${formatCurrency(resultado)}`,
                result: `Valor Presente: ${formatCurrency(resultado)}`
            });
        } else {
            steps.push({
                title: 'Fórmula de Anualidad Perpetua',
                formula: 'A = P \\times i',
                calculation: `A = ${formatCurrency(P)} × ${formatNumber(tasa, 4)} = ${formatCurrency(resultado)}`,
                result: `Pago Periódico: ${formatCurrency(resultado)}`
            });
        }
    } else {
        if (calcular === 'p') {
            let formulaBase = 'P = A \\times \\frac{1 - (1 + i)^{-n}}{i}';
            if (tipoAnualidad === 'anticipada') {
                formulaBase += ' \\times (1 + i)';
            } else if (tipoAnualidad === 'diferida') {
                formulaBase += ' \\times (1 + i)^{-k}';
            }

            steps.push({
                title: 'Fórmula de Valor Presente',
                formula: formulaBase
            });

            const factor = (1 - Math.pow(1 + tasa, -n)) / tasa;
            steps.push({
                title: 'Calcular Factor',
                description: 'Calculamos el factor de anualidad:',
                calculation: `Factor = ${formatNumber(factor, 6)}`
            });

            steps.push({
                title: 'Resultado',
                calculation: `P = ${formatCurrency(A)} × ${formatNumber(factor, 6)}${tipoAnualidad === 'anticipada' ? ' × (1 + ' + tasa + ')' : ''}${tipoAnualidad === 'diferida' ? ' × (1 + ' + tasa + ')^(-' + k + ')' : ''} = ${formatCurrency(resultado)}`,
                result: `Valor Presente: ${formatCurrency(resultado)}`
            });
        } else if (calcular === 's') {
            let formulaBase = 'S = A \\times \\frac{(1 + i)^n - 1}{i}';
            if (tipoAnualidad === 'anticipada') {
                formulaBase += ' \\times (1 + i)';
            } else if (tipoAnualidad === 'diferida') {
                formulaBase += ' \\times (1 + i)^k';
            }

            steps.push({
                title: 'Fórmula de Valor Futuro',
                formula: formulaBase
            });

            const factor = (Math.pow(1 + tasa, n) - 1) / tasa;
            steps.push({
                title: 'Calcular Factor',
                calculation: `Factor = ${formatNumber(factor, 6)}`
            });

            steps.push({
                title: 'Resultado',
                calculation: `S = ${formatCurrency(A)} × ${formatNumber(factor, 6)} = ${formatCurrency(resultado)}`,
                result: `Valor Futuro: ${formatCurrency(resultado)}`
            });
        } else {
            steps.push({
                title: 'Calcular Pago Periódico',
                description: `Despejamos A de la fórmula de ${P ? 'valor presente' : 'valor futuro'}:`,
                calculation: `A = ${formatCurrency(resultado)}`,
                result: `Pago Periódico: ${formatCurrency(resultado)}`
            });
        }
    }

    html += generateProcedureSection('anualidad', steps);

    const resultDiv = document.getElementById('resultadoAnualidad');
    resultDiv.innerHTML = html;
    resultDiv.classList.remove('hidden');
}

function toggleAbonoFields() {
    const caso = document.getElementById('casoAmortizacion').value;
    const container = document.getElementById('abonosContainer');

    if (caso === 'normal') {
        container.classList.add('hidden');
    } else {
        container.classList.remove('hidden');
    }
}

function calcularAmortizacion() {
    const P = getInputValue('montoAmortizacion');
    const tasa = getInputValue('tasaAmortizacion') / 100;
    const n = getInputValue('periodosAmortizacion');
    const caso = document.getElementById('casoAmortizacion').value;

    if (!P || !tasa || !n) {
        alert('Por favor, complete todos los campos requeridos');
        return;
    }

    const cuotaFija = (P * tasa) / (1 - Math.pow(1 + tasa, -n));

    let periodoAbono = 0;
    let valorAbono = 0;

    if (caso !== 'normal') {
        periodoAbono = getInputValue('periodoAbono');
        valorAbono = getInputValue('valorAbono');

        if (!periodoAbono || !valorAbono) {
            alert('Por favor, complete los datos del abono');
            return;
        }
    }

    const tabla = [];
    let saldo = P;
    let cuotaActual = cuotaFija;
    let periodoReal = 0;

    for (let periodo = 1; saldo > 0.01 && periodoReal < n + 50; periodo++) {
        periodoReal = periodo;
        const interes = saldo * tasa;
        let cuota = cuotaActual;

        if (caso !== 'normal' && periodo === periodoAbono) {
            cuota = cuotaActual + valorAbono;
        }
        if (cuota > saldo + interes) {
            cuota = saldo + interes;
        }

        const amortizacion = cuota - interes;
        const nuevoSaldo = saldo - amortizacion;

        tabla.push({
            periodo,
            saldo: saldo,
            interes,
            amortizacion,
            cuota,
            nuevoSaldo: Math.max(0, nuevoSaldo)
        });

        saldo = nuevoSaldo;

        if (caso === 'reduceCuota' && periodo === periodoAbono) {
            const periodosRestantes = n - periodo;
            if (periodosRestantes > 0 && saldo > 0) {
                cuotaActual = (saldo * tasa) / (1 - Math.pow(1 + tasa, -periodosRestantes));
            }
        }
    }

    let html = '<h3 class="text-xl font-bold mb-4 text-white">Tabla de Amortización</h3>';
    html += '<div class="space-y-4">';
    html += `
        <div class="alert alert-info">
            <strong>Cuota Fija Inicial:</strong> ${formatCurrency(cuotaFija)}
        </div>
    `;

    if (caso !== 'normal') {
        html += `
            <div class="alert alert-warning">
                <strong>Abono:</strong> ${formatCurrency(valorAbono)} en el período ${periodoAbono}
                ${caso === 'reduceCuota' ? ' (Reduce la cuota)' : ' (Reduce el tiempo)'}
            </div>
        `;
    }

    html += '<div class="overflow-x-auto">';
    html += '<table class="data-table">';
    html += `
        <thead>
            <tr>
                <th>Período</th>
                <th>Saldo Inicial</th>
                <th>Interés</th>
                <th>Amortización</th>
                <th>Cuota</th>
                <th>Saldo Final</th>
            </tr>
        </thead>
        <tbody>
    `;

    tabla.forEach(row => {
        html += `
            <tr>
                <td>${row.periodo}</td>
                <td>${formatCurrency(row.saldo)}</td>
                <td>${formatCurrency(row.interes)}</td>
                <td>${formatCurrency(row.amortizacion)}</td>
                <td>${formatCurrency(row.cuota)}</td>
                <td>${formatCurrency(row.nuevoSaldo)}</td>
            </tr>
        `;
    });

    html += '</tbody></table></div>';

    const totalIntereses = tabla.reduce((sum, row) => sum + row.interes, 0);
    const totalPagado = tabla.reduce((sum, row) => sum + row.cuota, 0);

    html += `
        <div class="grid md:grid-cols-3 gap-4 mt-4">
            <div class="result-item">
                <span class="result-label">Períodos Reales:</span>
                <span class="result-value">${tabla.length}</span>
            </div>
            <div class="result-item">
                <span class="result-label">Total Intereses:</span>
                <span class="result-value">${formatCurrency(totalIntereses)}</span>
            </div>
            <div class="result-item">
                <span class="result-label">Total Pagado:</span>
                <span class="highlight-value">${formatCurrency(totalPagado)}</span>
            </div>
        </div>
    `;

    html += '</div>';

    const steps = [];

    steps.push({
        title: 'Método de Amortización',
        description: 'Método Francés (cuota fija)',
        calculation: `Monto del préstamo (P): ${formatCurrency(P)}\nTasa por período (i): ${formatNumber(tasa * 100, 2)}%\nNúmero de períodos (n): ${n}`
    });

    steps.push({
        title: 'Cálculo de la Cuota',
        description: 'La cuota fija se calcula con:',
        formula: 'A = \\frac{P \\times i}{1 - (1 + i)^{-n}}',
        calculation: `Cuota = ${formatCurrency(cuotaFija)}`,
        result: `Cuota fija: ${formatCurrency(cuotaFija)}`
    });

    if (caso !== 'normal') {
        steps.push({
            title: 'Abono Extraordinario',
            description: `Abono de ${formatCurrency(valorAbono)} en el período ${periodoAbono}`,
            calculation: caso === 'reduceTiempo' ?
                'El abono reduce el número de períodos' :
                'El abono reduce la cuota de los períodos restantes'
        });
    }

    steps.push({
        title: 'Tabla de Amortización',
        description: 'Para cada período se calcula:',
        formula: '\\begin{aligned} I_t &= \\text{Saldo}_{t-1} \\times i \\\\ \\text{Amor}_t &= A - I_t \\\\ \\text{Saldo}_t &= \\text{Saldo}_{t-1} - \\text{Amor}_t \\end{aligned}',
        calculation: `Total períodos reales: ${tabla.length}`
    });

    steps.push({
        title: 'Totales',
        calculation: `Total intereses pagados: ${formatCurrency(totalIntereses)}\nTotal pagado: ${formatCurrency(totalPagado)}`,
        result: `Crédito completamente amortizado en ${tabla.length} períodos`
    });

    html += generateProcedureSection('amortizacion', steps);

    const resultDiv = document.getElementById('resultadoAmortizacion');
    resultDiv.innerHTML = html;
    resultDiv.classList.remove('hidden');
}

function calcularCapitalizacion() {
    const S = getInputValue('valorFuturoCapitalizacion');
    const tasa = getInputValue('tasaCapitalizacion') / 100;
    const n = getInputValue('periodosCapitalizacion');

    if (!S || !tasa || !n) {
        alert('Por favor, complete todos los campos');
        return;
    }

    const A = S / ((Math.pow(1 + tasa, n) - 1) / tasa);

    const tabla = [];
    let saldo = 0;

    for (let periodo = 1; periodo <= n; periodo++) {
        let interes = 0;
        let incremento = A;

        if (periodo === 1) {
            incremento = A;
            saldo = A;
        } else {
            interes = saldo * tasa;
            incremento = A + interes;
            saldo = saldo + incremento;
        }

        if (periodo === n) {
            saldo = S;
        }

        tabla.push({
            periodo,
            cuota: A,
            interes,
            incremento,
            saldo
        });
    }

    let html = '<h3 class="text-xl font-bold mb-4 text-white">Tabla de Capitalización</h3>';
    html += '<div class="space-y-4">';
    html += `
        <div class="alert alert-info">
            <strong>Cuota Periódica:</strong> ${formatCurrency(A)}
        </div>
        <div class="alert alert-success">
            <strong>Valor Futuro Objetivo:</strong> ${formatCurrency(S)}
        </div>
    `;

    html += '<div class="overflow-x-auto">';
    html += '<table class="data-table">';
    html += `
        <thead>
            <tr>
                <th>Período</th>
                <th>Cuota</th>
                <th>Interés Ganado</th>
                <th>Incremento Total</th>
                <th>Saldo Acumulado</th>
            </tr>
        </thead>
        <tbody>
    `;

    tabla.forEach(row => {
        html += `
            <tr>
                <td>${row.periodo}</td>
                <td>${formatCurrency(row.cuota)}</td>
                <td>${formatCurrency(row.interes)}</td>
                <td>${formatCurrency(row.incremento)}</td>
                <td>${formatCurrency(row.saldo)}</td>
            </tr>
        `;
    });

    html += '</tbody></table></div>';

    const totalCuotas = tabla.reduce((sum, row) => sum + row.cuota, 0);
    const totalIntereses = tabla.reduce((sum, row) => sum + row.interes, 0);

    html += `
        <div class="grid md:grid-cols-3 gap-4 mt-4">
            <div class="result-item">
                <span class="result-label">Total Cuotas:</span>
                <span class="result-value">${formatCurrency(totalCuotas)}</span>
            </div>
            <div class="result-item">
                <span class="result-label">Total Intereses:</span>
                <span class="result-value">${formatCurrency(totalIntereses)}</span>
            </div>
            <div class="result-item">
                <span class="result-label">Saldo Final:</span>
                <span class="highlight-value">${formatCurrency(S)}</span>
            </div>
        </div>
    `;

    html += '</div>';

    const steps = [];

    steps.push({
        title: 'Objetivo de Capitalización',
        description: 'Objetivo de ahorro:',
        calculation: `Valor futuro objetivo (S): ${formatCurrency(S)}\nTasa por período (i): ${formatNumber(tasa * 100, 2)}%\nNúmero de períodos (n): ${n}`
    });

    steps.push({
        title: 'Cálculo de la Cuota Periódica',
        description: 'La cuota necesaria se calcula con:',
        formula: 'A = \\frac{S}{\\frac{(1 + i)^n - 1}{i}}',
        calculation: `Cuota periódica: ${formatCurrency(A)}`,
        result: `Depositar ${formatCurrency(A)} cada período`
    });

    steps.push({
        title: 'Proceso de Capitalización',
        description: 'En cada período:',
        formula: '\\begin{aligned} I_t &= \\text{Saldo}_{t-1} \\times i \\\\ \\text{Incr}_t &= A + I_t \\\\ \\text{Saldo}_t &= \\text{Saldo}_{t-1} + \\text{Incr}_t \\end{aligned}',
        calculation: `Total períodos: ${n}`
    });

    steps.push({
        title: 'Resultados Finales',
        calculation: `Total depositado en cuotas: ${formatCurrency(totalCuotas)}\nTotal intereses ganados: ${formatCurrency(totalIntereses)}\nSaldo final: ${formatCurrency(S)}`,
        result: `Meta de ${formatCurrency(S)} alcanzada exitosamente`
    });

    html += generateProcedureSection('capitalizacion', steps);

    const resultDiv = document.getElementById('resultadoCapitalizacion');
    resultDiv.innerHTML = html;
    resultDiv.classList.remove('hidden');
}

document.addEventListener('DOMContentLoaded', function () {
    generateRepartoInputs();
    setupFormattedInputs();
    agregarDeuda();
    agregarPago();
    console.log('✅ Calculadora Financiera inicializada correctamente');
});

function renderFormula(formula) {
    try {
        if (typeof katex !== 'undefined') {
            return katex.renderToString(formula, {
                throwOnError: false,
                displayMode: true
            });
        }
    } catch (e) {
        console.error('KaTeX error:', e);
    }
    return formula;
}

function toggleProcedure(procedureId) {
    const content = document.getElementById(procedureId);
    const button = content.previousElementSibling;

    if (content.classList.contains('show')) {
        content.classList.remove('show');
        button.classList.remove('active');
    } else {
        content.classList.add('show');
        button.classList.add('active');

        setTimeout(() => {
            content.querySelectorAll('.step-formula').forEach(elem => {
                if (elem.dataset.latex && !elem.dataset.rendered) {
                    elem.innerHTML = renderFormula(elem.dataset.latex);
                    elem.dataset.rendered = 'true';
                }
            });
        }, 100);
    }
}

function generateProcedureSection(containerId, steps) {
    const procedureId = `procedure-${containerId}`;

    let html = `
        <div class="procedure-container">
            <button class="procedure-toggle" onclick="toggleProcedure('${procedureId}')">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
                📝 Ver Procedimiento Paso a Paso
            </button>
            <div class="procedure-content" id="${procedureId}">
                <div class="procedure-steps">
    `;

    steps.forEach((step, index) => {
        html += `
            <div class="procedure-step">
                <div class="step-title">
                    <span class="step-number">${index + 1}</span>
                    ${step.title}
                </div>
                <div class="step-description">${step.description || ''}</div>
        `;

        if (step.formula) {
            html += `
                <div class="step-formula" data-latex="${step.formula.replace(/"/g, '&quot;')}">
                    ${step.formula}
                </div>
            `;
        }

        if (step.calculation) {
            html += `<div class="step-calculation">${step.calculation.replace(/\n/g, '<br>')}</div>`;
        }

        if (step.result) {
            html += `<div class="step-result">✓ ${step.result}</div>`;
        }

        html += `</div>`;
    });

    html += `
                </div>
            </div>
        </div>
    `;

    return html;
}
