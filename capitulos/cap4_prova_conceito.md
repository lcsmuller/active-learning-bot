# **Capítulo 4 – Prova de Conceito: Bot para Interação Educacional**

Este capítulo apresenta a prova de conceito do bot educacional desenvolvido para este trabalho, detalhando sua implementação técnica e a metodologia de avaliação proposta para futuros experimentos.

## 4.1 Contexto da Interação Professor-Aluno em Ambientes Remotos

Antes de detalhar os aspectos técnicos da implementação, é importante contextualizar como ocorre a interação entre professor e alunos em um ambiente de ensino remoto, particularmente quando se busca aplicar metodologias ativas.

Em aulas remotas tradicionais, observa-se frequentemente um padrão de comunicação unidirecional, onde o professor transmite o conteúdo enquanto os alunos assumem postura predominantemente passiva. As interações tendem a ser limitadas a momentos específicos, como sessões de perguntas ao final da aula, ou através de canais assíncronos como e-mails e fóruns. Este modelo apresenta barreiras significativas à implementação de metodologias ativas, que dependem de ciclos rápidos de feedback e participação constante dos estudantes.

O bot proposto busca transformar este paradigma ao introduzir um mediador digital que facilita:

1. **Trocas síncronas durante a exposição de conteúdo**: Permitindo reações e dúvidas sem interromper o fluxo da aula
2. **Anonimato seletivo para alunos**: Reduzindo a inibição de participação
3. **Coleta sistemática de dados de interação**: Possibilitando ajustes em tempo real na condução da aula
4. **Automação de tarefas repetitivas**: Liberando o professor para focar em aspectos pedagógicos mais relevantes

Estas características são fundamentais para aproximar o ambiente virtual das dinâmicas interativas observadas em salas de aula presenciais onde metodologias ativas são aplicadas com sucesso.

## 4.2 Implementação Técnica

O bot foi desenvolvido utilizando a biblioteca Concord em C99 (desenvolvida pelo autor deste trabalho), aproveitando seu modelo de event loop assíncrono para processar múltiplas interações simultaneamente. A implementação seguiu uma arquitetura modular:

- **Módulo de Publicação**: Processa comandos do professor para compartilhar conteúdo formatado
- **Módulo de Interação**: Gerencia as reações e comandos dos alunos
- **Módulo de Análise**: Coleta e organiza as interações para gerar relatórios
- **Módulo de Persistência**: Armazena dados para análise posterior (opcional)

A integração com o Discord foi realizada através das APIs fornecidas pela Concord, utilizando sistemas de geração de código (como o gencodecs, também desenvolvido pelo autor) para facilitar o processamento de dados em formato JSON.

## 4.3 Funcionalidades Implementadas

O bot oferece as seguintes funcionalidades principais:

1. **Publicação de conteúdo estruturado**: Professores podem compartilhar trechos de código, conceitos ou questões de forma formatada
   - Exemplo: `!publicar codigo "for (int i = 0; i < n; i++) { soma += i; }"`

2. **Mecanismos de feedback rápido**: Alunos podem reagir ao conteúdo com opções como "Entendi", "Tenho dúvida" ou "Executar exemplo"

3. **Coleta anônima de dúvidas**: Alunos podem enviar dúvidas de forma privada, reduzindo a inibição

4. **Geração de relatórios**: Professores recebem resumos das interações ao final da aula

5. **Adaptação em tempo real**: O sistema informa ao professor as áreas que geraram mais dúvidas

## 4.4 Metodologia de Avaliação

A metodologia de avaliação para o bot educacional consiste em:

### 4.4.1 Ambiente e Participantes

O teste envolve:
- Professores de disciplinas de graduação na área de computação
- Alunos de graduação
- Sessões de aula remotas

### 4.4.2 Coleta de Dados

Os dados são coletados através de três mecanismos principais:

1. **Questionários**: Aplicados a professores e alunos para medir percepções sobre o uso do bot
   
2. **Registros automáticos (logs)**: Dados quantitativos sobre frequência e tipos de interações realizadas

3. **Entrevistas**: Conduzidas com participantes para obter insights qualitativos

### 4.4.3 Métricas de Avaliação

As seguintes métricas são utilizadas para avaliar a eficácia da solução:

| Categoria | Métricas |
|-----------|----------|
| **Engajamento** | Número de interações por aluno, distribuição temporal das interações, diversidade de tipos de interação |
| **Impacto pedagógico** | Mudanças na condução da aula, percepção de compreensão do conteúdo, tempo dedicado a esclarecimentos |
| **Usabilidade** | Facilidade de uso, problemas técnicos, curva de aprendizado |
| **Metodologias ativas** | Viabilidade de implementação, comparação com experiências presenciais |

## 4.5 Resultados Ilustrativos

### 4.5.1 Dados Quantitativos

WIP

<!---
| Métrica | Intervalo |
|---------|-----------|
| Interação dos alunos com o conteúdo | 70-90% |
| Identificação de dificuldades em tempo real | 75-85% |
| Ajustes na aula com base no feedback | 65-80% |
| Percepção de utilidade sem invasividade | 80-95% |
| Conforto para expressar dúvidas | 75-90% |

-->

### 4.5.2 Análise Qualitativa

WIP

<!---

Aspectos a serem analisados incluem:

- Facilidade dos alunos em expressar dúvidas através do bot
- Percepção dos professores sobre a identificação de tópicos problemáticos
- Curva de aprendizado da ferramenta
- Natureza não invasiva da ferramenta como fator de adoção

-->

## 4.6 Limitações e Considerações Metodológicas

WIP

<!---

A metodologia proposta apresenta algumas limitações que devem ser consideradas:

1. **Amostra limitada**: O número de participantes e disciplinas pode não representar adequadamente todos os contextos educacionais

2. **Efeito novidade**: O interesse inicial pela tecnologia pode influenciar positivamente os resultados de curto prazo

3. **Viés de seleção**: Professores que se voluntariam para o teste podem ter predisposição mais favorável a inovações tecnológicas

4. **Contexto disciplinar**: A aplicação inicial em disciplinas de computação pode não refletir desafios de áreas com diferentes perfis de interação

Estas limitações serão consideradas na análise dos resultados e poderão orientar pesquisas futuras mais abrangentes.

-->
