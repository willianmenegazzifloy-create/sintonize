<a id="topo"></a>

<p align="center"><img src="assets/banner.svg" width="100%" alt="Sintonize — addon para o Nuvio"></p>

# Sintonize

Addon para o Nuvio, executado como Cloudflare Worker, que agrega catálogos e fontes de outros addons e um arquivo de collection do Nuvio.

Cada pessoa hospeda o próprio Worker na própria conta Cloudflare.

> [!IMPORTANT]
> Nunca coloque a senha de admin (`ADMIN_PASSWORD`) nem a chave do TMDB (`TMDB_API_KEY`) em nenhum arquivo do repositório. Elas ficam só nos secrets do Cloudflare.

## Visão rápida

- O projeto funciona como um Worker na Cloudflare.
- O Worker conecta seus addons e gera o collection para o Nuvio.
- O armazenamento do projeto fica em KV (`CACHE`).
- A API do TMDB é usada para buscar títulos, capas e sinopses.
- O tutorial completo está em [TUTORIAL.md](TUTORIAL.md).

## Comece aqui

1. Leia o [tutorial completo](TUTORIAL.md).
2. Abra o código do Worker em [worker.js](worker.js).
3. Consulte o template do collection em [collection-template.json](collection-template.json).
4. Acesse a Cloudflare para criar o Worker e o KV: [dash.cloudflare.com](https://dash.cloudflare.com).
5. Crie a chave da API no TMDB: [themoviedb.org/settings/api](https://www.themoviedb.org/settings/api).

## Arquivos

- `worker.js`: código principal do Cloudflare Worker.
- `collection-template.json`: base do collection do Nuvio, com os endereços do Worker preenchidos automaticamente.
- `TUTORIAL.md`: guia completo em português, passo a passo.

## Segurança

- `ADMIN_PASSWORD`: use só como secret no Cloudflare.
- `TMDB_API_KEY`: use só como secret no Cloudflare.
- Nunca compartilhe o link `/admin` com pessoas não autorizadas.
- Não salve senhas ou chaves em arquivos do repositório.

## Créditos

- Base de collection feita por Kaptain: https://github.com/ImKaptain
- Parte das imagens do collection vem do repositório bramst0ne/prism-wallpapers
- Este produto usa a API do TMDB, mas não é endossado nem certificado pelo TMDB

## Links rápidos

- [Cloudflare](https://dash.cloudflare.com)
- [Cadastro na Cloudflare](https://dash.cloudflare.com/sign-up)
- [TMDB — chave da API](https://www.themoviedb.org/settings/api)
- [Nuvio](https://nuvio.tv)
- [Tutorial completo](TUTORIAL.md)

<p align="center"><a href="#topo">Voltar ao topo</a></p>
