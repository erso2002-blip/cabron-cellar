# MyCellar - App Store e Play Store

Data: 2026-06-22
Versao base: v0.2.48
App ID / Bundle ID: `br.com.mycellar.app`

## Estrategia

Subir o aplicativo como wrapper nativo Capacitor do app web/PWA atual, mantendo a API em `https://mycellar.com.br`.

Prioridade atual:

1. App Store Connect: Emerson confirmou acesso ao Apple Developer em 2026-06-22. Criar app, preencher metadados e subir build iOS assim que houver Mac/Xcode disponivel.
2. Play Console: ainda precisa criar/regularizar a conta Google Play Developer. Criar preferencialmente como organizacao/empresa do projeto, nao como conta pessoal solta.
3. Manter cobranca real fechada ate webhook/persistencia de assinatura por usuario estarem concluidos.

## Status Tecnico

- Frontend: `artifacts/minha-adega`.
- Web build: `artifacts/minha-adega/dist/public`.
- Capacitor configurado na raiz do repo.
- iOS e Android devem ser gerados com `pnpm exec cap add ios` e `pnpm exec cap add android`.
- Build/sync padrao: `pnpm run mobile:build`.
- iOS inicial configurado como iPhone-only (`TARGETED_DEVICE_FAMILY = 1`) porque a experiencia de iPad ainda nao foi validada.
- Handoff operacional para Mac/Xcode: `docs/app-store-connect-handoff.md`.

## Bloqueios Do Ambiente Atual

- iOS exige macOS/Xcode para gerar e assinar `.ipa` e subir ao App Store Connect.
- Android exige Java/Android SDK para gerar `.aab`.
- Este servidor nao tinha Java instalado na checagem de 2026-06-21.

## Metadados De Loja - Base Aprovavel

Nome do app:
MyCellar

Subtitulo iOS:
Adega organizada no bolso.

Descricao curta Google Play:
Organize sua adega, acompanhe estoque e registre o consumo dos seus vinhos.

Descricao completa:
MyCellar e um app para organizar sua adega pessoal com praticidade. Cadastre seus vinhos, acompanhe a quantidade em estoque, registre garrafas consumidas e consulte informacoes importantes sobre cada rotulo.

O app foi pensado para quem quer ter controle da adega sem planilhas confusas. Voce pode registrar fotos dos rotulos, separar vinhos por adega, acompanhar historico de consumo e manter uma visao clara do que tem disponivel.

Principais recursos:
- cadastro de vinhos e informacoes do rotulo;
- organizacao por adega;
- controle de quantidade em estoque;
- historico de consumo;
- fotos do rotulo e fotos adicionais;
- leitura de rotulo com apoio de IA quando disponivel;
- termos e politica de privacidade dentro do app.

O MyCellar nao vende bebidas alcoolicas e nao incentiva consumo excessivo. O objetivo e ajudar adultos a organizar uma adega pessoal e consumir com responsabilidade.

Texto promocional iOS:
Controle sua adega pessoal com fotos, estoque e historico de consumo.

Keywords iOS:
vinho,adega,rotulo,estoque,consumo,sommelier,garrafas,enologia

Categoria sugerida:
Principal: Food & Drink.
Secundaria: Lifestyle.

Publico:
Adultos interessados em organizacao pessoal de vinhos e adega domestica. No Brasil, manter comunicacao orientada a maiores de 18 anos.

Politica de privacidade:
`https://mycellar.com.br/privacidade`

Termos de uso:
`https://mycellar.com.br/termos`

Suporte:
`https://mycellar.com.br`

E-mail de contato/suporte:
`contato@mycellar.com.br`

Copyright iOS:
`2026 MyCellar`

Idade/conteudo:
Declarar foco em maiores de 18 anos por envolver organizacao de bebidas alcoolicas. O app nao comercializa bebida, nao possui compra de alcool e nao deve ser posicionado como app infantil/familia.

Observacao comercial:
Nao afirmar venda de vinho, marketplace, clube, recomendacao medica/nutricional ou assinatura plenamente funcional ate a cobranca estar fechada com webhook e persistencia por usuario.

## Dados E Privacidade - Base Para Revisao

Dados tratados pelo app:

- nome;
- e-mail;
- dados de login/autenticacao;
- dados cadastrados pelo usuario sobre vinhos, adegas, estoque, consumo e preferencias;
- fotos de rotulos ou garrafas enviadas pelo usuario;
- dados de assinatura/pagamento quando checkout estiver liberado.

Uso:

- operar conta e autenticacao;
- salvar e organizar a adega do usuario;
- processar leitura de rotulo e recursos de IA quando acionados;
- suporte e seguranca operacional;
- assinatura e controle de acesso ao plano, quando liberado.

Compartilhamento/processadores provaveis:

- hospedagem/API/banco;
- autenticacao Google e login por e-mail;
- envio transacional de e-mail;
- servicos de IA para leitura/complemento de informacoes quando o usuario aciona o recurso;
- provedor de pagamento quando a assinatura for liberada.

Ponto de cuidado:

- Nao declarar venda aberta ou assinatura funcional nas lojas enquanto webhook e persistencia da assinatura por usuario nao estiverem fechados.
- O app coleta dados inseridos pelo usuario e imagens enviadas por ele. Preencher App Privacy/Data safety de forma conservadora, sem omitir fotos, identificadores, e-mail, dados de conta, conteudo do usuario e diagnosticos/logs.

## App Store Connect - Campos De Preenchimento

- Plataforma: iOS.
- Nome: `MyCellar`.
- Bundle ID: `br.com.mycellar.app`.
- SKU sugerido: `mycellar-ios-2026`.
- Categoria primaria: Food & Drink.
- Categoria secundaria: Lifestyle.
- Politica de privacidade: `https://mycellar.com.br/privacidade`.
- URL de suporte: `https://mycellar.com.br`.
- URL de marketing: `https://mycellar.com.br`.
- Copyright: `2026 MyCellar`.
- Versao: `0.2.48`.
- Build: `45`.
- Distribuicao inicial recomendada: TestFlight/beta fechado antes de abertura ampla.
- Review notes: informar que o app e uma adega pessoal, nao vende bebidas, e que recursos pagos/checkout podem estar limitados durante beta.
- Demo account: criar antes do review se o login Google/e-mail nao for suficiente para revisao sem friccao.

## Play Console - Conta E Campos

Conta:

- Criar preferencialmente como organizacao/empresa.
- Evitar publicar em conta pessoal avulsa para nao misturar reputacao, propriedade e acesso do projeto.
- Se for conta pessoal nova, planejar teste fechado com pelo menos 12 testadores opt-in por 14 dias continuos antes de pedir acesso a producao.

Campos do app:

- Nome: `MyCellar`.
- App/Package ID: `br.com.mycellar.app`.
- Categoria: Food & Drink.
- Tags sugeridas: Wine, Lifestyle, Productivity/Organization quando disponivel.
- Politica de privacidade: `https://mycellar.com.br/privacidade`.
- Contato: `contato@mycellar.com.br`.
- Ads: declarar sem anuncios, se mantido o escopo atual.
- Target audience: adultos; nao direcionado a criancas.
- App access: informar se houver area restrita por login e fornecer instrucao/conta demo.
- Data safety: declarar coleta de dados pessoais, conteudo do usuario, fotos/imagens e dados tecnicos conforme uso real.
- Release inicial recomendada: closed testing.

## Screenshots Necessarios

iOS:

- iPhone: telas de login, adega/lista, ficha do vinho, historico e assinatura/planos ou tela neutra sem prometer cobranca ativa.
- iPad: nao incluir na primeira submissao; o target iOS esta como iPhone-only ate validacao real de layout em iPad.

Android:

- Phone: mesmas telas principais.
- Tablet: somente se a ficha do app declarar suporte/otimizacao para tablet.

Padrao visual:

- usar prints reais do app, sem mockup generico com cara de IA;
- evitar texto promocional exagerado sobre IA ou assinatura;
- mostrar organizacao de adega, estoque, foto de rotulo e historico;
- conferir que nenhum dado pessoal real apareca nos prints.

## Checklist Antes De Enviar Para Review

- gerar assets finais de loja: icone 1024x1024, screenshots iPhone, iPad se aplicavel, Android phone e tablet se aplicavel;
- validar login real em build nativo;
- validar captura/upload de foto no build nativo;
- validar termos e privacidade abrindo dentro do app;
- criar usuario demo para revisao da Apple/Google;
- revisar metadados para nao prometer recurso ainda bloqueado;
- decidir se o app entra como beta/TestFlight/closed test ou producao;
- confirmar conta Google Play Developer e tipo de conta.

## Checklist Imediato 2026-06-22

- Apple: criar registro do app no App Store Connect com `br.com.mycellar.app`.
- Apple: configurar categoria, URLs, privacidade, classificacao etaria e metadados acima.
- Apple: em Mac/Xcode, abrir `ios/App/App.xcworkspace`, selecionar time Apple Developer, assinar, arquivar e enviar build `0.2.48 (48)`.
- Apple: liberar primeiro em TestFlight para validacao real de login, camera e fotos.
- Google: criar conta Play Console do projeto/empresa.
- Google: apos conta criada, gerar `.aab` em ambiente com JDK/Android SDK.
- Google: iniciar closed testing antes de producao se a conta cair na regra de teste obrigatorio.
- Produto: criar conta demo e lista curta de testadores.
- Juridico: revisar termos/privacidade antes de abertura publica ampla.

## Referencias Oficiais Consultadas

- Apple App Review Guidelines: `https://developer.apple.com/app-store/review/guidelines/`
- Apple App Review: `https://developer.apple.com/distribute/app-review/`
- Apple App Privacy: `https://developer.apple.com/help/app-store-connect/manage-app-information/manage-app-privacy/`
- Google Play closed testing: `https://support.google.com/googleplay/android-developer/answer/14151465`
- Google Play prepare app for review: `https://support.google.com/googleplay/android-developer/answer/9859455`
- Google Play data safety: `https://support.google.com/googleplay/android-developer/answer/10787469`
- Capacitor React: `https://capacitorjs.com/solution/react`
