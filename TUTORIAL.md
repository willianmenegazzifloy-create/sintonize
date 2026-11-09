<a id="topo"></a>

<p align="center"><img src="assets/banner-tutorial.svg" width="100%" alt="Tutorial Sintonize: passo a passo"></p>

[← Voltar ao início](README.md)

Seu próprio addon Sintonize para o Nuvio, do zero. Você não precisa programar. Leva cerca de 40 minutos.

Você vai precisar de: um computador, um e-mail e o Nuvio (app ou site).

> [!IMPORTANT]
> **Regra de ouro:** nunca mostre sua senha de admin nem sua chave do TMDB para ninguém, nem em print. Quem tem essas duas coisas controla o seu Worker.

## O que é cada coisa

- **Cloudflare Worker:** o programa que roda o seu Sintonize na internet, de graça.
- **KV:** o armazenamento onde o Sintonize guarda seus addons, preferências e cache.
- **TMDB:** serviço gratuito que fornece títulos, capas e sinopses.
- **Collection:** arquivo que organiza as coleções dentro do Nuvio.

## Visão geral

O caminho tem cinco etapas: 1) Cloudflare: cria a conta onde o Sintonize vai rodar (gratuita). 2) TMDB: pega uma chave gratuita. 3) Worker e KV: o Worker é o programa e o KV guarda suas configurações. 4) Painel: você entra no /admin e configura os addons. 5) Nuvio: você adiciona o addon e importa o collection.

```mermaid
graph LR
    A[Cloudflare] --> B[TMDB] --> C[Worker e KV] --> D[Painel] --> E[Nuvio]
    classDef neutro fill:#161616,color:#f4f4f4,stroke:#777,stroke-width:1px;
    class A,B,C,D,E neutro;
```

## Sumário

- [Visão geral](#visao-geral)
- [Parte 1: Criar a conta na Cloudflare](#parte-1)
- [Parte 2: Pegar a chave do TMDB](#parte-2)
- [Parte 3: Pegar o código do Sintonize](#parte-3)
- [Parte 4: Criar o Worker](#parte-4)
- [Parte 5: Criar o KV (o armazenamento)](#parte-5)
- [Parte 6: Ligar o KV ao Worker (binding)](#parte-6)
- [Parte 7: Criar as duas senhas (secrets)](#parte-7)
- [Parte 8: Testar se está funcionando](#parte-8)
- [Parte 9: Entrar no painel e adicionar as fontes](#parte-9)
- [Parte 10: Baixar o collection](#parte-10)
- [Parte 11: Colocar tudo no Nuvio](#parte-11)
- [Parte 12: Personalizar (opcional)](#parte-12)
- [Quando algo der errado](#quando-algo-der-errado)
- [O que nunca fazer](#o-que-nunca-fazer)

---

<a id="parte-1"></a>
## Parte 1: Criar a conta na Cloudflare

**Passo 1:** Abra cloudflare.com e clique em Sign up (Cadastrar).

<p align="center"><img src="https://i.imgur.com/T1k59p4.png" alt="Página de cadastro da Cloudflare" width="720"></p>

**Passo 2:** Digite seu e-mail e crie uma senha. Clique em Sign up.

<p align="center"><img src="https://i.imgur.com/gXm4wN5.png" alt="Formulário de cadastro da Cloudflare" width="720"></p>

**Passo 3:** Abra o e-mail da Cloudflare e clique em Verify email.

<p align="center"><img src="https://i.imgur.com/xFgmm6U.png" alt="E-mail de verificação da Cloudflare" width="720"></p>

**Passo 4:** Ao entrar no painel, a Cloudflare normalmente já usa o plano gratuito (Free). Se aparecer uma pergunta sobre o plano, escolha Free.

> [!WARNING]
> Se pedir cartão de crédito, você está no plano pago: volte e escolha o gratuito.

Painel da Cloudflare: [dash.cloudflare.com](https://dash.cloudflare.com)

**Próxima:** [Parte 2: Pegar a chave do TMDB](#parte-2)

<p align="right">
<a href="#topo">
<img src="https://img.shields.io/badge/Voltar_ao_topo-⏫-blue?style=for-the-badge" alt="Voltar ao topo">
</a>
</p>

---

<a id="parte-2"></a>
## Parte 2: Pegar a chave do TMDB

**Passo 1:** Abra themoviedb.org e clique em Sign Up (Cadastrar). Confirme o e-mail que chegar.

<p align="center"><img src="https://i.imgur.com/SJKS83X.png" alt="Cadastro no TMDB" width="720"></p>

**Passo 2:** Entre na sua conta. Clique na sua foto ou no seu nome, no canto superior direito, e depois em Settings (Configurações).

<p align="center"><img src="https://i.imgur.com/d9qKkzA.png" alt="Acesso às configurações da conta TMDB" width="720"></p>

**Passo 3:** No menu lateral, clique em API.

<p align="center"><img src="https://i.imgur.com/Q6pvGVC.png" alt="Opção API no menu do TMDB" width="720"></p>

**Passo 4:** Se aparecer Request an API Key, clique nele e escolha Developer (Desenvolvedor).

<p align="center"><img src="https://i.imgur.com/5hhUtjF.png" alt="Solicitação de uma chave de API para desenvolvedor" width="720"></p>

**Passo 5:** Preencha o formulário assim:

- **Application Name:** Sintonize pessoal
- **Application URL:** pode ser qualquer endereço, por exemplo https://github.com/willianmenegazzifloy-create/sintonize
- **Application Summary:** Uso pessoal de um addon para o Nuvio

<p align="center"><img src="https://i.imgur.com/3rum6WG.png" alt="Formulário de solicitação da API do TMDB preenchido" width="720"></p>

**Passo 6:** Aceite os termos e envie.

> [!NOTE]
> Se você já tinha conta no TMDB, essa etapa pode não aparecer.

**Passo 7:** Na página da API aparece a API Key, uma sequência de cerca de 32 letras e números. Copie e guarde num bloco de notas.

> [!WARNING]
> Não use a "API Read Access Token", que é a chave bem maior. Use a API Key curta.

<p align="center"><img src="https://i.imgur.com/0zKOoHY.png" alt="API Key curta exibida nas configurações do TMDB" width="720"></p>

**Próxima:** [Parte 3: Pegar o código do Sintonize](#parte-3)

<p align="right">
<a href="#topo">
<img src="https://img.shields.io/badge/Voltar_ao_topo-⏫-blue?style=for-the-badge" alt="Voltar ao topo">
</a>
</p>

---

<a id="parte-3"></a>
## Parte 3: Pegar o código do Sintonize

Esta parte mudou: como o tutorial já está dentro do repositório, não é preciso navegar até o arquivo.

O código do Sintonize está neste mesmo repositório, no arquivo worker.js.

<p align="center">
  <a href="https://github.com/willianmenegazzifloy-create/sintonize/blob/main/worker.js"><img src="https://img.shields.io/badge/Abrir%20worker.js-161616?style=flat-square" alt="Abrir worker.js"></a>
  <a href="https://raw.githubusercontent.com/willianmenegazzifloy-create/sintonize/main/worker.js"><img src="https://img.shields.io/badge/C%C3%B3digo%20bruto%20(raw)-161616?style=flat-square" alt="Abrir código bruto raw do worker.js"></a>
</p>

**Passo 1:** Clique em "Abrir worker.js".

**Passo 2:** No alto do arquivo, à direita, clique no ícone Copy raw file (os dois quadradinhos). Ele copia o código inteiro de uma vez.

Alternativa: clique no ícone Download raw file (seta para baixo) para baixar o arquivo, abra no Bloco de Notas, aperte Ctrl+A e depois Ctrl+C. Outra opção: abra o "Código bruto (raw)", aperte Ctrl+A e Ctrl+C.

**Passo 3:** Deixe o código copiado. Você vai colar na Parte 4.

> [!NOTE]
> O arquivo é grande (cerca de 156 KB). É normal, pode demorar um instante para carregar. Os nomes dos ícones podem variar um pouco.

> [!NOTE]
> Você não precisa baixar o collection-template.json. O painel do seu Worker busca esse modelo sozinho, aqui do GitHub.

**Próxima:** [Parte 4: Criar o Worker](#parte-4)

<p align="right">
<a href="#topo">
<img src="https://img.shields.io/badge/Voltar_ao_topo-⏫-blue?style=for-the-badge" alt="Voltar ao topo">
</a>
</p>

---

<a id="parte-4"></a>
## Parte 4: Criar o Worker

O Worker é o programa que roda o seu Sintonize na Cloudflare.

**Passo 1:** No painel da Cloudflare (dash.cloudflare.com), clique em Workers & Pages no menu da esquerda (ou Compute > Workers & Pages).

<p align="center"><img src="https://i.imgur.com/0xmUAPR.png" alt="Menu Workers & Pages no painel da Cloudflare" width="720"></p>

**Passo 2:** Clique em Create (Criar) e depois em Start with Hello World! (ou Create Worker, conforme a tela).

<p align="center"><img src="https://i.imgur.com/4MDeidk.png" alt="Opções para criar um Worker" width="720"></p>

**Passo 3:** Em Name (Nome), digite o nome que você quiser para o seu Worker. Não precisa ser "meu-sintonize"; esse nome vira parte do endereço.

<p align="center"><img src="https://i.imgur.com/XirEsds.png" alt="Campo para escolher o nome do Worker" width="720"></p>

**Passo 4:** Clique em Deploy. Na primeira vez, a Cloudflare pede para criar um subdomínio workers.dev. Escolha um nome curto, como seu apelido. Ele aparece em todos os seus Workers.

<p align="center"><img src="https://i.imgur.com/iskVjr8.png" alt="Deploy do Worker e configuração do subdomínio workers.dev" width="720"></p>

> [!IMPORTANT]
> **Como ler os endereços deste tutorial:** depois do deploy, o endereço do seu Worker fica assim: `https://NOME-DO-WORKER.SEU-SUBDOMINIO.workers.dev`. `NOME-DO-WORKER` é o nome que você escolheu no passo 3. `SEU-SUBDOMINIO` é o subdomínio workers.dev que a Cloudflare criou para você. Em todo o tutorial, troque esses dois pelo que é seu. Anote o seu endereço completo, você vai usar várias vezes.

**Passo 5:** Na página do Worker, clique em Edit code (Editar código).

<p align="center"><img src="https://i.imgur.com/4vO4kT1.png" alt="Edição do código do Worker" width="720"></p>

**Passo 6:** Clique dentro do editor, aperte Ctrl+A e depois Delete para apagar o código de exemplo.

<p align="center"><img src="https://i.imgur.com/vTomziS.png" alt="Editor com o código de exemplo selecionado" width="720"></p>

**Passo 7:** Aperte Ctrl+V para colar o código do Sintonize que você copiou na Parte 3.

<p align="center"><img src="https://i.imgur.com/z64GQPG.png" alt="Código do Sintonize colado no editor" width="720"></p>

**Passo 8:** Clique em Deploy no canto superior direito.

<p align="center"><img src="https://i.imgur.com/W7h8ogU.png" alt="Botão Deploy no editor do Worker" width="720"></p>

> [!NOTE]
> Nesse ponto o Worker está no ar, mas ainda não funciona completamente. Faltam o KV e as chaves.

**Próxima:** [Parte 5: Criar o KV (o armazenamento)](#parte-5)

<p align="right">
<a href="#topo">
<img src="https://img.shields.io/badge/Voltar_ao_topo-⏫-blue?style=for-the-badge" alt="Voltar ao topo">
</a>
</p>

---

<a id="parte-5"></a>
## Parte 5: Criar o KV (o armazenamento)

O KV guarda a sua lista de addons, as preferências e o cache.

**Passo 1:** No painel da Cloudflare, clique em Storage & databases (ou Storage & Compute) no menu da esquerda. Depois clique em Workers KV. Em algumas telas aparece só KV.

<p align="center"><img src="https://i.imgur.com/7tX31Rh.png" alt="Acesso ao Workers KV no painel da Cloudflare" width="720"></p>

**Passo 2:** Clique em Create a KV namespace (ou Create instance).

<p align="center"><img src="https://i.imgur.com/YtrN3Mc.png" alt="Criação de um namespace KV" width="720"></p>

**Passo 3:** Em Namespace name, digite exatamente: `sintonize-cache`

<p align="center"><img src="https://i.imgur.com/guDaaCj.png" alt="Campo de nome do namespace KV" width="720"></p>

**Passo 4:** Clique em Add ou Create.

**Próxima:** [Parte 6: Ligar o KV ao Worker (binding)](#parte-6)

<p align="right">
<a href="#topo">
<img src="https://img.shields.io/badge/Voltar_ao_topo-⏫-blue?style=for-the-badge" alt="Voltar ao topo">
</a>
</p>

---

<a id="parte-6"></a>
## Parte 6: Ligar o KV ao Worker (binding)

Esse passo faz o Worker enxergar o KV com o nome que o código espera.

**Passo 1:** Volte em Workers & Pages e clique no seu Worker.

<p align="center"><img src="https://i.imgur.com/YKDpJNC.png" alt="Seu Worker na lista Workers & Pages" width="720"></p>

**Passo 2:** Clique na aba Settings (Configurações), no topo.

<p align="center"><img src="https://i.imgur.com/ZRaImzc.png" alt="Aba Settings nas configurações do Worker" width="720"></p>

**Passo 3:** Na seção Bindings (Vínculos), clique em Add binding (Adicionar vínculo).

<p align="center"><img src="https://i.imgur.com/1YEhZ5J.png" alt="Opção Add binding na seção Bindings" width="720"></p>

**Passo 4:** Escolha o tipo KV namespace.

<p align="center"><img src="https://i.imgur.com/O75MtB5.png" alt="Tipo KV namespace para o binding" width="720"></p>

**Passo 5:** Em Variable name, digite exatamente: `CACHE` (tudo maiúsculo, sem espaço). Em KV namespace, escolha sintonize-cache.

<p align="center"><img src="https://i.imgur.com/KCZBVEq.png" alt="Configuração do binding CACHE para sintonize-cache" width="720"></p>

> [!WARNING]
> Se o nome da variável estiver diferente de CACHE, o Sintonize não encontra o armazenamento.

**Passo 6:** Clique em Save ou Add binding. O binding CACHE deve aparecer na lista.

<p align="center"><img src="https://i.imgur.com/tqEJmte.png" alt="Binding CACHE exibido na lista" width="720"></p>

**Próxima:** [Parte 7: Criar as duas senhas (secrets)](#parte-7)

<p align="right">
<a href="#topo">
<img src="https://img.shields.io/badge/Voltar_ao_topo-⏫-blue?style=for-the-badge" alt="Voltar ao topo">
</a>
</p>

---

<a id="parte-7"></a>
## Parte 7: Criar as duas senhas (secrets)

Secrets são valores escondidos. Depois de salvar, você não consegue ver de novo, e isso é de propósito.

**Passo 1:** Ainda em Settings do Worker, vá em Variables and secrets (Variáveis e segredos).

<p align="center"><img src="https://i.imgur.com/ITog8lA.png" alt="Seção Variables and secrets nas configurações do Worker" width="720"></p>

**Passo 2:** Clique em Add. Em Type, escolha Secret. Não use Text para essas duas.

<p align="center"><img src="https://i.imgur.com/lLN3JyJ.png" alt="Seleção do tipo Secret" width="720"></p>

**Passo 3:** Senha do painel. Variable name: `ADMIN_PASSWORD`. Value: a senha que você vai usar para entrar no painel. Use uma senha forte e anote num lugar seguro.

<p align="center"><img src="https://i.imgur.com/2SwFMRI.png" alt="Configuração do secret ADMIN_PASSWORD" width="720"></p>

**Passo 4:** Chave do TMDB. Clique em Add de novo, com Type em Secret. Variable name: `TMDB_API_KEY`. Value: a API Key do TMDB (Parte 2, passo 7).

<p align="center"><img src="https://i.imgur.com/uyjskMy.png" alt="Configuração do secret TMDB_API_KEY" width="720"></p>

**Passo 5:** Salve. Não coloque espaço antes ou depois dos valores e não use aspas. Ao salvar os secrets, a Cloudflare faz o deploy sozinha: você não precisa clicar em Deploy.

**Próxima:** [Parte 8: Testar se está funcionando](#parte-8)

<p align="right">
<a href="#topo">
<img src="https://img.shields.io/badge/Voltar_ao_topo-⏫-blue?style=for-the-badge" alt="Voltar ao topo">
</a>
</p>

---

<a id="parte-8"></a>
## Parte 8: Testar se está funcionando

**Passo 1:** Abra uma aba nova e cole o endereço do seu Worker: `https://NOME-DO-WORKER.SEU-SUBDOMINIO.workers.dev/`

**Passo 2:** Devem aparecer três linhas em Pronto: Secret TMDB_API_KEY, Secret ADMIN_PASSWORD e KV com o nome CACHE.

<p align="center"><img src="https://i.imgur.com/pII3pQl.png" alt="Verificação de secrets e KV com status Pronto" width="720"></p>

Se alguma aparecer como Faltando:

- **TMDB_API_KEY ou ADMIN_PASSWORD:** o secret não foi salvo ou o nome está errado. Volte à Parte 7.
- **KV com o nome CACHE:** o binding está com outro nome ou não foi salvo. Volte à Parte 6.
- Depois de corrigir, espere alguns segundos e recarregue a página com Ctrl+F5.

**Próxima:** [Parte 9: Entrar no painel e adicionar as fontes](#parte-9)

<p align="right">
<a href="#topo">
<img src="https://img.shields.io/badge/Voltar_ao_topo-⏫-blue?style=for-the-badge" alt="Voltar ao topo">
</a>
</p>

---

<a id="parte-9"></a>
## Parte 9: Entrar no painel e adicionar as fontes

**Passo 1:** Abra `https://NOME-DO-WORKER.SEU-SUBDOMINIO.workers.dev/admin`.

**Passo 2:** Digite a senha do ADMIN_PASSWORD e clique em Entrar no painel.

<p align="center"><img src="https://i.imgur.com/SUOleiW.png" alt="Tela de entrada do painel Sintonize" width="720"></p>

**Passo 3:** No menu da esquerda, clique em Addons. Você vai ver os cartões dos parceiros recomendados, FrostStream e FenixFlix, ambos gratuitos e sem TorBox.

<p align="center"><img src="https://i.imgur.com/49fXPlc.png" alt="Cartões de parceiros recomendados na seção Addons" width="720"></p>

> [!TIP]
> Usar os parceiros é recomendado, mas não é obrigatório. Você também pode adicionar os seus próprios addons, desde que sejam compatíveis (o link do addon termina em manifest.json).

**Passo 4:** Clique em Abrir site no FrostStream. Ele abre o site oficial (froststream.cloutteam.com). Siga as instruções de lá para pegar o link do manifesto, que sempre termina em manifest.json. Copie esse link.

<p align="center"><img src="https://i.imgur.com/ye06M4m.png" alt="Abertura do site FrostStream pelo painel" width="720"></p>

**Passo 5:** Volte ao painel, cole o link no campo Endereço do addon, em Conectar um addon, e clique em Validar e adicionar.

<p align="center"><img src="https://i.imgur.com/F9nmfMT.png" alt="Campo Endereço do addon e opção para validar e adicionar" width="720"></p>

**Passo 6:** Se aparecer uma mensagem verde com o nome e a quantidade de catálogos, deu certo.

<p align="center"><img src="https://i.imgur.com/ZaCJY7P.png" alt="Mensagem de confirmação do addon e quantidade de catálogos" width="720"></p>

**Passo 7:** Repita os passos 4 a 6 para o FenixFlix (fenixflix.fenixhub.online).

> [!NOTE]
> Se der erro no FenixFlix, pode continuar usando só o FrostStream.

**Passo 8:** Clique em Salvar tudo, no canto superior direito.

<p align="center"><img src="https://i.imgur.com/QRfeQKf.png" alt="Botão Salvar tudo no painel" width="720"></p>

> [!WARNING]
> Sempre clique em Salvar tudo depois de qualquer mudança no painel, senão ela se perde.

Se der erro ao validar, confira se o link está completo e termina em manifest.json, e se o site do parceiro está funcionando.

**Próxima:** [Parte 10: Baixar o collection](#parte-10)

<p align="right">
<a href="#topo">
<img src="https://img.shields.io/badge/Voltar_ao_topo-⏫-blue?style=for-the-badge" alt="Voltar ao topo">
</a>
</p>

---

<a id="parte-10"></a>
## Parte 10: Baixar o collection

O collection organiza as coleções no Nuvio e já vem com o endereço do seu Worker.

**Passo 1:** No painel, clique em Collection no menu da esquerda.

<p align="center"><img src="https://i.imgur.com/QI4lWLV.png" alt="Seção Collection no painel Sintonize" width="720"></p>

**Passo 2:** Clique em Baixar collection pronto.

<p align="center"><img src="https://i.imgur.com/AcmtgAC.png" alt="Opção para baixar o collection pronto" width="720"></p>

**Passo 3:** O navegador baixa o arquivo sintonize-collection.json (cerca de 3 MB). Guarde-o num lugar fácil de achar, como a pasta Downloads. Você não precisa editar nada nele.

> [!NOTE]
> Se aparecer um erro, espere alguns minutos e tente de novo.

**Próxima:** [Parte 11: Colocar tudo no Nuvio](#parte-11)

<p align="right">
<a href="#topo">
<img src="https://img.shields.io/badge/Voltar_ao_topo-⏫-blue?style=for-the-badge" alt="Voltar ao topo">
</a>
</p>

---

<a id="parte-11"></a>
## Parte 11: Colocar tudo no Nuvio

Aqui o addon é adicionado pelo app do Nuvio e o collection é importado pelo site. Também dá para importar o collection pelo app (o caminho é parecido), mas este tutorial usa o site.

### 11.1: Adicionar o addon (pelo app do Nuvio)

**Passo 1:** Abra o app do Nuvio e vá na área de Addons (ou Complementos).

<p align="center"><img src="https://i.imgur.com/5COwaOT.png" alt="Área de Addons no app do Nuvio" width="720"></p>

**Passo 2:** Você vai colar o endereço do manifesto do seu Worker. Para achá-lo, abra o endereço do painel, `https://NOME-DO-WORKER.SEU-SUBDOMINIO.workers.dev/admin`, e troque o final /admin por /manifest.json. Fica assim: `https://NOME-DO-WORKER.SEU-SUBDOMINIO.workers.dev/manifest.json`

Cole esse endereço no campo de adicionar addon e confirme (Add ou Adicionar).

<p align="center"><img src="https://i.imgur.com/L9vYb0h.png" alt="Campo para adicionar o manifesto do addon no Nuvio" width="720"></p>

**Passo 3:** Se o nome Sintonize aparecer na lista de addons, deu certo.

### 11.2: Remover o que pode dar conflito

> [!IMPORTANT]
> O Nuvio pode vir com um catálogo padrão e você pode já ter uma collection antiga. Os dois podem gerar conflito com o Sintonize. Deixe a conta limpa antes de importar.

**Passo 1:** Ainda na área de Addons do app, procure o catálogo padrão do Nuvio. Se existir, remova ou desative.

**Passo 2:** Pelo site, abra [nuvio.tv/account?tab=collections](https://nuvio.tv/account?tab=collections) e entre na sua conta. Se já houver collections suas, anote os nomes do que você quer guardar. Se a lista estiver vazia, como na imagem, pule para o próximo passo.

<p align="center"><img src="https://i.imgur.com/ZZSb7o0.png" alt="Lista de collections na conta do Nuvio" width="720"></p>

**Passo 3:** Remova as collections antigas. Recomendamos remover as antigas antes de adicionar a nova que você baixou.

> [!WARNING]
> A remoção não tem como desfazer. Confira antes de apagar.

### 11.3: Importar o collection (pelo site)

**Passo 1:** Em [nuvio.tv/account?tab=collections](https://nuvio.tv/account?tab=collections), clique em Import (ou Importar).

<p align="center"><img src="https://i.imgur.com/8szFL6V.png" alt="Opção Import na página de collections do Nuvio" width="720"></p>

**Passo 2:** Selecione o arquivo sintonize-collection.json que você baixou na Parte 10.

<p align="center"><img src="https://i.imgur.com/uiLh1it.png" alt="Seleção do arquivo sintonize-collection.json para importar" width="720"></p>

**Passo 3:** Confirme. As coleções devem aparecer na lista.

<p align="center"><img src="https://i.imgur.com/74JMEwf.png" alt="Collections importadas na conta do Nuvio" width="720"></p>

> [!NOTE]
> Pelo app também dá: Configurações (ou sua conta), depois Collections, depois Importar. Os nomes das telas podem mudar de uma versão para outra.

### 11.4: Testar

Abra um filme ou uma série no Nuvio. Se aparecerem fontes com o nome do Sintonize, está funcionando.

<p align="center"><img src="https://i.imgur.com/BTH9mRB.png" alt="Fontes do Sintonize exibidas em um título no Nuvio" width="720"></p>

Se não aparecer nada, confira se o addon foi adicionado pelo manifest.json e se o Worker abre no navegador.

**Próxima:** [Parte 12: Personalizar (opcional)](#parte-12)

<p align="right">
<a href="#topo">
<img src="https://img.shields.io/badge/Voltar_ao_topo-⏫-blue?style=for-the-badge" alt="Voltar ao topo">
</a>
</p>

---

<a id="parte-12"></a>
## Parte 12: Personalizar (opcional)

### Explorar o painel

Entre em `https://NOME-DO-WORKER.SEU-SUBDOMINIO.workers.dev/admin` e explore à vontade. O menu da esquerda tem estas abas:

- **Visão geral**
- **Addons:** seus addons, preferências rápidas, parceiros recomendados, conectar um addon e sua biblioteca
- **Qualidade:** ajustes de qualidade das fontes
- **Idiomas:** ajustes de idioma
- **Apresentação:** como as fontes aparecem (formatação das fontes, importar formatação)
- **Collection:** baixar o collection pronto
- **Backup & ferramentas:** backup e manutenção, armazenamento

> [!WARNING]
> Depois de qualquer mudança, clique em Salvar tudo. Sem isso, a mudança não vale.

### Trocar a logo sem mexer no código

**Passo 1:** No Cloudflare, abra o seu Worker e vá em Settings > Variables and secrets.

**Passo 2:** Clique em Add, escolha o tipo Text (não Secret) e preencha: Variable name: `LOGO_URL`. Value: o link direto da imagem, que termina em .jpg, .png ou .jpeg.

**Passo 3:** Salve. A Cloudflare aplica sozinha. Espere alguns segundos e recarregue a página do painel com Ctrl+F5.

> [!NOTE]
> Use um link que não expire. Links do Discord expiram.

**Próxima:** [Quando algo der errado](#quando-algo-der-errado)

<p align="right">
<a href="#topo">
<img src="https://img.shields.io/badge/Voltar_ao_topo-⏫-blue?style=for-the-badge" alt="Voltar ao topo">
</a>
</p>

---

## Quando algo der errado

| Sintoma | O que fazer |
|---|---|
| Página do Worker dá erro 404 ou "Not found" | Confira o endereço. Deve ser o do Worker, não o do painel da Cloudflare. |
| /admin diz "Não autorizado" | A senha está errada. Confira o ADMIN_PASSWORD. |
| O painel não salva e mostra erro de KV | O binding CACHE não está ligado. Volte à Parte 6. |
| A página inicial mostra "Faltando" | Volte às Partes 6 e 7 e confira os nomes, em maiúsculas. |
| Uma mudança não aparece | Espere alguns segundos e recarregue com Ctrl+F5. No painel, confira se clicou em Salvar tudo. |
| O collection dá erro ao baixar | Espere alguns minutos e tente de novo. |
| O Nuvio não mostra nada | Confira se o addon foi adicionado pelo manifest.json e se o Worker abre no navegador. |

## O que nunca fazer

- Não mostre a senha de admin nem a chave do TMDB em print, mensagem ou código.
- Não coloque a chave do TMDB dentro do worker.js. Ela fica só nos secrets.
- Não compartilhe o endereço /admin com quem você não quer que mexa no seu Sintonize.

---

<p align="center"><img src="assets/banner-obrigado.svg" width="100%" alt="Obrigado por acompanhar o tutorial Sintonize"></p>

<p align="center"><a href="README.md">← Voltar ao início</a> · <a href="#topo">Voltar ao topo</a></p>
