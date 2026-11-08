<a id="topo"></a>

<p align="center"><a href="TUTORIAL.md"><img src="assets/banner.svg" width="100%" alt="Sintonize — addon para o Nuvio. Clique para começar o tutorial."></a></p>

<h1 align="center">Sintonize</h1>
<p align="center">Seu próprio addon e collection para o Nuvio, hospedados de graça na sua conta Cloudflare.</p>

<p align="center">
  <a href="TUTORIAL.md"><img src="https://img.shields.io/badge/COME%C3%87AR-TUTORIAL%20PASSO%20A%20PASSO-8b5cf6?style=for-the-badge" alt="Começar tutorial passo a passo"></a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/idioma-pt--BR-6e40c9?style=flat-square" alt="Idioma: português do Brasil">
  <img src="https://img.shields.io/badge/plataforma-Nuvio-6e40c9?style=flat-square" alt="Plataforma: Nuvio">
  <img src="https://img.shields.io/badge/hospedagem-Cloudflare%20Workers-6e40c9?style=flat-square&logo=cloudflare&logoColor=white" alt="Hospedagem: Cloudflare Workers">
  <img src="https://img.shields.io/badge/dados-TMDB-6e40c9?style=flat-square" alt="Dados: TMDB">
</p>

<p align="center">
  <a href="worker.js"><img src="https://img.shields.io/badge/WORKER.JS-7c3aed?style=for-the-badge" alt="Ver worker.js"></a>
  <a href="collection-template.json"><img src="https://img.shields.io/badge/COLLECTION%20JSON-7c3aed?style=for-the-badge" alt="Ver collection-template.json"></a>
</p>

---

## O que é o Sintonize

O Sintonize reúne um **addon** e um **collection** para ampliar e organizar sua experiência no Nuvio. O addon é um Cloudflare Worker pessoal: ele oferece recursos de catálogo e detalhes em português, permite administrar preferências no painel e, se você quiser, agrega catálogos e fontes de outros addons compatíveis em um único manifesto.

O collection organiza as coleções dentro do Nuvio. O modelo incluído no projeto é processado pelo Worker para gerar um arquivo pronto, já adaptado ao endereço da sua instância. Assim, o addon e o collection trabalham em conjunto: o addon fornece os recursos e o collection organiza a apresentação das coleções no Nuvio.

## Como usar addon e collection

Para a experiência integrada e mais versátil do Sintonize, use o manifesto do seu Worker junto com o collection gerado pelo painel. O tutorial explica a configuração completa, do início ao teste no Nuvio.

> [!NOTE]
> Conectar outros addons pelo agregador do painel é opcional. Se preferir, você pode adicionar addons compatíveis diretamente ao Nuvio, cada um separadamente. O collection do Sintonize continua sendo o arquivo que organiza as coleções; para usar a experiência completa do Sintonize, adicione também o manifesto do seu Worker.

> [!TIP]
> Não precisa programar: siga o [tutorial completo](TUTORIAL.md), que explica a configuração passo a passo.

## Comece aqui

<p align="center"><a href="TUTORIAL.md"><img src="assets/banner-comecar.svg" width="100%" alt="Vamos começar? Abra o tutorial passo a passo."></a></p>

1. Abra o [tutorial completo](TUTORIAL.md).
2. Consulte o código do Worker em [`worker.js`](worker.js).
3. Consulte o modelo do collection em [`collection-template.json`](collection-template.json).

## O que compõe o projeto

| Parte | Função |
|---|---|
| **Addon Sintonize** | Roda como Cloudflare Worker, oferece recursos em português e administra preferências. Opcionalmente, agrega addons compatíveis no manifesto do Sintonize. |
| **Collection Sintonize** | Organiza as coleções no Nuvio. O painel gera uma cópia pronta com o endereço do Worker de cada pessoa. |
| **Painel** | Permite configurar os addons e preferências e gerar o collection pronto para importar. |
| **KV** | Armazena configurações e cache do Worker na Cloudflare. |

## Arquivos do projeto

| Arquivo | Para que serve |
|---|---|
| [`worker.js`](worker.js) | Código principal executado como Cloudflare Worker. |
| [`collection-template.json`](collection-template.json) | Modelo de collection transformado pelo painel em um arquivo pronto para o Nuvio. |
| [`TUTORIAL.md`](TUTORIAL.md) | Tutorial completo de configuração e uso, em português do Brasil. |
| `assets/` | Banners SVG usados nesta documentação. |

## Links úteis

- [Painel da Cloudflare](https://dash.cloudflare.com)
- [Criar conta na Cloudflare](https://dash.cloudflare.com/sign-up)
- [TMDB — configurações da API](https://www.themoviedb.org/settings/api)
- [Nuvio — conta e collections](https://nuvio.tv/account?tab=collections)
- [FrostStream](https://froststream.cloutteam.com)
- [FenixFlix](https://fenixflix.fenixhub.online)

## Segurança

> [!WARNING]
> Nunca coloque a senha de admin (`ADMIN_PASSWORD`) nem a chave do TMDB (`TMDB_API_KEY`) em nenhum arquivo do repositório, print ou mensagem. Elas ficam somente nos secrets do Cloudflare. Não compartilhe o endereço `/admin` com quem você não quer que administre seu Sintonize.

## Licença

O código deste projeto é distribuído sob a [Licença MIT](LICENSE). Consulte também a [explicação em português](LICENCA.md). A licença não concede direitos sobre marcas, serviços ou conteúdos de terceiros.

---

<p align="center"><img src="assets/banner-obrigado.svg" width="100%" alt="Obrigado por estar aqui. Com carinho, WillianFloy."></p>

## Créditos e contato

- Base de collection feita por Kaptain: [github.com/ImKaptain](https://github.com/ImKaptain)
- Parte das imagens do collection vem do repositório [bramst0ne/prism-wallpapers](https://github.com/bramst0ne/prism-wallpapers).
- Este produto usa a API do TMDB, mas não é endossado nem certificado pelo TMDB.

<p align="center"><strong>Feito por WillianFloy</strong><br>Discord: <code>@willianfloy</code></p>

<p align="center"><a href="#topo">Voltar ao topo</a></p>
