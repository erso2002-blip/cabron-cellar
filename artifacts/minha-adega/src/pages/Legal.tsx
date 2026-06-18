import { useLocation } from "wouter";

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
  const [, setLocation] = useLocation();

  return (
    <main className="min-h-screen bg-background px-5 py-8 text-foreground">
      <article className="mx-auto max-w-3xl">
        <button
          className="mb-8 inline-flex text-sm text-muted-foreground hover:text-foreground"
          onClick={() => setLocation("/")}
          type="button"
        >
          Voltar ao MyCellar
        </button>

        <header className="mb-8 border-b pb-6">
          <p className="mb-2 text-sm uppercase text-muted-foreground">{eyebrow}</p>
          <h1 className="text-3xl font-semibold">{title}</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Última atualização: {updatedAt}
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
        Estes Termos de Uso regulam o acesso e a utilização do MyCellar, uma
        aplicação digital para organização pessoal de adega, cadastro de vinhos,
        acompanhamento de consumo e consulta de informações relacionadas aos
        rótulos cadastrados pelo usuário.
      </p>

      <h2>1. Aceite dos termos</h2>
      <p>
        Ao acessar ou utilizar o MyCellar, o usuário declara que leu, compreendeu
        e concorda com estes Termos de Uso e com a Política de Privacidade. Caso
        não concorde, não deve utilizar a aplicação.
      </p>

      <h2>2. Finalidade do serviço</h2>
      <p>
        O MyCellar tem finalidade informativa e organizacional. A aplicação ajuda
        o usuário a registrar vinhos, acompanhar sua adega, consultar histórico
        de consumo e receber sugestões de organização ou consumo com base nas
        informações cadastradas.
      </p>

      <h2>3. Cadastro e acesso</h2>
      <p>
        O acesso pode ocorrer por login Google ou por código enviado ao e-mail. O
        usuário é responsável por manter seu e-mail e seus meios de acesso
        seguros, bem como por todas as atividades realizadas em sua conta.
      </p>

      <h2>4. Responsabilidades do usuário</h2>
      <p>O usuário se compromete a:</p>
      <ul>
        <li>fornecer informações verdadeiras e atualizadas;</li>
        <li>usar o app apenas para fins lícitos e pessoais;</li>
        <li>não tentar acessar dados, contas ou sistemas de terceiros;</li>
        <li>não inserir conteúdo ofensivo, ilegal ou que viole direitos de terceiros;</li>
        <li>manter seus dispositivos e credenciais protegidos.</li>
      </ul>

      <h2>5. Informações sobre vinhos</h2>
      <p>
        Informações sobre vinhos, safras, consumo ideal, origem, harmonização ou
        características dos rótulos podem ter caráter estimativo, informativo ou
        ser derivadas de dados fornecidos pelo próprio usuário. O MyCellar não
        garante exatidão absoluta dessas informações.
      </p>

      <h2>6. Consumo responsável</h2>
      <p>
        O MyCellar não incentiva consumo excessivo de bebidas alcoólicas. O
        usuário deve observar a legislação aplicável, consumir com
        responsabilidade e não utilizar a aplicação caso seja menor de 18 anos.
      </p>

      <h2>7. Disponibilidade do serviço</h2>
      <p>
        Buscamos manter o app disponível e seguro, mas podem ocorrer manutenções,
        indisponibilidades, falhas de conexão, erros de terceiros ou interrupções
        fora do nosso controle.
      </p>

      <h2>8. Propriedade intelectual</h2>
      <p>
        A marca, identidade visual, layout, textos, códigos, banco de dados,
        funcionalidades e demais elementos do MyCellar pertencem aos seus
        titulares ou licenciadores. O usuário recebe apenas uma permissão limitada
        de uso da aplicação.
      </p>

      <h2>9. Limitação de responsabilidade</h2>
      <p>
        O MyCellar não se responsabiliza por perdas decorrentes de informações
        incorretas inseridas pelo usuário, decisões de compra, venda, consumo,
        avaliação comercial de vinhos, armazenamento inadequado, falhas de
        terceiros ou uso indevido da aplicação.
      </p>

      <h2>10. Alterações</h2>
      <p>
        Estes Termos podem ser atualizados para refletir melhorias do serviço,
        ajustes legais ou mudanças operacionais. Quando houver alteração
        relevante, poderemos informar o usuário pelos canais disponíveis.
      </p>

      <h2>11. Contato</h2>
      <p>
        Dúvidas sobre estes Termos podem ser enviadas para{" "}
        <a href={`mailto:${contactEmail}`}>{contactEmail}</a>.
      </p>
    </LegalShell>
  );
}

export function PrivacyPolicy() {
  return (
    <LegalShell eyebrow="Privacidade" title="Política de Privacidade e Consentimento">
      <p>
        Esta Política de Privacidade explica como o MyCellar coleta, usa,
        armazena e protege dados pessoais de usuários, em conformidade com a Lei
        Geral de Proteção de Dados Pessoais, Lei 13.709/2018.
      </p>

      <h2>1. Dados que podemos coletar</h2>
      <p>Podemos tratar os seguintes dados, conforme o uso da aplicação:</p>
      <ul>
        <li>nome, e-mail e identificadores de login;</li>
        <li>informações de conta Google, quando o login Google for utilizado;</li>
        <li>dados cadastrados pelo usuário sobre vinhos e adega;</li>
        <li>histórico de consumo registrado no app;</li>
        <li>imagens ou informações de rótulos enviadas para leitura ou cadastro;</li>
        <li>dados técnicos, como IP, dispositivo, navegador, logs e eventos de segurança.</li>
      </ul>

      <h2>2. Finalidades do tratamento</h2>
      <p>Os dados podem ser usados para:</p>
      <ul>
        <li>criar e autenticar a conta do usuário;</li>
        <li>permitir o cadastro, consulta e organização da adega;</li>
        <li>gerar histórico, estatísticas e sugestões dentro do app;</li>
        <li>melhorar estabilidade, segurança e experiência de uso;</li>
        <li>prevenir fraude, abuso, acesso indevido ou incidentes de segurança;</li>
        <li>cumprir obrigações legais ou regulatórias quando aplicável.</li>
      </ul>

      <h2>3. Bases legais</h2>
      <p>
        O tratamento pode ocorrer com base em execução de contrato, consentimento,
        legítimo interesse, cumprimento de obrigação legal e proteção contra
        fraude ou segurança da aplicação, conforme o caso.
      </p>

      <h2>4. Consentimento do usuário</h2>
      <p>
        Ao marcar o aceite e utilizar o MyCellar, o usuário consente com o
        tratamento dos dados necessários para funcionamento da aplicação,
        incluindo dados de login, dados cadastrados sobre a adega e registros
        técnicos de segurança. O consentimento pode ser revogado mediante
        solicitação, observadas as hipóteses legais que autorizem a conservação
        de determinados dados.
      </p>

      <h2>5. Compartilhamento de dados</h2>
      <p>
        Podemos compartilhar dados com provedores essenciais ao funcionamento do
        app, como hospedagem, autenticação, envio de e-mail, armazenamento,
        ferramentas de segurança e serviços de inteligência artificial quando
        usados para processar informações enviadas pelo usuário. Esses terceiros
        devem tratar os dados apenas conforme necessário para prestar o serviço.
      </p>

      <h2>6. Retenção e exclusão</h2>
      <p>
        Os dados são mantidos enquanto forem necessários para a operação da conta,
        cumprimento das finalidades informadas, segurança, auditoria ou obrigação
        legal. O usuário pode solicitar exclusão da conta e dos dados pessoais,
        ressalvadas retenções exigidas ou permitidas por lei.
      </p>

      <h2>7. Direitos do titular</h2>
      <p>
        O usuário pode solicitar confirmação de tratamento, acesso, correção,
        anonimização, bloqueio, eliminação, portabilidade, informações sobre
        compartilhamento e revogação do consentimento, nos termos da LGPD.
      </p>

      <h2>8. Segurança</h2>
      <p>
        Adotamos medidas técnicas e administrativas razoáveis para proteger dados
        pessoais contra acesso não autorizado, perda, uso indevido ou alteração.
        Ainda assim, nenhum sistema digital é absolutamente imune a riscos.
      </p>

      <h2>9. Menores de idade</h2>
      <p>
        O MyCellar é destinado a maiores de 18 anos. A aplicação não deve ser
        utilizada por menores de idade.
      </p>

      <h2>10. Contato e exercício de direitos</h2>
      <p>
        Solicitações sobre privacidade e proteção de dados podem ser enviadas
        para <a href={`mailto:${contactEmail}`}>{contactEmail}</a>.
      </p>
    </LegalShell>
  );
}
