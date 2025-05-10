# **Capítulo 2 – Revisão Bibliográfica**

Este capítulo apresenta uma revisão da literatura sobre bots, seu uso em contextos educacionais e as tecnologias relacionadas ao seu desenvolvimento, estabelecendo as bases conceituais para este trabalho.

## 2.1 Definição e Componentes de Bots

Bots são programas automatizados projetados para interagir com usuários ou sistemas, realizando tarefas específicas com diferentes níveis de autonomia. Segundo Shevat [1], bots podem ser definidos como "aplicações que combinam uma interface conversacional com a capacidade de executar tarefas específicas para o usuário". Já Følstad e Brandtzæg [2] definem bots como "agentes de software que interagem com os usuários através de uma interface conversacional, seja por meio de texto ou voz".

Em sua estrutura básica, os bots são compostos pelos seguintes componentes:

- **Interface de comunicação**: Meios pelos quais o bot recebe e envia mensagens aos usuários, podendo ser interfaces baseadas em texto (chats), voz (assistentes virtuais), ou elementos gráficos interativos
  
- **Motor de processamento**: Sistema que interpreta as entradas dos usuários e determina respostas apropriadas, podendo variar desde simples sistemas baseados em regras até complexos algoritmos de processamento de linguagem natural

- **Base de conhecimento**: Informações que o bot pode acessar para fornecer respostas, que pode incluir dados estáticos pré-programados ou conhecimento dinâmico obtido através de APIs ou bancos de dados

- **Sistema de regras**: Lógica que define o comportamento do bot em diferentes contextos e determina como ele responde a diferentes tipos de interações

- **Mecanismos de aprendizado**: (opcional) Componentes que permitem que o bot aprimore seu desempenho ao longo do tempo com base em interações anteriores, frequentemente implementados através de técnicas de aprendizado de máquina

## 2.2 Classificações de Bots

Existem diversas formas de classificar bots, dependendo de suas características, funcionalidades e aplicações. De acordo com Adamopoulou e Moussiades [3], os bots podem ser classificados de acordo com:

1. **Nível de complexidade**:
   - **Bots simples**: Baseados em regras e comandos específicos
   - **Bots inteligentes**: Utilizam inteligência artificial e processamento de linguagem natural
   - **Bots cognitivos**: Capazes de aprender e se adaptar a partir das interações

2. **Propósito principal**:
   - **Bots informacionais**: Fornecem informações e respondem consultas
   - **Bots transacionais**: Realizam operações e transações para os usuários
   - **Bots assistivos**: Ajudam na execução de tarefas específicas
   - **Bots conversacionais**: Simulam conversas humanas (chatbots)

3. **Ambiente de operação**:
   - **Bots de mídia social**: Operam em plataformas como Twitter, Facebook
   - **Bots de mensageria**: Funcionam em aplicativos de mensagens como WhatsApp, Telegram
   - **Bots de websites**: Integrados a sites específicos
   - **Bots de plataformas de colaboração**: Como Slack, Microsoft Teams ou Discord

Este trabalho concentra-se especificamente em bots assistivos e conversacionais que operam em plataformas de colaboração, com foco na aplicação educacional.

## 2.3 Bots no Contexto Educacional

Na educação, os bots têm sido utilizados para diversos propósitos, desde fornecer suporte administrativo até oferecer experiências de aprendizado personalizadas. Wollny et al. [4] destacam que os bots educacionais podem transformar a experiência de aprendizagem ao oferecer suporte contínuo e personalizado que seria impraticável para um professor humano fornecer a todos os alunos simultaneamente.

Estudos recentes têm explorado aplicações educacionais específicas de bots. Por exemplo, Hobert [5] investigou o uso de chatbots para melhorar a retenção de conhecimento em estudantes universitários, enquanto Pereira [6] examinou como os bots podem facilitar o engajamento em cursos online abertos e massivos (MOOCs).

Smutny e Schreiberova [7] identificaram que bots educacionais são particularmente eficazes quando:

- Fornecem feedback imediato aos alunos
- Oferecem disponibilidade contínua para assistência
- Personalizam a experiência de aprendizado
- Reduzem a carga cognitiva dos instrutores
- Facilitam a colaboração entre os alunos

## 2.4 Desafios do Ensino Remoto

O ensino remoto apresenta desafios únicos que podem ser parcialmente mitigados pelo uso de tecnologias interativas como bots. Hodges et al. [8] distinguem entre "ensino remoto emergencial" e educação online planejada, destacando que muitas instituições foram forçadas a adotar o primeiro modelo durante a pandemia de COVID-19, sem tempo adequado para planejamento.

Entre os principais desafios identificados por Ferri et al. [9] estão:

- Limitações tecnológicas e acesso desigual
- Competências digitais insuficientes de professores e alunos
- Falta de estrutura para avaliação eficaz
- Dificuldade em manter o engajamento dos alunos
- Ausência de interação social e senso de comunidade

Tecnologias como bots podem preencher algumas dessas lacunas ao proporcionar uma interface natural e contínua entre os participantes do processo educacional, oferecendo um canal adicional de comunicação e suporte tanto para alunos quanto para professores.

## 2.5 Interação Humano-Computador na Educação

Estudos em Interação Humano-Computador (IHC) destacam a importância de sistemas que se ajustem ao comportamento e às necessidades dos usuários [10]. Na educação, isso implica em promover interfaces que permitam participação ativa, acessibilidade e adaptabilidade aos estilos de aprendizagem dos alunos.

Norman [11] enfatiza o conceito de design centrado no usuário, onde a tecnologia deve se adaptar às necessidades humanas e não o contrário. Aplicado ao contexto educacional, este princípio sugere que os bots devem ser projetados considerando as necessidades pedagógicas específicas e as limitações cognitivas dos alunos.

Bots educacionais se encaixam nesse contexto por serem acessíveis e flexíveis na forma de interação. De acordo com Kerly et al. [12], interfaces conversacionais podem reduzir a carga cognitiva associada à navegação em sistemas educacionais complexos, permitindo que os alunos se concentrem no conteúdo do aprendizado em vez de na interface.

## 2.6 Bibliotecas e Tecnologias para Desenvolvimento de Bots

O desenvolvimento de bots é facilitado por diversas bibliotecas e frameworks, cada um com suas particularidades e casos de uso apropriados. As principais tecnologias disponíveis podem ser categorizadas por plataforma alvo e linguagem de programação:

### 2.6.1 Bibliotecas para Plataformas Específicas

Para plataformas como o Discord, que é utilizado neste trabalho, existem bibliotecas dedicadas:

- **Discord.js**: Uma biblioteca JavaScript/Node.js que oferece abstração de alto nível para interação com a API do Discord. É rica em recursos e possui uma comunidade ativa, sendo adequada para desenvolvedores que preferem desenvolvimento rápido [13].

- **Discord.py**: Equivalente ao Discord.js, mas para a linguagem Python. Oferece abstrações semelhantes e é amplamente utilizada para desenvolvimento de bots no Discord [14].

- **Concord**: Uma biblioteca em C99 que fornece acesso de baixo nível à API do Discord. Diferentemente das opções anteriores, a Concord prioriza desempenho e controle direto sobre a API, sendo apropriada para aplicações que demandam eficiência computacional e controle granular [15].

  A linguagem C, particularmente o padrão C99, apresenta vantagens significativas em contextos onde eficiência, controle de recursos e portabilidade são cruciais. Segundo Kernighan e Ritchie [16], a linguagem C oferece um equilíbrio entre abstração e controle que a torna adequada para uma ampla gama de aplicações. No contexto educacional, C é frequentemente utilizada como linguagem de ensino em cursos de programação devido à sua sintaxe fundamental que expõe conceitos importantes de ciência da computação, como gerenciamento de memória e estruturas de dados básicas (Kölling e Rosenberg [17]).
  
  A portabilidade da linguagem C permite que aplicações desenvolvidas nela funcionem em diversos sistemas operacionais e arquiteturas de hardware com modificações mínimas, característica particularmente relevante para ambientes educacionais heterogêneos. Além disso, o modelo de event loop assíncrono, um padrão de programação onde eventos são processados sequencialmente por um loop central, é implementado de forma eficiente em C, permitindo que aplicações como bots respondam a múltiplas interações concorrentes sem a necessidade de threads adicionais.
  
  Para estudos futuros, é importante considerar o uso de linguagens de mais alto nível como Python, JavaScript ou Go, que podem oferecer desenvolvimento mais rápido e maior facilidade de manutenção, especialmente em projetos onde a curva de aprendizado reduzida seja prioritária em relação ao desempenho bruto. Como observado por Pears et al. [18], a escolha da linguagem de programação em contextos educacionais deve equilibrar considerações pedagógicas, praticidade de implementação e objetivos específicos do projeto.

### 2.6.2 Frameworks Multiplataforma

Existem também frameworks que permitem desenvolvimento para múltiplas plataformas:

- **Microsoft Bot Framework**: Uma plataforma abrangente que permite criar bots que funcionam em várias plataformas como Teams, Slack, Facebook Messenger e sites web. Oferece recursos avançados como integração com serviços cognitivos da Microsoft [19].

- **Botkit**: Um framework Node.js que facilita o desenvolvimento de bots para várias plataformas, incluindo Slack, Facebook Messenger e Twilio [20].

- **Rasa**: Uma plataforma open-source para desenvolvimento de assistentes contextuais baseados em IA, com ênfase em processamento de linguagem natural avançado [21].

A escolha da biblioteca ou framework adequado depende de diversos fatores, incluindo a plataforma alvo, requisitos de desempenho, familiaridade com a linguagem de programação e nível de controle desejado sobre a implementação.

## 2.7 Trabalhos Relacionados

Diversos pesquisadores têm explorado o uso de bots em contextos educacionais, com resultados que fundamentam o presente trabalho:

Hien et al. [22] desenvolveram um bot para suporte a alunos em um curso de programação, que respondia a dúvidas sobre conceitos e sintaxe. Os resultados mostraram uma redução no tempo de resposta para dúvidas comuns e um aumento na satisfação dos alunos com o suporte recebido.

Demetriadis et al. [23] implementaram um agente conversacional para auxiliar alunos em atividades colaborativas de resolução de problemas. O estudo demonstrou que grupos apoiados pelo bot apresentaram maior engajamento e melhores resultados de aprendizagem em comparação com grupos sem suporte automatizado.

Cátia Pesquita [24] utilizou bots no ensino de bioinformática para fornecer feedback imediato sobre exercícios práticos. A avaliação indicou que alunos que interagiram regularmente com o bot obtiveram notas significativamente mais altas nos exames finais.

Um trabalho particularmente relevante é o de Winkler e Söllner [25], que propõe diretrizes para o design de chatbots educacionais focados em metodologias ativas, destacando a importância de promover interações que estimulem o pensamento crítico e a reflexão.

Diferentemente dos trabalhos citados, esta pesquisa foca especificamente no uso de bots para promover interações naturais que facilitam a implementação de metodologias ativas em ambientes virtuais, com ênfase na integração não-invasiva à prática docente existente.
