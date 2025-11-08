# 🤖 Bot Olimpiadas WhatsApp + LMStudio

Um bot de WhatsApp que responde mensagens usando um modelo de linguagem local (LMStudio). Permite o envio de mensagens apenas de números autorizados e utiliza uma base de conhecimento customizável.

---

## 📝 Funcionalidades

* Conecta-se ao WhatsApp via **Baileys**.
* Responde mensagens com **LMStudio**.
* Permite criar uma **base de conhecimento** com arquivos `.txt` ou `.json`.
* Restringe usuários que podem enviar mensagens (lista de números autorizados).
* Exibe **QR code no terminal** para conectar o WhatsApp.
* Mantém **histórico de conversas** para contexto.
* Ajuda com comando  **/ajuda**.
* Mudança do idioma com o comando  **/Hacker <idioma>**.

---

## ⚙️ Tecnologias e Dependências

* [Node.js](https://nodejs.org/)
* [Baileys](https://github.com/WhiskeySockets/Baileys)
* [LMStudio](https://github.com/nomic-ai/gpt4all) (modelo local)
* [Axios](https://github.com/axios/axios) – requisições HTTP
* [Colors](https://www.npmjs.com/package/colors) – mensagens coloridas no console
* [Terminal QR Code](https://www.npmjs.com/package/terminal-qrcode) – gerar QR code no terminal
* [Pino](https://github.com/pinojs/pino) – logging
* [@hapi/boom](https://www.npmjs.com/package/@hapi/boom) – tratamento de erros

---

## 📁 Estrutura do Projeto

```
.
├── bot.js                 # Arquivo principal do bot
├── package.json           # Dependências e scripts
├── knowledge/             # Base de conhecimento (txt ou json)
└── auth_info_baileys/     # Credenciais do WhatsApp (gerado automaticamente)
```

---

## 🚀 Instalação

1. Clone o projeto:

```bash
git clone https://github.com/seu-usuario/bot-olimpiadas-whatsapp.git
cd bot-olimpiadas-whatsapp
```

2. Instale as dependências:

```bash
npm install
```

3. Crie a pasta `knowledge` e adicione arquivos `.txt` ou `.json` com informações que o bot deve usar:

```bash
mkdir knowledge
```

4. Configure o endereço do LMStudio no `bot.js`:

```js
const lmstudioUrl = 'http://127.0.0.1:1234';
```

5. Adicione os números autorizados:

```js
const numerosAutorizados = ['5516999992222'];
```

---

## ⚡ Como rodar

```bash
npm install
node bot.js
```

* Escaneie o QR code no terminal usando o WhatsApp no seu celular.
* Apenas números autorizados poderão interagir com o bot.
* Certifique-se de que o LMStudio esteja rodando e com o modelo carregado.

---

## 🧠 Modelos compatíveis

* Modelo padrão: `google/gemma-3n-e4b`
* Outros modelos suportados pelo LMStudio podem ser configurados na linha:

```js
model: 'google/gemma-3n-e4b'
```

---

## 📌 Observações

* O bot **não funcionará** com números banidos ou que tiveram problemas em apps modificados.
* O QR code expira em 60 segundos. Se expirar, reinicie o bot.
* Limite de histórico: 20 mensagens por usuário.

---

## 🛠️ Personalização

* Alterar cores e estilo do console via [colors](https://www.npmjs.com/package/colors).
* Adicionar mais regras para números autorizados.
* Ajustar parâmetros do modelo LMStudio (se suportado pelo modelo).

---

## 📝 Licença

MIT © [Allison Rodrigues]
