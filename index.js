console.log('[Web AI Extension v1.1.1] index.js carregado')

const SUPPORTED_LANGUAGES = ['en', 'es', 'fr', 'de', 'ja']

const AUDIO_EXPERIMENTAL_COMMAND =
    '& "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe" ' +
    '--enable-features="AIPromptAPI,AIPromptAPIMultimodalInput,' +
    'OnDeviceModelGpuAudioInput:on_device_model_audio_input_vram_min/5000"'

const aiContext = {
    session: null,
    abortController: null,
    isGenerating: false,
    params: null,
    ready: false,
    needsPreparation: false,
    isPreparing: false,
    imageFiles: [],
    audioFile: null,
    objectUrls: [],
    capabilitiesChecked: false
}

const elements = {
    temperature: document.getElementById('temperature'),
    temperatureValue: document.getElementById('temp-value'),
    topK: document.getElementById('topK'),
    topKValue: document.getElementById('topk-value'),
    language: document.getElementById('language'),

    imageInput: document.getElementById('image-input'),
    audioInput: document.getElementById('audio-input'),
    imagePreview: document.getElementById('image-preview'),
    audioPreview: document.getElementById('audio-preview'),
    attachmentSummary: document.getElementById('attachment-summary'),
    clearAttachments: document.getElementById('clear-attachments'),

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

function revokeObjectUrls() {
    for (const url of aiContext.objectUrls) {
        URL.revokeObjectURL(url)
    }
    aiContext.objectUrls = []
}

function createTrackedObjectUrl(file) {
    const url = URL.createObjectURL(file)
    aiContext.objectUrls.push(url)
    return url
}

function getTextLanguages() {
    const language = elements.language.value

    if (!SUPPORTED_LANGUAGES.includes(language)) {
        return null
    }

    return language === 'en'
        ? ['en']
        : ['en', language]
}

function buildExpectedOptions({ includeSelectedModalities = true } = {}) {
    const language = elements.language.value
    const languages = getTextLanguages()

    const expectedInputs = [
        languages
            ? { type: 'text', languages }
            : { type: 'text' }
    ]

    if (includeSelectedModalities && aiContext.imageFiles.length > 0) {
        expectedInputs.push({ type: 'image' })
    }

    if (includeSelectedModalities && aiContext.audioFile) {
        expectedInputs.push({ type: 'audio' })
    }

    const expectedOutputs = SUPPORTED_LANGUAGES.includes(language)
        ? [{ type: 'text', languages: [language] }]
        : [{ type: 'text' }]

    return {
        expectedInputs,
        expectedOutputs
    }
}

function englishTextModelOptions() {
    return {
        expectedInputs: [
            { type: 'text', languages: ['en'] }
        ],
        expectedOutputs: [
            { type: 'text', languages: ['en'] }
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

    showReadyStatus()
    console.log('[v1.1.1] LanguageModel.params():', params)

    detectMultimodalCapabilities()
}

function showReadyStatus() {
    if (!aiContext.params) {
        return
    }

    const modes = []
    if (aiContext.imageFiles.length) {
        modes.push(`${aiContext.imageFiles.length} imagem(ns)`)
    }
    if (aiContext.audioFile) {
        modes.push('1 áudio')
    }

    const suffix = modes.length
        ? ` | Multimodal: ${modes.join(' + ')}`
        : ' | Somente texto'

    setStatus(
        `Pronto — Temperature ${aiContext.params.defaultTemperature}/${aiContext.params.maxTemperature} | ` +
        `Top K ${aiContext.params.defaultTopK}/${aiContext.params.maxTopK}${suffix}`,
        'success'
    )
}


async function detectMultimodalCapabilities() {
    if (aiContext.capabilitiesChecked) {
        return
    }

    aiContext.capabilitiesChecked = true

    try {
        const expectedOutputs = [
            { type: 'text', languages: ['en'] }
        ]

        const [imageAvailability, audioAvailability] = await Promise.all([
            LanguageModel.availability({
                expectedInputs: [
                    { type: 'text', languages: ['en'] },
                    { type: 'image' }
                ],
                expectedOutputs
            }),
            LanguageModel.availability({
                expectedInputs: [
                    { type: 'text', languages: ['en'] },
                    { type: 'audio' }
                ],
                expectedOutputs
            })
        ])

        console.log('[v1.1.1] Capabilities multimodais:', {
            image: imageAvailability,
            audio: audioAvailability
        })

        if (audioAvailability === 'unavailable') {
            console.groupCollapsed(
                '%c[Web AI] Áudio indisponível — verifique a VRAM',
                'color:#f59e0b;font-weight:600'
            )

            console.warn(
                'O Chrome não liberou a capability de áudio para o modelo atual.'
            )

            console.info(
                'O Chromium usa 6144 MiB como limite padrão para liberar entrada de áudio. ' +
                'Em GPUs próximas de 6 GB, o Chrome pode detectar uma quantidade ligeiramente abaixo desse limite.'
            )

            console.info(
                'Confira a VRAM detectada em chrome://on-device-internals. ' +
                'Se estiver abaixo de 6144 MiB, feche completamente o Chrome e execute no PowerShell:'
            )

            console.info(AUDIO_EXPERIMENTAL_COMMAND)

            console.info(
                'Esse override reduz o limite experimentalmente para 5000 MiB e vale somente para esta execução do Chrome. ' +
                'Se fechar completamente ou reiniciar o navegador, será necessário executar o comando novamente.'
            )

            console.groupEnd()
        }
    } catch (error) {
        console.debug(
            '[v1.1.1] Não foi possível verificar as capabilities multimodais:',
            error
        )
    }
}

async function loadParamsAfterModelIsReady() {
    const params = await LanguageModel.params()

    console.log('[v1.1.1] params retornado:', params)

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
        'Preparando Gemini Nano. Se necessário, o Chrome iniciará o download do modelo...',
        'warning'
    )

    try {
        const bootstrapSession = await LanguageModel.create({
            ...englishTextModelOptions(),
            monitor(monitor) {
                monitor.addEventListener('downloadprogress', (event) => {
                    const percent = Math.round(event.loaded * 100)

                    console.log(`[v1.1.1] Download base: ${percent}%`)
                    setStatus(`Baixando Gemini Nano: ${percent}%`, 'warning')
                })
            }
        })

        bootstrapSession.destroy()

        setStatus('Modelo pronto. Lendo Temperature e Top K...', 'success')
        await loadParamsAfterModelIsReady()

    } catch (error) {
        console.error('[v1.1.1] Erro ao preparar modelo:', error)

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

function renderImagePreview() {
    elements.imagePreview.replaceChildren()

    if (aiContext.imageFiles.length === 0) {
        elements.imagePreview.textContent = 'Nenhuma imagem selecionada.'
        elements.imagePreview.classList.add('empty-preview')
        return
    }

    elements.imagePreview.classList.remove('empty-preview')

    for (const file of aiContext.imageFiles) {
        const item = document.createElement('div')
        item.className = 'image-preview-item'

        const image = document.createElement('img')
        image.src = createTrackedObjectUrl(file)
        image.alt = file.name
        image.title = file.name

        const name = document.createElement('span')
        name.textContent = file.name

        item.append(image, name)
        elements.imagePreview.append(item)
    }
}

function renderAudioPreview() {
    elements.audioPreview.replaceChildren()

    if (!aiContext.audioFile) {
        elements.audioPreview.textContent = 'Nenhum áudio selecionado.'
        elements.audioPreview.classList.add('empty-preview')
        return
    }

    elements.audioPreview.classList.remove('empty-preview')

    const name = document.createElement('div')
    name.className = 'audio-name'
    name.textContent = aiContext.audioFile.name

    const audio = document.createElement('audio')
    audio.controls = true
    audio.src = createTrackedObjectUrl(aiContext.audioFile)

    elements.audioPreview.append(name, audio)
}

function updateAttachmentSummary() {
    const parts = []

    if (aiContext.imageFiles.length > 0) {
        parts.push(`${aiContext.imageFiles.length} imagem(ns)`)
    }

    if (aiContext.audioFile) {
        parts.push(`áudio: ${aiContext.audioFile.name}`)
    }

    elements.attachmentSummary.textContent = parts.length
        ? `Será enviado junto ao prompt: ${parts.join(' + ')}`
        : 'Somente texto'

    if (aiContext.ready) {
        showReadyStatus()
    }
}

function refreshPreviews() {
    revokeObjectUrls()
    renderImagePreview()
    renderAudioPreview()
    updateAttachmentSummary()
}

function clearAttachments() {
    aiContext.imageFiles = []
    aiContext.audioFile = null

    elements.imageInput.value = ''
    elements.audioInput.value = ''

    refreshPreviews()
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
                'Português é experimental. Temperature, Top K e multimodal continuam disponíveis, ' +
                'mas a saída PT-BR não é oficialmente listada como suportada.',
                'warning'
            )
        } else if (aiContext.ready) {
            showReadyStatus()
        }
    })

    elements.imageInput.addEventListener('change', () => {
        aiContext.imageFiles = Array.from(elements.imageInput.files ?? [])
        refreshPreviews()
    })

    elements.audioInput.addEventListener('change', () => {
        aiContext.audioFile = elements.audioInput.files?.[0] ?? null
        refreshPreviews()
    })

    elements.clearAttachments.addEventListener('click', clearAttachments)

    elements.form.addEventListener('submit', async (event) => {
        event.preventDefault()

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

    window.addEventListener('beforeunload', () => {
        revokeObjectUrls()
        aiContext.session?.destroy()
    })
}

function getDefaultPromptForAttachments() {
    const hasImages = aiContext.imageFiles.length > 0
    const hasAudio = Boolean(aiContext.audioFile)

    if (hasImages && hasAudio) {
        return 'Analise as imagens e o áudio anexados e descreva as informações mais relevantes.'
    }

    if (hasImages) {
        return aiContext.imageFiles.length > 1
            ? 'Analise e compare as imagens anexadas.'
            : 'Descreva e analise a imagem anexada.'
    }

    if (hasAudio) {
        return 'Analise o áudio anexado e transcreva ou resuma seu conteúdo.'
    }

    return ''
}

async function onSubmitQuestion() {
    if (!aiContext.ready || !aiContext.params) {
        return
    }

    const typedQuestion = elements.questionInput.value.trim()
    const question = typedQuestion || getDefaultPromptForAttachments()

    if (!question) {
        elements.output.textContent =
            'Digite uma pergunta ou selecione uma imagem/áudio.'
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

        console.error('[v1.1.1] Erro no prompt:', error)

        if (error.name === 'NotSupportedError') {
            elements.output.textContent =
                'O Chrome/modelo atual não aceitou uma das modalidades ou idiomas selecionados. ' +
                'Confirme as flags “Prompt API” e “Prompt API Multimodal Input”, reinicie o Chrome e tente novamente.'
        } else {
            elements.output.textContent = `Erro: ${error.message}`
        }
    } finally {
        toggleSendOrStopButton(false)
        if (aiContext.ready) {
            showReadyStatus()
        }
    }
}

function buildPromptContent(question) {
    const content = [
        {
            type: 'text',
            value: question
        }
    ]

    for (const imageFile of aiContext.imageFiles) {
        content.push({
            type: 'image',
            value: imageFile
        })
    }

    if (aiContext.audioFile) {
        content.push({
            type: 'audio',
            value: aiContext.audioFile
        })
    }

    return content
}

async function* askAI(question, temperature, topK) {
    aiContext.abortController?.abort()
    aiContext.abortController = new AbortController()

    if (aiContext.session) {
        aiContext.session.destroy()
        aiContext.session = null
    }

    const multimodal = aiContext.imageFiles.length > 0 || Boolean(aiContext.audioFile)
    const expectedOptions = buildExpectedOptions()

    console.log('[v1.1.1] Criando sessão:', {
        temperature,
        topK,
        language: elements.language.value,
        images: aiContext.imageFiles.map(file => file.name),
        audio: aiContext.audioFile?.name ?? null,
        expectedOptions
    })

    const availability = await LanguageModel.availability({
        ...expectedOptions,
        temperature,
        topK
    })

    console.log('[v1.1.1] availability da sessão:', availability)

    if (availability === 'unavailable') {
        throw new DOMException(
            multimodal
                ? 'A configuração multimodal selecionada não está disponível neste Chrome/modelo.'
                : 'A configuração selecionada não está disponível neste Chrome/modelo.',
            'NotSupportedError'
        )
    }

    const session = await LanguageModel.create({
        ...expectedOptions,
        temperature,
        topK,

        initialPrompts: [
            {
                role: 'system',
                content:
                    'You are a concise AI assistant. Analyze any text, image, or audio the user provides. ' +
                    'Follow the user request and answer using plain text.'
            }
        ],

        monitor(monitor) {
            monitor.addEventListener('downloadprogress', (event) => {
                const percent = Math.round(event.loaded * 100)
                console.log(`[v1.1.1] Download da sessão: ${percent}%`)
                setStatus(
                    `Preparando recursos do modelo${multimodal ? ' multimodal' : ''}: ${percent}%`,
                    'warning'
                )
            })
        }
    })

    aiContext.session = session

    console.log('[v1.1.1] Sessão criada:', {
        temperature: session.temperature,
        topK: session.topK,
        multimodal
    })

    const content = buildPromptContent(question)

    const responseStream = session.promptStreaming(
        [
            {
                role: 'user',
                content
            }
        ],
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
    console.log('[Web AI Extension v1.1.1] inicializando')

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
            englishTextModelOptions()
        )

        console.log('[v1.1.1] availability base:', availability)

        if (availability === 'available') {
            const params = await LanguageModel.params()

            if (params) {
                applyParams(params)
                return
            }

            aiContext.needsPreparation = true
            elements.button.disabled = false
            elements.button.textContent = 'Preparar modelo'

            setStatus(
                'Prompt API disponível, mas o modelo ainda precisa ser preparado. Clique em “Preparar modelo”.',
                'warning'
            )
            return
        }

        if (availability === 'downloadable' || availability === 'downloading') {
            aiContext.needsPreparation = true
            elements.button.disabled = false
            elements.button.textContent = 'Preparar modelo'

            setStatus(
                availability === 'downloadable'
                    ? 'Gemini Nano ainda não está instalado. Clique em “Preparar modelo”.'
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
        console.error('[v1.1.1] Erro ao verificar availability:', error)

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
    console.error('[v1.1.1] Erro fatal:', error)
    setStatus(`Erro fatal: ${error.message}`, 'error')
})
