import { Link } from "wouter";

const updatedAt = "18 de junho de 2026";
const contactEmail = "contato@mycellar.com.br";

function LegalShell({
  children,
  eyebrow,
  title,
}: {
  children: React.ReactNode;
  eyebrow: string;
  title: string;
}) {
  return (
    <main className="min-h-screen bg-background px-5 py-8 text-foreground">
      <article className="mx-auto max-w-3xl">
        <Link
          className="mb-8 inline-flex text-sm text-muted-foreground hover:text-foreground"
          href="/"
        >
          Voltar ao MyCellar
        </Link>

        <header className="mb-8 border-b pb-6">
          <p className="mb-2 text-sm uppercase text-muted-foreground">{eyebrow}</p>
          <h1 className="text-3xl font-semibold">{title}</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Ultima atualizacao: {updatedAt}
          </p>
        </header>

        <div className="prose prose-neutral max-w-none prose-headings:text-foreground prose-p:text-foreground prose-li:text-foreground prose-a:text-primary">
          {children}
        </div>
      </article>
    </main>
  );
}

export function TermsOfUse() {
  return (
    <LegalShell eyebrow="Termos" title="Termos de Uso do MyCellar">
      <p>
        Estes Termos de Uso regulam o acesso e a utilizacao do MyCellar, uma
        aplicacao digital para organizacao pessoal de adega, cadastro de vinhos,
        acompanhamento de consumo e consulta de informacoes relacionadas aos
        rotulos cadastrados pelo usuario.
      </p>

      <h2>1. Aceite dos termos</h2>
      <p>
        Ao acessar ou utilizar o MyCellar, o usuario declara que leu, compreendeu
        e concorda com estes Termos de Uso e com a Politica de Privacidade. Caso
        nao concorde, nao deve utilizar a aplicacao.
      </p>

      <h2>2. Finalidade do servico</h2>
      <p>
        O MyCellar tem finalidade informativa e organizacional. A aplicacao ajuda
        o usuario a registrar vinhos, acompanhar sua adega, consultar historico
        de consumo e receber sugestoes de organizacao ou consumo com base nas
        informacoes cadastradas.
      </p>

      <h2>3. Cadastro e acesso</h2>
      <p>
        O acesso pode ocorrer por login Google ou por codigo enviado ao e-mail. O
        usuario e responsavel por manter seu e-mail e seus meios de acesso
        seguros, bem como por todas as atividades realizadas em sua conta.
      </p>

      <h2>4. Responsabilidades do usuario</h2>
      <p>O usuario se compromete a:</p>
      <ul>
        <li>fornecer informacoes verdadeiras e atualizadas;</li>
        <li>usar o app apenas para fins licitos e pessoais;</li>
        <li>nao tentar acessar dados, contas ou sistemas de terceiros;</li>
        <li>nao inserir conteudo ofensivo, ilegal ou que viole direitos de terceiros;</li>
        <li>manter seus dispositivos e credenciais protegidos.</li>
      </ul>

      <h2>5. Informacoes sobre vinhos</h2>
      <p>
        Informacoes sobre vinhos, safras, consumo ideal, origem, harmonizacao ou
        caracteristicas dos rotulos podem ter carater estimativo, informativo ou
        ser derivadas de dados fornecidos pelo proprio usuario. O MyCellar nao
        garante exatidao absoluta dessas informacoes.
      </p>

      <h2>6. Consumo responsavel</h2>
      <p>
        O MyCellar nao incentiva consumo excessivo de bebidas alcoolicas. O
        usuario deve observar a legislacao aplicavel, consumir com
        responsabilidade e nao utilizar a aplicacao caso seja menor de 18 anos.
      </p>

      <h2>7. Disponibilidade do servico</h2>
      <p>
        Buscamos manter o app disponivel e seguro, mas podem ocorrer manutencoes,
        indisponibilidades, falhas de conexao, erros de terceiros ou interrupcoes
        fora do nosso controle.
      </p>

      <h2>8. Propriedade intelectual</h2>
      <p>
        A marca, identidade visual, layout, textos, codigos, banco de dados,
        funcionalidades e demais elementos do MyCellar pertencem aos seus
        titulares ou licenciadores. O usuario recebe apenas uma permissao limitada
        de uso da aplicacao.
      </p>

      <h2>9. Limitacao de responsabilidade</h2>
      <p>
        O MyCellar nao se responsabiliza por perdas decorrentes de informacoes
        incorretas inseridas pelo usuario, decisoes de compra, venda, consumo,
        avaliacao comercial de vinhos, armazenamento inadequado, falhas de
        terceiros ou uso indevido da aplicacao.
      </p>

      <h2>10. Alteracoes</h2>
      <p>
        Estes Termos podem ser atualizados para refletir melhorias do servico,
        ajustes legais ou mudancas operacionais. Quando houver alteracao
        relevante, poderemos informar o usuario pelos canais disponiveis.
      </p>

      <h2>11. Contato</h2>
      <p>
        Duvidas sobre estes Termos podem ser enviadas para{" "}
        <a href={`mailto:${contactEmail}`}>{contactEmail}</a>.
      </p>
    </LegalShell>
  );
}

export function PrivacyPolicy() {
  return (
    <LegalShell eyebrow="Privacidade" title="Politica de Privacidade e Consentimento">
      <p>
        Esta Politica de Privacidade explica como o MyCellar coleta, usa,
        armazena e protege dados pessoais de usuarios, em conformidade com a Lei
        Geral de Protecao de Dados Pessoais, Lei 13.709/2018.
      </p>

      <h2>1. Dados que podemos coletar</h2>
      <p>Podemos tratar os seguintes dados, conforme o uso da aplicacao:</p>
      <ul>
        <li>nome, e-mail e identificadores de login;</li>
        <li>informacoes de conta Google, quando o login Google for utilizado;</li>
        <li>dados cadastrados pelo usuario sobre vinhos e adega;</li>
        <li>historico de consumo registrado no app;</li>
        <li>imagens ou informacoes de rotulos enviadas para leitura ou cadastro;</li>
        <li>dados tecnicos, como IP, dispositivo, navegador, logs e eventos de seguranca.</li>
      </ul>

      <h2>2. Finalidades do tratamento</h2>
      <p>Os dados podem ser usados para:</p>
      <ul>
        <li>criar e autenticar a conta do usuario;</li>
        <li>permitir o cadastro, consulta e organizacao da adega;</li>
        <li>gerar historico, estatisticas e sugestoes dentro do app;</li>
        <li>melhorar estabilidade, seguranca e experiencia de uso;</li>
        <li>prevenir fraude, abuso, acesso indevido ou incidentes de seguranca;</li>
        <li>cumprir obrigacoes legais ou regulatorias quando aplicavel.</li>
      </ul>

      <h2>3. Bases legais</h2>
      <p>
        O tratamento pode ocorrer com base em execucao de contrato, consentimento,
        legitimo interesse, cumprimento de obrigacao legal e protecao contra
        fraude ou seguranca da aplicacao, conforme o caso.
      </p>

      <h2>4. Consentimento do usuario</h2>
      <p>
        Ao marcar o aceite e utilizar o MyCellar, o usuario consente com o
        tratamento dos dados necessarios para funcionamento da aplicacao,
        incluindo dados de login, dados cadastrados sobre a adega e registros
        tecnicos de seguranca. O consentimento pode ser revogado mediante
        solicitacao, observadas as hipoteses legais que autorizem a conservacao
        de determinados dados.
      </p>

      <h2>5. Compartilhamento de dados</h2>
      <p>
        Podemos compartilhar dados com provedores essenciais ao funcionamento do
        app, como hospedagem, autenticacao, envio de e-mail, armazenamento,
        ferramentas de seguranca e servicos de inteligencia artificial quando
        usados para processar informacoes enviadas pelo usuario. Esses terceiros
        devem tratar os dados apenas conforme necessario para prestar o servico.
      </p>

      <h2>6. Retencao e exclusao</h2>
      <p>
        Os dados sao mantidos enquanto forem necessarios para a operacao da conta,
        cumprimento das finalidades informadas, seguranca, auditoria ou obrigacao
        legal. O usuario pode solicitar exclusao da conta e dos dados pessoais,
        ressalvadas retencoes exigidas ou permitidas por lei.
      </p>

      <h2>7. Direitos do titular</h2>
      <p>
        O usuario pode solicitar confirmacao de tratamento, acesso, correcao,
        anonimização, bloqueio, eliminacao, portabilidade, informacoes sobre
        compartilhamento e revogacao do consentimento, nos termos da LGPD.
      </p>

      <h2>8. Seguranca</h2>
      <p>
        Adotamos medidas tecnicas e administrativas razoaveis para proteger dados
        pessoais contra acesso nao autorizado, perda, uso indevido ou alteracao.
        Ainda assim, nenhum sistema digital e absolutamente imune a riscos.
      </p>

      <h2>9. Menores de idade</h2>
      <p>
        O MyCellar e destinado a maiores de 18 anos. A aplicacao nao deve ser
        utilizada por menores de idade.
      </p>

      <h2>10. Contato e exercicio de direitos</h2>
      <p>
        Solicitacoes sobre privacidade e protecao de dados podem ser enviadas
        para <a href={`mailto:${contactEmail}`}>{contactEmail}</a>.
      </p>
    </LegalShell>
  );
}
