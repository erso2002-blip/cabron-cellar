# MyCellar - Handoff App Store Connect

Data: 2026-06-22
Versao: 0.2.47
Build: 45
Bundle ID: br.com.mycellar.app

## Objetivo

Subir o primeiro build iOS do MyCellar para TestFlight antes de qualquer abertura publica. A primeira submissao deve ser iPhone-only, porque o layout de iPad ainda nao foi validado.

## Antes De Abrir O Xcode

No Mac com acesso ao repo:

```sh
pnpm install
pnpm run mobile:build
pnpm run mobile:open:ios
```

Confirmar no Xcode:

- Team: conta Apple Developer correta do projeto.
- Bundle Identifier: `br.com.mycellar.app`.
- Version: `0.2.47`.
- Build: `45`.
- Target device: iPhone.
- Signing: automatic signing ativo.
- Camera permission: presente.
- Photo library permission: presente.

## Criar Registro No App Store Connect

Em `Apps > New App`:

- Platform: iOS.
- Name: `MyCellar`.
- Primary language: Portuguese (Brazil) se disponivel; caso contrario, English.
- Bundle ID: `br.com.mycellar.app`.
- SKU: `mycellar-ios-2026`.
- User Access: Full Access.

## Metadados Iniciais

- Subtitle: `Adega organizada no bolso.`
- Category: Food & Drink.
- Secondary category: Lifestyle.
- Privacy Policy URL: `https://mycellar.com.br/privacidade`.
- Support URL: `https://mycellar.com.br`.
- Marketing URL: `https://mycellar.com.br`.
- Copyright: `2026 MyCellar`.
- Promotional text: `Controle sua adega pessoal com fotos, estoque e historico de consumo.`
- Keywords: `vinho,adega,rotulo,estoque,consumo,sommelier,garrafas,enologia`

Descricao:

```text
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
```

## Review Notes

```text
MyCellar is a personal wine cellar organization app. It does not sell alcoholic beverages and does not offer alcohol delivery or marketplace functionality.

The app allows adult users to organize their own wine inventory, upload label photos, track bottle quantities and register consumption history. Paid/checkout functionality may be limited during the beta phase while subscription activation is validated.
```

## Build

No Xcode:

1. Abrir `ios/App/App.xcworkspace`.
2. Selecionar destino `Any iOS Device`.
3. `Product > Archive`.
4. `Distribute App`.
5. `App Store Connect`.
6. Upload.
7. Aguardar processamento no App Store Connect.
8. Liberar primeiro em TestFlight.

## TestFlight Antes De Review Publica

Validar no aparelho real:

- login por Google ou e-mail;
- abrir tela de Adega;
- cadastrar vinho;
- tirar foto do rotulo;
- carregar foto da biblioteca;
- abrir ficha do vinho;
- registrar consumo;
- abrir termos e politica;
- confirmar que assinatura/checkout nao promete ativacao automatica antes do webhook estar fechado.

## Pendencias Que Nao Devem Ser Ignoradas

- Criar usuario demo para review se Apple nao conseguir acessar por fluxo normal.
- Gerar screenshots reais de iPhone sem dados pessoais.
- Revisar classificacao etaria como app para adultos por envolver bebidas alcoolicas, mesmo sem venda.
- Nao enviar para producao ampla antes de revisar termos, privacidade e fluxo de assinatura.
