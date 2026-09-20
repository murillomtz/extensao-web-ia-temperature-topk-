# Web AI — Temperature, Top K e Multimodal com Gemini Nano

Extensão experimental para testar a **Prompt API nativa do Google Chrome** usando o modelo local **Gemini Nano**.

A versão `1.1.1` mantém todas as funcionalidades anteriores e adiciona entrada multimodal.

## Funcionalidades

- `Temperature`
- `Top K`
- `LanguageModel.params()`
- `LanguageModel.availability()`
- `LanguageModel.create()`
- `promptStreaming()`
- download/preparação do Gemini Nano
- entrada de texto
- múltiplas imagens
- arquivo de áudio
- texto + imagem
- texto + áudio
- texto + imagem + áudio
- preview dos anexos
- idiomas suportados + Português experimental
- acompanhamento do download de recursos do modelo

## Autor

**Murillo Caetano**

- LinkedIn: https://www.linkedin.com/in/murillo-mtz/
- GitHub: https://github.com/murillomtz

---

# 1. Requisitos

Use o **Google Chrome normal atualizado**.

A Prompt API executa com um modelo local do Chrome. O Gemini Nano pode precisar ser baixado na primeira utilização.


## Requisitos esperados por modalidade

A disponibilidade das modalidades depende do modelo que o Chrome instalou e das capacidades detectadas no dispositivo.

| Modalidade | Requisito esperado |
|---|---|
| Texto | Prompt API disponível e modelo local compatível |
| Imagem | Prompt API Multimodal Input habilitada + capability `image` disponível |
| Áudio | Prompt API Multimodal Input habilitada + GPU compatível + capability `audio` disponível |
| Texto + imagem + áudio | Todas as capabilities usadas precisam estar disponíveis ao mesmo tempo |

A forma correta de validar é usar `LanguageModel.availability()` para cada configuração.

Exemplo — áudio:

```javascript
await LanguageModel.availability({
    expectedInputs: [
        { type: 'text', languages: ['en'] },
        { type: 'audio' }
    ],
    expectedOutputs: [
        { type: 'text', languages: ['en'] }
    ]
})
```

Se retornar:

```text
available
```

a modalidade está disponível.

Se retornar:

```text
unavailable
```

o Chrome não liberou aquela capability para a configuração atual.

### Requisito de VRAM para áudio

No Chromium atual, a entrada de áudio usa um limite padrão de:

```text
6144 MiB
```

Em GPUs comercializadas como **6 GB**, o valor realmente detectado pelo Chrome pode ficar um pouco abaixo desse limite.

Exemplo observado durante este laboratório:

```text
NVIDIA GeForce RTX 4050 Laptop GPU
nvidia-smi: 6141 MiB
Chrome On-Device Internals: 5920 MiB
Limite padrão para áudio: 6144 MiB
```

Nesse cenário:

```text
Texto  -> available
Imagem -> available
Áudio  -> unavailable
```

mesmo que a GPU seja compatível e tenha aproximadamente 6 GB de VRAM.

### Modo experimental para GPUs próximas de 6 GB

Para fins de laboratório, é possível iniciar o Chrome reduzindo o limite de áudio para `5000 MiB`.

Feche completamente todas as janelas do Chrome e execute no **PowerShell**:

```powershell
& "C:\Program Files\Google\Chrome\Application\chrome.exe" --enable-features="AIPromptAPI,AIPromptAPIMultimodalInput,OnDeviceModelGpuAudioInput:on_device_model_audio_input_vram_min/5000"
```

Depois abra novamente a extensão e valide:

```javascript
await LanguageModel.availability({expectedInputs:[{type:'text',languages:['en']},{type:'audio'}],expectedOutputs:[{type:'text',languages:['en']}]})
```

O esperado, quando o override funcionar, é:

```text
available
```

> **Importante:** esse parâmetro não fica salvo.  
> Ele vale somente para a execução do Chrome iniciada com esse comando.  
> Se o Chrome for fechado completamente, reiniciado ou aberto normalmente depois, será necessário executar o comando novamente.

A extensão também faz uma checagem discreta das capabilities multimodais. Se o áudio estiver `unavailable`, o Console mostra um aviso recolhido com a orientação e o comando experimental.


---

# 2. Habilitar as APIs experimentais

Abra:

```text
chrome://flags/#prompt-api
```

Habilite:

```text
Prompt API
```

e:

```text
Prompt API Multimodal Input
```

Mude ambas para:

```text
Enabled
```

Depois clique em:

```text
Relaunch
```

para reiniciar o Chrome.

A flag multimodal é necessária para os testes com imagem e áudio nas versões em que esse recurso ainda estiver protegido por flag.

---

# 3. Instalar a extensão localmente

Extraia o ZIP.

A pasta deve conter:

```text
README.md
index.html
index.js
manifest.json
style.css
```

Abra:

```text
chrome://extensions
```

Ative:

```text
Modo do desenvolvedor
```

Clique em:

```text
Carregar sem compactação
```

Selecione a pasta que contém `manifest.json`.

---

# 4. Preparar o modelo

Abra a extensão.

Se aparecer:

```text
Preparar modelo
```

clique no botão.

O Chrome poderá baixar o Gemini Nano.

Depois disso a extensão exibirá os limites retornados por:

```javascript
LanguageModel.params()
```

Exemplo:

```javascript
{
    defaultTopK: 3,
    maxTopK: 128,
    defaultTemperature: 1,
    maxTemperature: 2
}
```

---

# 5. Temperature e Top K

## Temperature

Valores menores tendem a gerar respostas mais previsíveis.

Valores maiores aumentam a variação das respostas.

## Top K

Define quantas alternativas mais prováveis podem ser consideradas na geração.

Nas extensões do Chrome, quando `temperature` e `topK` são definidos manualmente, os dois são enviados juntos na criação da sessão.

---

# 6. Teste somente com texto

Deixe os campos de imagem e áudio vazios.

Digite, por exemplo:

```text
Give me three different names for a futuristic city.
```

Clique em:

```text
Enviar
```

Altere Temperature e Top K e repita a mesma pergunta para comparar.

---

# 7. Teste com imagem

Clique no campo:

```text
Imagens
```

Selecione uma ou mais imagens.

Exemplo de prompt:

```text
Describe this image in detail.
```

ou, com múltiplas imagens:

```text
Compare these images and explain their main differences.
```

Os arquivos são enviados diretamente à Prompt API como entradas do tipo:

```javascript
{ type: 'image', value: imageFile }
```

---

# 8. Teste com áudio

Selecione um arquivo no campo:

```text
Áudio
```

Exemplo:

```text
Transcribe this audio and summarize its main idea.
```

O arquivo é enviado à Prompt API como:

```javascript
{ type: 'audio', value: audioFile }
```

---

# 9. Teste combinado

É possível selecionar:

```text
texto + imagem
texto + áudio
texto + imagens + áudio
```

Exemplo:

```text
Use the images and audio together and explain what information they contain.
```

A sessão declara as modalidades utilizadas por meio de `expectedInputs`.

Exemplo:

```javascript
expectedInputs: [
    { type: 'text', languages: ['en'] },
    { type: 'image' },
    { type: 'audio' }
]
```

A saída continua sendo texto:

```javascript
expectedOutputs: [
    { type: 'text', languages: ['en'] }
]
```

---

# 10. Formatos multimodais

A Prompt API aceita diferentes objetos de imagem e áudio.

Neste projeto utilizamos arquivos selecionados pelo usuário, que são fornecidos ao navegador como `File`, compatível com `Blob`.

A extensão aceita:

```text
image/*
audio/*
```

---

# 11. Idiomas

Idiomas atualmente configurados como oficialmente suportados neste laboratório:

```text
en
es
fr
de
ja
```

Português continua disponível como:

```text
Português (experimental)
```

Para validar o funcionamento inicial, use `English`.

---

# 12. Debug do modelo local

Abra:

```text
chrome://chrome-urls/
```

Localize:

```text
Internal Debugging Page URLs
```

Se estiver desativado, clique em:

```text
Enable internal debugging pages
```

Depois abra:

```text
chrome://on-device-internals
```

Fluxo:

```text
chrome://chrome-urls/
        ↓
Internal Debugging Page URLs
        ↓
Enable internal debugging pages
        ↓
chrome://on-device-internals
```

Nessa tela, observe principalmente:

```text
Broker Properties
Possible Capabilities
Manifest Criteria
Assets
Use Cases
Models
```

Para áudio, `Possible Capabilities` deve incluir `Audio`.

Exemplo:

```text
Possible Capabilities: Image, Audio
```

Se aparecer apenas:

```text
Possible Capabilities: Image
```

o Chrome não liberou áudio para aquela execução.

Use essa tela se:

```javascript
LanguageModel.params()
```

retornar `null`, o download não começar, ou uma modalidade não estiver disponível.

---

# 13. Erro NotSupportedError

Se imagem ou áudio resultar em:

```text
NotSupportedError
```

verifique:

1. Chrome atualizado.
2. `Prompt API` habilitada.
3. `Prompt API Multimodal Input` habilitada.
4. Chrome reiniciado após alterar as flags.
5. Modelo local disponível.
6. Idioma/modalidade compatível com o modelo instalado.

---

# 14. Console

Abra o DevTools com:

```text
F12
```

e consulte:

```text
Console
```

A extensão registra:

```text
availability
Temperature
Top K
modalidades selecionadas
nomes dos anexos
progresso de download
criação da sessão
erros da Prompt API
```

---

# 15. Atualizando a extensão

Depois de alterar arquivos:

```text
chrome://extensions
```

Encontre a extensão e clique em:

```text
Recarregar
```

---

# 16. Sem npm

O projeto não precisa de:

```text
npm install
npm start
http-server
```

Ele roda diretamente como **Chrome Extension Manifest V3**.

---

# Referências

Prompt API:

```text
https://developer.chrome.com/docs/ai/prompt-api
```

Chrome Built-in AI:

```text
https://developer.chrome.com/docs/ai/
```

---

## Autor

**Murillo Caetano**

LinkedIn:

```text
https://www.linkedin.com/in/murillo-mtz/
```

GitHub:

```text
https://github.com/murillomtz
```
