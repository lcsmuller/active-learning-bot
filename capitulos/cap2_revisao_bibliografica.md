# **Capítulo 2 – Revisão Bibliográfica**

Este capítulo apresenta uma revisão da literatura sobre bots, seu uso em contextos educacionais e as tecnologias relacionadas ao seu desenvolvimento, estabelecendo as bases conceituais para este trabalho.

O Capítulo está organizado da seguinte forma: a Seção 2.1 apresenta a definição e componentes de bots, a Seção 2.2 discute as classificações de bots, a Seção 2.3 aborda os bots no contexto educacional, incluindo os desafios do ensino remoto (Subseção 2.3.1) e aspectos de interação humano-computador na educação (Subseção 2.3.2), a Seção 2.4 analisa bibliotecas e tecnologias para desenvolvimento de bots, a Seção 2.5 apresenta trabalhos relacionados, e finalmente, a Seção 2.6 delineia os objetivos específicos deste trabalho com base nos conceitos apresentados.

## 2.1 Definição e Componentes de Bots

Bots são programas automatizados projetados para interagir com usuários ou sistemas, realizando tarefas específicas com diferentes níveis de autonomia. Bots podem ser definidos como "aplicações que combinam uma interface conversacional com a capacidade de executar tarefas específicas para o usuário" [5], ou também "uma aplicação que realiza certas tarefas repetitivas de maneira mais rápida que o ser humano" [6].

A arquitetura de um bot pode ser descrita de diferentes maneiras na literatura, mas geralmente envolve um conjunto de componentes essenciais que trabalham juntos para processar a entrada do usuário, gerenciar o diaĺogo e gerar respostas apropriadas. Uma estrutura comum inclui como elementos principais (1) interface do usuário, (2) compreensão de linguagem natural, (3) gerenciador de diálogo, (4) integração com backend, e por fim (5) geração de linguagem natural [7]:

1. Interface do Usuário (User Interface - UI): Este é o ponto de contato entre o usuário e o bot. A UI é responsável por receber a entrada do usuário (texto, voz, cliques em elementos gráficos) e apresentar as respostas do bot de forma compreensível. Pode variar desde simples janelas de chat baseadas em texto até interfaces de voz sofisticadas ou GUIs interativas [7].

2. Compreensão de Linguagem Natural (Natural Language Understanding - NLU): Este componente é crucial para interpretar a entrada do usuário em linguagem natural. Ele analisa o texto ou a fala para identificar a intenção do usuário (o que o usuário quer fazer) e extrair informações relevantes, conhecidas como entidades (por exemplo, datas, locais, nomes). O NLU transforma a entrada não estruturada do usuário em dados estruturados que o bot pode processar [7].

3. Gerenciador de Diálogo (Dialogue Manager - DM): O DM mantém o estado do diálogo (o contexto da conversa), rastreia o histórico de interações e decide qual ação tomar a seguir com base na intenção identificada pelo NLU e nas regras de negócio ou na lógica conversacional definida. Isso pode envolver fazer perguntas de esclarecimento, acessar a base de conhecimento, chamar uma API externa ou gerar uma resposta. O DM pode ser implementado usando abordagens baseadas em regras ou modelos de aprendizado de máquina mais complexos [7].

4. Integração com Backend e Base de Conhecimento (Backend Integration & Knowledge Base): Para realizar tarefas úteis e fornecer informações precisas, os chatbots frequentemente precisam interagir com sistemas externos e acessar dados. A integração com o backend permite que o bot se conecte a APIs, bancos de dados, sistemas de CRM, ou outras fontes de informação e serviços. Essa base de conhecimento pode incluir conhecimento estático (pré-programado), conhecimento dinâmico (acessado em tempo real via APIs), conhecimento contextual (histórico do usuário) e até conhecimento colaborativo (gerado pelo usuário). É importante a integração com o backend para acessar essas informações e executar ações [7].

5. Geração de Linguagem Natural (Natural Language Generation - NLG): Uma vez que o Gerenciador de Diálogo decide a resposta a ser dada, o componente NLG a transforma em linguagem natural (texto ou fala) para ser apresentada ao usuário através da Interface do Usuário. A complexidade do NLG pode variar desde o uso de modelos de resposta pré-definidos até a geração dinâmica de sentenças complexas [7].

<!-- Inserir figura de 4. Architecture do X. Huang aqui -->

## 2.2 Classificações de Bots

Existem diversas formas de classificar bots, dependendo de suas características, funcionalidades e aplicações. Os bots podem ser classificados de acordo com seu propósito principal [8], ou de acordo com a sua funcionalidade primária [9].

No quesito de **propósito**, os bots podem ser classificados como [8]:
- **Bots generalistas**: Projetados para realizar uma ampla gama de tarefas, como responder perguntas gerais, fornecer informações e executar comandos simples.
- **Bots transacionais**: Projetados para realizar transações com sistemas externos.
- **Bots informacionais**: Focados em fornecer informações e responder perguntas dos usuários.
- **Bots de produtividade**: Focados em ajudar os usuários a realizar tarefas repetitivas.
- **Bots de colaboração**: Projetados para facilitar a colaboração entre usuários, como bots de chat em plataformas de comunicação.

Em termos de **funcionalidade**, os bots podem ser classificados como [9]:
- **Tarefas Administrativas**: Bots que ajudam na gestão de tarefas administrativas, como agendamento de reuniões, lembretes e organização de eventos.
- **Entretenimento**: Bots que jogam jogos.
- **Funcionalidade e Qualidade**: Bots que ajudam a melhorar a funcionalidade e qualidade de serviços, como bots de suporte técnico ou bots de feedback.
- **Comunidade**: Bots que ajudam a gerenciar comunidades, como bots de moderação em plataformas de redes sociais.
- **Arquivadores**: Bots que ajudam a organizar e arquivar informações, como bots de gerenciamento de documentos ou bots de busca.

Este trabalho concentra-se em bots do tipo "produtividade" e "colaboração" como propósito, e "funcionalidade e qualidade" como funcionalidade. O foco é a sua aplicação dentro do contexto educacional, onde eles podem atuar como assistentes virtuais que facilitam a interação entre alunos e professores, a fim de promover um ambiente remoto de aprendizagem mais dinâmico e interativo.

## 2.3 Bots no Contexto Educacional

Na educação, os bots têm sido utilizados para diversos propósitos, desde fornecer suporte administrativo até oferecer experiências de aprendizado personalizadas. Os bots educacionais podem transformar a experiência de aprendizagem ao oferecer suporte contínuo e personalizado que seria impraticável para um professor humano fornecer a todos os alunos simultaneamente [10].

Estudos recentes têm explorado aplicações educacionais específicas de bots. Por exemplo, o uso de chatbots para melhorar a retenção de conhecimento em estudantes universitários [11], e aumentar o engajamento em cursos online abertos e massivos (MOOCs) [12].

De uma maneira geral, bots educacionais são particularmente eficazes quando (1) fornecem feedback imediato aos alunos, (2) oferecem disponibilidade contínua para assistência, (3) personalizam a experiência de aprendizado, (4) reduzem a carga cognitiva dos instrutores e (5) permitem que os instrutores se concentrem em atividades pedagógicas e interativas [33].

A seguir, exploramos quatro dimensões importantes relacionadas ao uso de bots educacionais: os desafios específicos do ensino remoto que podem ser mitigados por essas ferramentas, os princípios de interação humano-computador relevantes para o design de bots educacionais eficazes, os princípios fundamentais para a interação mediada por bots na educação, e o papel dos dashboards como ferramentas de controle pedagógico.

### 2.3.1 Desafios do Ensino Remoto

O ensino remoto apresenta desafios únicos que podem ser parcialmente mitigados pelo uso de tecnologias interativas como bots. Hodges et al. [14] distinguem entre "ensino remoto emergencial" e educação online planejada, destacando que muitas instituições foram forçadas a adotar o primeiro modelo durante a pandemia de COVID-19, sem tempo adequado para planejamento.

Entre os principais desafios identificados estão [34]:

- Limitações tecnológicas e acesso desigual
- Competências digitais insuficientes de professores e alunos
- Falta de estrutura para avaliação eficaz
- Dificuldade em manter o engajamento dos alunos
- Ausência de interação social e senso de comunidade

Tecnologias como bots podem preencher algumas dessas lacunas ao proporcionar uma interface natural e contínua entre os participantes do processo educacional, oferecendo um canal adicional de comunicação e suporte tanto para alunos quanto para professores.

### 2.3.2 Interação Humano-Computador na Educação

Estudos em Interação Humano-Computador (IHC) destacam a importância de sistemas que se ajustem ao comportamento e às necessidades dos usuários [16]. Na educação, isso implica em promover interfaces que permitam participação ativa, acessibilidade e adaptabilidade aos estilos de aprendizagem dos alunos.

Norman [17] enfatiza o conceito de design centrado no usuário, onde a tecnologia deve se adaptar às necessidades humanas e não o contrário. Aplicado ao contexto educacional, este princípio sugere que os bots devem ser projetados considerando as necessidades pedagógicas específicas e as limitações cognitivas dos alunos.

Bots educacionais se encaixam nesse contexto por serem acessíveis e flexíveis na forma de interação. Interfaces conversacionais podem reduzir a carga cognitiva associada à navegação em sistemas educacionais complexos, permitindo que os alunos se concentrem no conteúdo do aprendizado em vez de na interface [18].

### 2.3.3 Princípios para Interação Mediada por Bots na Educação

Com base na literatura sobre bots educacionais e metodologias ativas, surgem três princípios fundamentais emergem como pilares para o design de interações eficazes mediadas por bots em ambientes educacionais:

1. **Comunicação multidirecional**: Um bot educacional eficaz não deve apenas transmitir informações do professor para os alunos, mas também facilitar o retorno dos alunos para o professor, criando um ciclo contínuo de feedback. Esse princípio alinha-se com a concepção de aprendizagem dialógica [19], onde o conhecimento é construído através da interação bidirecional entre educador e educando.

2. **Engajamento ativo**: Através de mecânicas interativas, o bot deve estimular constantemente a participação dos alunos, transformando-os de receptores passivos a agentes ativos no processo de aprendizagem. Este princípio está fundamentado nas teorias construtivistas de aprendizagem [20], que enfatizam a importância da experiência prática e da participação na construção do conhecimento.

3. **Adaptação contextual**: O sistema deve se ajustar ao ritmo da aula e às necessidades específicas da disciplina, oferecendo diferentes modos de interação conforme o momento pedagógico. Tecnologias educacionais eficazes devem ser flexíveis o suficiente para se adaptarem a diferentes contextos pedagógicos e estilos de aprendizagem [ref].

Estes princípios fornecem uma base teórica para o design de bots educacionais que efetivamente aprimoram o processo de aprendizagem, especialmente em contextos de metodologias ativas onde a participação e o engajamento dos alunos são essenciais.

### 2.3.4 Dashboards como Ferramenta de Controle Pedagógico

Um elemento crucial no design de bots educacionais é a interface de controle que permite aos educadores gerenciar o fluxo das interações. Os dashboards pedagógicos surgem como uma solução para esta necessidade, oferecendo uma visão consolidada das atividades e permitindo intervenções em tempo real sem interromper o fluxo da aula [22].

Dashboards de aprendizagem são "displays únicos que agregam diferentes indicadores sobre aprendiz, atividades de aprendizagem e/ou contexto de aprendizagem em uma ou múltiplas visualizações" [22]. No contexto de bots educacionais, estes dashboards evoluem para se tornarem não apenas ferramentas de visualização, mas interfaces de comando que permitem aos professores:

1. **Orquestrar atividades**: Iniciar e controlar sequências de aprendizagem sem necessidade de inserir comandos em chats públicos
2. **Monitorar em tempo real**: Visualizar métricas de engajamento e compreensão durante a aula
3. **Receber alertas**: Ser notificado sobre padrões que exijam intervenção pedagógica
4. **Personalizar interações**: Adaptar atividades com base nas necessidades observadas
5. **Analisar resultados**: Obter relatórios detalhados após as sessões

Esta abordagem separa claramente o canal de comando (dashboard, visível apenas para o professor) do canal de interação (plataforma de comunicação, visível para todos os participantes), seguindo o princípio de "separação de interesses" [ref] como essencial para ambientes de aprendizagem tecnologicamente mediados.

## 2.4 Ferramentas para Desenvolvimento de Bots no Discord

Existem várias ferramentas para desenvolver bots, dentre elas destacamos bibliotecas específicas para a plataforma do Discord, cada uma com suas particularidades e casos de uso apropriados, (1) JavaScript/Node.js, (2) Python e (3) C. 

1. **Discord.js**: Uma biblioteca JavaScript/Node.js que oferece abstração de alto nível para interação com a API do Discord. É rica em recursos e possui uma comunidade ativa, sendo adequada para desenvolvedores que preferem desenvolvimento rápido [24].

2. **Discord.py**: Equivalente ao Discord.js, mas para a linguagem Python. Oferece abstrações semelhantes e é amplamente utilizada para desenvolvimento de bots no Discord [25].

3. **Concord**: Uma biblioteca em C que fornece acesso de baixo nível à API do Discord, desenvolvida pelo autor deste trabalho. Diferentemente das opções anteriores, a Concord prioriza desempenho e controle direto sobre a API, sendo apropriada para aplicações que demandam eficiência computacional e controle granular [26].

No contexto deste estudo, foi escolhida a biblioteca Concord, por sua implementação na linguagem C, que oferece um equilíbrio entre abstração e controle que a torna adequada para uma ampla gama de aplicações [27]. No contexto educacional, C é frequentemente utilizada como linguagem de ensino em cursos de programação devido à sua sintaxe fundamental que expõe conceitos importantes de ciência da computação, como gerenciamento de memória e estruturas de dados básicas [27].

Para estudos futuros, é importante considerar o uso de linguagens de mais alto nível como Python, JavaScript ou Go, que podem oferecer desenvolvimento mais rápido e maior facilidade de manutenção, especialmente em projetos onde a curva de aprendizado reduzida seja prioritária em relação ao desempenho bruto. A linguagem de programação em contextos educacionais deve equilibrar considerações pedagógicas, praticidade de implementação e objetivos específicos do projeto [28].

## 2.5 Trabalhos Relacionados

Diversos pesquisadores têm explorado o uso de bots em contextos educacionais:

Hien et al. [29] desenvolveram um bot para suporte a alunos em um curso de programação, que respondia a dúvidas sobre conceitos e sintaxe. Os resultados mostraram uma redução no tempo de resposta para dúvidas comuns e um aumento na satisfação dos alunos com o suporte recebido.

Demetriadis et al. [30] implementaram um agente conversacional para auxiliar alunos em atividades colaborativas de resolução de problemas. O estudo demonstrou que grupos apoiados pelo bot apresentaram maior engajamento e melhores resultados de aprendizagem em comparação com grupos sem suporte automatizado.

Pesquita [31] utilizou bots no ensino de bioinformática para fornecer feedback imediato sobre exercícios práticos. A avaliação indicou que alunos que interagiram regularmente com o bot obtiveram notas significativamente mais altas nos exames finais.

Um trabalho particularmente relevante é o de Winkler e Söllner [32], que propõe diretrizes para o design de chatbots educacionais focados em metodologias ativas, destacando a importância de promover interações que estimulem o pensamento crítico e a reflexão.

## 2.6 Objetivos do Trabalho

Com base na revisão bibliográfica apresentada, este trabalho tem como objetivo desenvolver e avaliar um bot educacional assistivo e conversacional para plataformas de colaboração, especificamente o Discord, que facilite a implementação de metodologias ativas em ambientes de ensino remoto.

Os objetivos específicos incluem:

1. **Desenvolver um bot educacional** que incorpore os três princípios fundamentais para interação mediada discutidos na Seção 2.3.3: comunicação multidirecional, engajamento ativo e adaptação contextual.

2. **Implementar funcionalidades específicas** que abordem diretamente os desafios do ensino remoto identificados na literatura, com foco especial em manter o engajamento dos alunos, facilitar o feedback imediato e promover interações sociais significativas em ambientes virtuais.

3. **Proporcionar uma integração não-invasiva** da ferramenta ao fluxo de trabalho docente, aplicando os princípios de design centrado no usuário e minimizando a carga cognitiva adicional, conforme destacado nos estudos de IHC educacional.

4. **Criar uma prova de conceito funcional** utilizando tecnologias adequadas ao contexto educacional, considerando aspectos de eficiência, portabilidade e manutenção.

5. **Estabelecer uma metodologia de avaliação** para mensurar a eficácia da solução em contextos educacionais reais, combinando métricas quantitativas e qualitativas.

Tecnicamente, o desenvolvimento será realizado utilizando a biblioteca Concord em C (desenvolvida pelo autor), aproveitando suas vantagens em termos de controle granular sobre a API do Discord e sua relevância educacional, conforme discutido na Seção 2.4.

Este trabalho se diferencia dos esforços anteriores apresentados na Seção 2.5 por seu foco específico em facilitar metodologias ativas em ambientes remotos, com ênfase na integração não-invasiva à prática docente. Enquanto outros trabalhos têm explorado bots para responder dúvidas ou fornecer feedback automatizado, esta proposta busca transformar a própria dinâmica de interação durante as aulas síncronas.

Os próximos capítulos detalham a concepção e implementação do bot (Capítulo 3), bem como sua avaliação através de uma prova de conceito (Capítulo 4), demonstrando como os conceitos teóricos discutidos neste capítulo se manifestam na prática educacional.
