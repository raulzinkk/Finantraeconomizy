# Como Fazer Deploy do Finantra com Sucesso no Vercel & GitHub 🚀

Seja muito bem-vindo ao guia oficial de implantação! Agora que você enviou seu código para o GitHub e fez o deploy no Vercel, preparamos o sistema com uma camada de segurança robusta e tolerante a falhas. 

O aplicativo foi atualizado para **nunca quebrar**. Se as chaves personalizadas não forem informadas no Vercel, o sistema automaticamente acionará o **Banco de Dados Sandbox Integrado** para garantir o funcionamento imediato do seu site.

Para conectar o site implantado ao seu próprio painel pessoal do Supabase e Firebase, siga os passos simples abaixo.

---

## 🔒 1. Passo Fundamental: Configurar Variáveis de Ambiente no Vercel

As credenciais do banco **nunca devem ser escritas diretamente no código** enviado ao GitHub público (por segurança). O Vercel gerencia isso de forma extremamente segura através de **Environment Variables** (Variáveis de Ambiente).

### Como Configurar:
1. Acesse o painel do seu projeto no **[Vercel](https://vercel.com/)**.
2. Vá na aba **Settings** (Configurações) no topo da página.
3. No menu lateral esquerdo, clique em **Environment Variables** (Variáveis de Ambiente).
4. Adicione as seguintes chaves de acordo com o seu banco:

### 🌟 Para o Supabase (Seu Banco de Dados)
Adicione estas duas variáveis:
* **`VITE_SUPABASE_URL`**: A URL da sua API do Supabase (exemplo: `https://seu-codigo.supabase.co`).
* **`VITE_SUPABASE_ANON_KEY`**: A chave anônima pública (anon key) do seu projeto.

### 🌟 Para o Firebase (Caso utilize autenticação/sync na nuvem original)
Adicione estas variáveis se desejar sincronizar com seu Firebase pessoal:
* **`VITE_FIREBASE_API_KEY`**
* **`VITE_FIREBASE_AUTH_DOMAIN`**
* **`VITE_FIREBASE_PROJECT_ID`**
* **`VITE_FIREBASE_STORAGE_BUCKET`**
* **`VITE_FIREBASE_MESSAGING_SENDER_ID`**
* **`VITE_FIREBASE_APP_ID`**

---

## 🛠️ 2. Passo Crítico: Criar as Tabelas no seu Supabase (Seu Banco)

Se você apenas configurou as chaves de ambiente mas não executou o script para criar as tabelas no seu novo painel do Supabase, o banco de dados retornará um erro avisando que as tabelas não existem.

### Como Resolver:
1. No painel do seu projeto no **Supabase**, clique no menu **SQL Editor** (ícone de terminal `>_` no menu lateral esquerdo).
2. Clique em **New Query** (Nova consulta) no canto superior.
3. Volte ao aplicativo Finantra, acesse a aba **Configurações** (Propriedades do Perfil & Nuvem).
4. Clique no botão azul: **`💡 Como criar as tabelas no Supabase? (Clique aqui)`**.
5. Clique em **`Copiar SQL`** para copiar todo o script estrutural.
6. Cole o script copiado dentro do espaço de texto no **SQL Editor** do seu Supabase.
7. Clique no botão **Run** (Executar) no canto inferior direito da caixa.
8. Pronto! Suas tabelas `users`, `transactions`, `monthly_bills` e `investments` foram criadas com sucesso.

---

## 🔄 3. Passo Final: Redeploy (Redesdobrar) no Vercel

Após salvar as variáveis de ambiente acima, o Vercel precisa gerar uma nova build do seu site para injetar as novas chaves:

1. No painel do seu projeto no Vercel, clique na aba **Deployments** (Implantações).
2. Clique no botão de opções (três pontinhos `...`) ao lado do deploy mais recente.
3. Escolha **Redeploy** (Re-implantar).

Prontinho! Assim que a compilação terminar, seu site publicado estará conectado de forma 100% segura e direta às suas tabelas no Supabase!

---

### 🛡️ O que nós corrigimos para você no código?
* **Tolerância a "Undefined/Null"**: Alguns servidores de integração como o Vercel podem preencher variáveis de ambiente vazias com strings literais como `"undefined"` ou `"null"`. Desenvolvemos um resolvedor defensivo inteligente (`getEnvValue` e `getFirebaseEnv`) que detecta esse comportamento e automaticamente cai de volta de maneira segura para o banco sandbox do Finantra em vez de travar a aplicação com erros.
* **Segurança Total**: Nenhuma chave secreta ou credencial pessoal é exposta no histórico do Git. Tudo funciona via injeção segura.
