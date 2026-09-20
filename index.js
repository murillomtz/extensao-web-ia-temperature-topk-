console.log('[Web AI Extension v5] index.js carregado')

const aiContext = {
    session: null,
    abortController: null,
    isGenerating: false,
    params: null,
    ready: false,
    needsPreparation: false,
    isPreparing: false
}

const elements = {
    temperature: document.getElementById('temperature'),
    temperatureValue: document.getElementById('temp-value'),
    topK: document.getElementById('topK'),
    topKValue: document.getElementById('topk-value'),
    language: document.getElementById('language'),

    form: document.getElementById('question-form'),
    questionInput: document.getElementById('question'),
    output: document.getElementById('output'),
    button: document.getElementById('ask-button'),
    status: document.getElementById('status'),
    year: document.getElementById('year'),

    defaultTemperature: document.getElementById('default-temperature'),
    maxTemperature: document.getElementById('max-temperature'),
    defaultTopK: document.getElementById('default-topk'),
    maxTopK: document.getElementById('max-topk')
}

function setStatus(message, type = 'info') {
    elements.status.textContent = message
    elements.status.dataset.type = type
}

function englishModelOptions() {
    return {
        expectedInputs: [
            {
                type: 'text',
                languages: ['en']
            }
        ],
        expectedOutputs: [
            {
                type: 'text',
                languages: ['en']
            }
        ]
    }
}

function selectedLanguageOptions() {
    const language = elements.language.value
    const supported = ['en', 'es', 'fr', 'de', 'ja']

    if (!supported.includes(language)) {
        // Português permanece apenas como experimento.
        return {}
    }

    return {
        expectedInputs: [
            {
                type: 'text',
                languages: language === 'en' ? ['en'] : ['en', language]
            }
        ],
        expectedOutputs: [
            {
                type: 'text',
                languages: [language]
            }
        ]
    }
}

function applyParams(params) {
    aiContext.params = params

    elements.defaultTemperature.textContent = params.defaultTemperature
    elements.maxTemperature.textContent = params.maxTemperature
    elements.defaultTopK.textContent = params.defaultTopK
    elements.maxTopK.textContent = params.maxTopK

    elements.temperature.min = 0
    elements.temperature.max = params.maxTemperature
    elements.temperature.step = 0.1
    elements.temperature.value = params.defaultTemperature
    elements.temperatureValue.textContent = params.defaultTemperature

    elements.topK.min = 1
    elements.topK.max = params.maxTopK
    elements.topK.value = params.defaultTopK
    elements.topKValue.textContent = params.defaultTopK

    aiContext.ready = true
    aiContext.needsPreparation = false

    elements.button.disabled = false
    elements.button.textContent = 'Enviar'

    setStatus(
        `Pronto — Temperature ${params.defaultTemperature}/${params.maxTemperature} | ` +
        `Top K ${params.defaultTopK}/${params.maxTopK}`,
        'success'
    )

    console.log('[v5] LanguageModel.params():', params)
}

async function loadParamsAfterModelIsReady() {
    const params = await LanguageModel.params()

    console.log('[v5] params retornado:', params)

    if (!params) {
        throw new Error(
            'O modelo foi inicializado, mas LanguageModel.params() ainda retornou null. ' +
            'Confira chrome://on-device-internals.'
        )
    }

    applyParams(params)
}

async function prepareModel() {
    if (aiContext.isPreparing) {
        return
    }

    aiContext.isPreparing = true
    elements.button.disabled = true
    elements.button.textContent = 'Preparando modelo...'

    setStatus(
        'Preparando Gemini Nano. Se o modelo ainda não estiver instalado, o Chrome iniciará o download...',
        'warning'
    )

    try {
        console.log('[v5] Chamando LanguageModel.create() para preparar/baixar o modelo')

        const bootstrapSession = await LanguageModel.create({
            ...englishModelOptions(),

            monitor(monitor) {
                monitor.addEventListener('downloadprogress', (event) => {
                    const percent = Math.round(event.loaded * 100)

                    console.log(`[v5] Download: ${percent}%`)

                    setStatus(
                        `Baixando Gemini Nano: ${percent}%`,
                        'warning'
                    )
                })
            }
        })

        console.log('[v5] Modelo/sessão bootstrap pronta')

        bootstrapSession.destroy()

        setStatus(
            'Modelo pronto. Lendo Temperature e Top K...',
            'success'
        )

        await loadParamsAfterModelIsReady()

    } catch (error) {
        console.error('[v5] Erro ao preparar modelo:', error)

        aiContext.ready = false
        aiContext.needsPreparation = true

        elements.button.disabled = false
        elements.button.textContent = 'Tentar preparar modelo novamente'

        elements.output.textContent = `Erro: ${error.message}`

        setStatus(
            `Não foi possível preparar o modelo: ${error.message}`,
            'error'
        )

    } finally {
        aiContext.isPreparing = false
    }
}

function setupEventListeners() {
    elements.temperature.addEventListener('input', (event) => {
        elements.temperatureValue.textContent = event.target.value
    })

    elements.topK.addEventListener('input', (event) => {
        elements.topKValue.textContent = event.target.value
    })

    elements.language.addEventListener('change', () => {
        if (elements.language.value === 'pt') {
            setStatus(
                'Português é experimental. Temperature e Top K continuam válidos, mas a saída PT-BR não é oficialmente suportada.',
                'warning'
            )
        } else if (aiContext.ready) {
            setStatus(
                `Pronto — Temperature ${aiContext.params.defaultTemperature}/${aiContext.params.maxTemperature} | ` +
                `Top K ${aiContext.params.defaultTopK}/${aiContext.params.maxTopK}`,
                'success'
            )
        }
    })

    elements.form.addEventListener('submit', async (event) => {
        event.preventDefault()

        // Este clique fornece a ativação de usuário necessária para create().
        if (!aiContext.ready) {
            if (aiContext.needsPreparation) {
                await prepareModel()
            }

            return
        }

        if (aiContext.isGenerating) {
            stopGeneration()
            return
        }

        await onSubmitQuestion()
    })
}

async function onSubmitQuestion() {
    if (!aiContext.ready || !aiContext.params) {
        return
    }

    const question = elements.questionInput.value.trim()

    if (!question) {
        elements.output.textContent = 'Digite uma pergunta.'
        return
    }

    const temperature = Number(elements.temperature.value)
    const topK = Number(elements.topK.value)

    if (
        !Number.isFinite(temperature) ||
        temperature < 0 ||
        temperature > aiContext.params.maxTemperature
    ) {
        elements.output.textContent =
            `Temperature deve ficar entre 0 e ${aiContext.params.maxTemperature}.`
        return
    }

    if (
        !Number.isInteger(topK) ||
        topK < 1 ||
        topK > aiContext.params.maxTopK
    ) {
        elements.output.textContent =
            `Top K deve ser inteiro entre 1 e ${aiContext.params.maxTopK}.`
        return
    }

    toggleSendOrStopButton(true)
    elements.output.textContent = ''

    try {
        const stream = askAI(question, temperature, topK)

        for await (const chunk of stream) {
            if (aiContext.abortController?.signal.aborted) {
                break
            }

            elements.output.textContent += chunk
        }

    } catch (error) {
        if (error.name === 'AbortError') {
            return
        }

        console.error('[v5] Erro no prompt:', error)
        elements.output.textContent = `Erro: ${error.message}`

    } finally {
        toggleSendOrStopButton(false)
    }
}

async function* askAI(question, temperature, topK) {
    aiContext.abortController?.abort()
    aiContext.abortController = new AbortController()

    if (aiContext.session) {
        aiContext.session.destroy()
        aiContext.session = null
    }

    console.log('[v5] Criando sessão experimental:', {
        temperature,
        topK,
        language: elements.language.value
    })

    const session = await LanguageModel.create({
        ...selectedLanguageOptions(),

        // No contexto de Chrome Extension, ambos devem ser enviados juntos.
        temperature,
        topK,

        initialPrompts: [
            {
                role: 'system',
                content:
                    'You are a concise AI assistant. ' +
                    'Follow the user request and answer using plain text.'
            }
        ]
    })

    aiContext.session = session

    console.log('[v5] Sessão criada:', {
        temperature: session.temperature,
        topK: session.topK
    })

    const responseStream = session.promptStreaming(
        question,
        {
            signal: aiContext.abortController.signal
        }
    )

    for await (const chunk of responseStream) {
        if (aiContext.abortController.signal.aborted) {
            break
        }

        yield chunk
    }
}

function stopGeneration() {
    aiContext.abortController?.abort()
    toggleSendOrStopButton(false)
}

function toggleSendOrStopButton(isGenerating) {
    aiContext.isGenerating = isGenerating

    if (isGenerating) {
        elements.button.textContent = 'Parar'
        elements.button.classList.add('stop-button')
        return
    }

    elements.button.textContent = 'Enviar'
    elements.button.classList.remove('stop-button')
}

async function initialize() {
    console.log('[Web AI Extension v5] inicializando')

    elements.year.textContent = new Date().getFullYear()
    setupEventListeners()

    elements.button.disabled = true
    elements.button.textContent = 'Verificando...'

    if (!('LanguageModel' in globalThis)) {
        setStatus(
            'LanguageModel não está disponível. Verifique a flag Prompt API.',
            'error'
        )

        elements.button.textContent = 'Indisponível'
        return
    }

    if (typeof LanguageModel.params !== 'function') {
        setStatus(
            'LanguageModel.params() não está disponível neste contexto.',
            'error'
        )

        elements.button.textContent = 'Indisponível'
        return
    }

    try {
        const availability = await LanguageModel.availability(
            englishModelOptions()
        )

        console.log('[v5] availability:', availability)

        if (availability === 'available') {
            const params = await LanguageModel.params()

            if (params) {
                applyParams(params)
                return
            }

            // API está exposta, mas o modelo/parâmetros ainda não foram materializados.
            aiContext.needsPreparation = true
            elements.button.disabled = false
            elements.button.textContent = 'Preparar modelo'

            setStatus(
                'Prompt API disponível, mas o modelo ainda precisa ser preparado. Clique em “Preparar modelo”.',
                'warning'
            )
            return
        }

        if (
            availability === 'downloadable' ||
            availability === 'downloading'
        ) {
            aiContext.needsPreparation = true
            elements.button.disabled = false
            elements.button.textContent = 'Preparar modelo'

            setStatus(
                availability === 'downloadable'
                    ? 'Gemini Nano ainda não está instalado. Clique em “Preparar modelo” para iniciar o download.'
                    : 'O Chrome indica download pendente/em andamento. Clique em “Preparar modelo” para acompanhar.',
                'warning'
            )
            return
        }

        aiContext.needsPreparation = true
        elements.button.disabled = false
        elements.button.textContent = 'Tentar preparar modelo'

        setStatus(
            `Estado do modelo: ${availability}. Clique para tentar preparar o modelo.`,
            'warning'
        )

    } catch (error) {
        console.error('[v5] Erro ao verificar availability:', error)

        aiContext.needsPreparation = true
        elements.button.disabled = false
        elements.button.textContent = 'Tentar preparar modelo'

        setStatus(
            `Não foi possível consultar o estado do modelo: ${error.message}`,
            'error'
        )
    }
}

initialize().catch((error) => {
    console.error('[v5] Erro fatal:', error)
    setStatus(`Erro fatal: ${error.message}`, 'error')
})
