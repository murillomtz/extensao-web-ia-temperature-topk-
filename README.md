# Web AI — Temperature & Top K com Gemini Nano

Projeto experimental para testar a **Prompt API nativa do Google Chrome** usando o modelo local **Gemini Nano**.

O objetivo deste projeto é permitir testar, diretamente no navegador:

- `Temperature`
- `Top K`
- `LanguageModel.params()`
- `LanguageModel.create()`
- `promptStreaming()`
- download e execução local do modelo de IA do Chrome

> Este projeto foi preparado como uma **Chrome Extension**, porque nas versões atuais do Chrome os parâmetros numéricos `temperature`, `topK` e `LanguageModel.params()` continuam disponíveis em extensões.

---

## Autor

**Murillo Caetano**

- LinkedIn: https://www.linkedin.com/in/murillo-mtz/
- GitHub: https://github.com/murillomtz

---

# 1. O que você precisa

Para utilizar o projeto, você precisa de:

- Google Chrome atualizado
- Windows, macOS, Linux ou ChromeOS compatível
- suporte às APIs de IA integradas do Chrome
- espaço em disco suficiente para o download do modelo
- conexão com a internet para o primeiro download do Gemini Nano

> Use preferencialmente o **Google Chrome normal atualizado**.  
> Não é recomendado usar **Chrome for Testing** para este laboratório.

---

# 2. Baixe e extraia o ZIP

Baixe o arquivo ZIP do projeto.

Depois:

1. Clique com o botão direito no arquivo.
2. Escolha **Extrair tudo**.
3. Escolha uma pasta.
4. Abra a pasta extraída.

A estrutura deve ser parecida com:

```text
webai-temperature-topk-extension/
│
├── manifest.json
├── index.html
├── index.js
├── style.css
└── README.md
```

O arquivo mais importante para o Chrome reconhecer o projeto como extensão é:

```text
manifest.json
```

---

# 3. Ative a Prompt API no Chrome

Abra uma nova aba do Chrome e acesse:

```text
chrome://flags/#prompt-api
```

Você verá a página de recursos experimentais do Chrome.

Procure e habilite:

```text
Prompt API
```

Altere de:

```text
Default
```

para:

```text
Enabled
```

---

## 3.1 Prompt API Multimodal Input

Na mesma página procure:

```text
Prompt API Multimodal Input
```

Também altere para:

```text
Enabled
```

Essa opção adiciona suporte a entradas multimodais, como imagem e áudio, quando disponíveis pela API.

Para este laboratório de `Temperature` e `Top K`, o recurso principal é a **Prompt API**, mas é recomendado deixar o suporte multimodal habilitado para os próximos experimentos.

---

# 4. Reinicie o Chrome

Depois de alterar as flags, o Chrome mostrará um botão para reiniciar o navegador.

Clique em:

```text
Relaunch
```

ou:

```text
Reiniciar
```

É importante reiniciar completamente o Chrome para que as APIs sejam ativadas.

---

# 5. Abra a página de extensões

Depois que o Chrome reiniciar, abra:

```text
chrome://extensions
```

No canto superior direito, ative:

```text
Modo do desenvolvedor
```

ou:

```text
Developer mode
```

Depois aparecerão novos botões.

Clique em:

```text
Carregar sem compactação
```

ou:

```text
Load unpacked
```

---

# 6. Selecione a pasta do projeto

Na janela que abrir, selecione a pasta que contém:

```text
manifest.json
```

Não selecione o arquivo `manifest.json` diretamente.

Selecione a **pasta inteira**.

Exemplo:

```text
webai-temperature-topk-extension/
```

Depois clique em:

```text
Selecionar pasta
```

A extensão será carregada no Chrome.

---

# 7. Abra a extensão

Na barra do Chrome, clique no ícone de extensões:

```text
🧩
```

Procure:

```text
Web AI - Temperature & TopK
```

Você pode clicar no ícone de alfinete para deixá-la fixa na barra do navegador.

Depois clique na extensão.

Também é possível clicar em:

```text
Abrir em uma aba
```

dentro da própria interface.

---

# 8. Primeira execução: preparar o Gemini Nano

O modelo Gemini Nano não necessariamente já estará instalado no computador.

Na primeira execução, a extensão verifica o estado do modelo.

Se aparecer algo como:

```text
Gemini Nano ainda não está instalado.
```

ou:

```text
Preparar modelo
```

clique no botão:

```text
Preparar modelo
```

Esse clique chama:

```javascript
LanguageModel.create()
```

e permite que o Chrome faça o download do modelo local.

Durante o download, a interface pode mostrar:

```text
Baixando Gemini Nano: 10%
Baixando Gemini Nano: 35%
Baixando Gemini Nano: 80%
Baixando Gemini Nano: 100%
```

O download pode levar alguns minutos.

---

# 9. Quando o modelo estiver pronto

Depois que o modelo estiver disponível, a extensão consulta:

```javascript
LanguageModel.params()
```

e apresenta os limites reais disponibilizados pelo Chrome.

Exemplo:

```javascript
{
    defaultTopK: 3,
    maxTopK: 128,
    defaultTemperature: 1,
    maxTemperature: 2
}
```

Os valores podem variar conforme a versão do navegador e do modelo.

---

# 10. Temperature

`Temperature` controla o nível de variação da resposta.

De forma simplificada:

```text
Temperature menor
        ↓
resposta mais previsível
        ↓
menos variação
```

```text
Temperature maior
        ↓
mais possibilidades
        ↓
respostas potencialmente mais criativas
```

Exemplo:

```text
0.2
```

tende a produzir resultados mais previsíveis.

Enquanto:

```text
1.8
```

tende a permitir maior variação.

---

# 11. Top K

`Top K` limita quantas opções prováveis o modelo considera durante a geração.

Exemplo:

```text
Top K = 3
```

significa que a seleção fica mais restrita.

Enquanto:

```text
Top K = 100
```

permite considerar uma quantidade maior de possibilidades.

---

# 12. Fazendo o experimento

Para perceber melhor a diferença, use sempre a **mesma pergunta**.

Exemplo:

```text
Complete a frase: "O céu é..."
```

Primeiro teste com:

```text
Temperature: 0.2
Top K: 3
```

Execute várias vezes.

Depois teste:

```text
Temperature: 1.8
Top K: 100
```

Execute várias vezes novamente.

Compare as respostas.

O objetivo é observar como os parâmetros alteram o comportamento da geração.

---

# 13. Idiomas

Atualmente, a Prompt API do Chrome oferece suporte oficial aos seguintes idiomas:

```text
en — Inglês
es — Espanhol
fr — Francês
de — Alemão
ja — Japonês
```

Português está disponível neste projeto como:

```text
Português (experimental)
```

Isso significa que ele pode funcionar em alguns cenários, mas ainda pode gerar avisos ou erros dependendo da versão do Chrome e do modelo.

Para validar se tudo está funcionando corretamente pela primeira vez, use:

```text
English (supported)
```

---

# 14. Verificando o modelo local

O Chrome possui uma página interna específica para diagnosticar os modelos de IA executados localmente no navegador.

A página é:

```text
chrome://on-device-internals
```

Ela pode ajudar a verificar informações como:

- estado do modelo local
- download do Gemini Nano
- carregamento do modelo
- erros internos
- eventos relacionados às APIs de IA
- disponibilidade do modelo no dispositivo

Porém, nas versões atuais do Chrome, essa página pode estar desativada por padrão.

Se ao abrir:

```text
chrome://on-device-internals
```

aparecer uma mensagem semelhante a:

```text
As páginas de depuração internas estão desativadas no momento.
```

é necessário habilitar primeiro as páginas internas de depuração.

---

## 14.1 Habilitando as páginas internas de debug

Abra:

```text
chrome://chrome-urls/
```

Role a página até encontrar a seção:

```text
Internal Debugging Page URLs
```

Nessa área aparecerá uma mensagem semelhante a:

```text
Internal debugging pages are currently disabled.
```

Procure o botão:

```text
Enable internal debugging pages
```

e clique nele.

Depois disso, volte para:

```text
chrome://on-device-internals
```

e atualize a página.

O fluxo fica:

```text
chrome://chrome-urls/
        ↓
Internal Debugging Page URLs
        ↓
Enable internal debugging pages
        ↓
chrome://on-device-internals
```

---

## 14.2 O que verificar em `chrome://on-device-internals`

Depois que a página estiver habilitada, use-a para verificar se o modelo local está:

```text
disponível
baixando
carregando
indisponível
com erro
```

Essa página é especialmente útil quando:

```javascript
await LanguageModel.params()
```

retorna:

```javascript
null
```

ou quando:

```javascript
await LanguageModel.availability(...)
```

não retorna o estado esperado.

Também é útil quando a extensão fica aguardando:

```text
Preparando modelo
```

ou quando o download do Gemini Nano não começa.

---

## 14.3 Relação com este projeto

Neste projeto, o fluxo esperado é:

```text
Prompt API habilitada
        ↓
LanguageModel disponível
        ↓
LanguageModel.create()
        ↓
Chrome prepara ou baixa o modelo local
        ↓
LanguageModel.params()
        ↓
Temperature e Top K disponíveis
```

Se alguma dessas etapas falhar, `chrome://on-device-internals` é um dos melhores lugares para investigar o motivo.
# 15. Abrindo o Console

Se algo não funcionar, abra o DevTools.

Pressione:

```text
F12
```

Depois acesse:

```text
Console
```

A extensão registra informações como:

```text
availability
download do modelo
LanguageModel.params()
Temperature
Top K
erros da Prompt API
```

---

# 16. Atualizando a extensão depois de alterar o código

Se você modificar:

```text
index.js
index.html
style.css
manifest.json
```

não precisa carregar tudo novamente.

Abra:

```text
chrome://extensions
```

Encontre:

```text
Web AI - Temperature & TopK
```

e clique em:

```text
Recarregar
```

Depois feche e abra novamente a extensão.

---

# 17. Não precisa de npm

Esta versão foi preparada para funcionar diretamente como extensão.

Você **não precisa executar**:

```bash
npm install
npm start
```

Também não precisa iniciar:

```text
http-server
```

O próprio Chrome carrega:

```text
manifest.json
index.html
index.js
style.css
```

---


# 19. Observação importante sobre Chrome Extensions

Nas versões atuais da API, páginas Web comuns não possuem acesso padrão aos parâmetros numéricos:

```javascript
temperature
topK
LanguageModel.params()
```

Por isso este projeto utiliza uma **Chrome Extension**.

Dentro desse contexto, é possível criar uma sessão como:

```javascript
const params = await LanguageModel.params()

const session = await LanguageModel.create({
    temperature: 1.5,
    topK: 10
})
```

Ao informar manualmente os parâmetros, `temperature` e `topK` devem ser fornecidos juntos.

---

# 20. Referências oficiais

Documentação da Prompt API:

```text
https://developer.chrome.com/docs/ai/prompt-api
```

Documentação de IA integrada do Chrome:

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
