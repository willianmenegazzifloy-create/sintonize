# Sintonize

Addon para o Nuvio, executado como Cloudflare Worker, que agrega catálogos e fontes de outros addons e um arquivo de collection do Nuvio.
Cada pessoa hospeda o próprio Worker na própria conta Cloudflare.

## Como usar

Tutorial completo em breve.

## Arquivos

- `worker.js`: código que vai no Cloudflare Worker.
- `collection-template.json`: modelo do collection do Nuvio, que o painel do Worker transforma em um arquivo pronto com o endereço de cada pessoa.

## Créditos

- Base de collection feita por Kaptain (https://github.com/ImKaptain).
- Parte das imagens do collection vem do repositório bramst0ne/prism-wallpapers.
- Este produto usa a API do TMDB, mas não é endossado nem certificado pelo TMDB.

## Segurança

Nunca coloque a senha de admin (`ADMIN_PASSWORD`) nem a chave do TMDB (`TMDB_API_KEY`) em nenhum arquivo do repositório. Elas ficam só nos secrets do Cloudflare.
