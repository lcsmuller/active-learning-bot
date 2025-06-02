# CI1055: Algoritmos e Estruturas de Dados I

**Prof. Dr. Marcos Castilho – Departamento de Informática/UFPR**  
**Data: 21 de outubro de 2021**

---

## Resumo

### Tema: Repetição de comandos

---

## Objetivos da aula

- Introduzir conceitos fundamentais de linguagens de programação
- Explicar:
  - O fluxo de execução de um programa
  - Comandos para manipulação de dados e interação com o usuário
  - Expressões aritméticas e lógicas
  - Comando de atribuição
  - Comandos que alteram o fluxo do programa
  - Tipos de erros comuns

---

## Comandos de repetição

- Permitem repetir trechos de código
- Em Pascal, há 3 comandos de repetição (somente 1 é visto neste material)
- Motivação através de um problema simples

---

## Exemplo: imprimir os números de 1 a 5

```pascal
program imprimir_de_1_a_5;
begin
  writeln(1);
  writeln(2);
  writeln(3);
  writeln(4);
  writeln(5);
end.
```

Comentário: solução não é generalizável

---

## Problema: imprimir os números de 1 até n

Objetivo: Ler um número `n` e imprimir de 1 até `n`

### Desafio

- `n` não é conhecido em tempo de codificação
- Precisamos de repetição controlada

---

## Comando `while` em Pascal

```pascal
while <expressão_booleana> do
  <comando>;
```

- Executa o comando enquanto a expressão booleana for verdadeira

---

## Exemplo simples

```pascal
program exemplo_repeticao;
var i: longint;
begin
  read(i);
  while i < 0 do
    read(i);
end.
```

Comentário: força o usuário a digitar um número >= 0

---

## Exemplo com mensagens

```pascal
program exemplo_repeticao_2;
var i: longint;
begin
  read(i);
  while i < 0 do
  begin
    writeln('numero negativo, digite outro');
    read(i);
  end;
  writeln('parabens! o numero ', i, ' nao eh negativo');
end.
```

---

## Solução para imprimir de 1 até n

### Primeira versão

```pascal
program imprimir_de_1_a_n;
var i, n: longint;
begin
  read(n);
  i := 1;
  while i <= n do
  begin
    writeln(i);
    i := i + 1;
  end;
end.
```

### Segunda versão

```pascal
i := 0;
while i < n do
begin
  i := i + 1;
  writeln(i);
end;
```

### Terceira versão (contando regressivamente)

```pascal
i := n;
while i > 0 do
begin
  writeln(n - i + 1);
  i := i - 1;
end;
```

---

## Observações

- Importância de entender como iniciar e terminar a repetição
- Identificar padrões repetitivos é fundamental
- Existem várias formas válidas de resolver o mesmo problema

---

## Exercício proposto

- Resolver os exercícios da seção **5.10.5** do livro online:
  [http://www.inf.ufpr.br/cursos/ci055/livro_alg1.pdf](http://www.inf.ufpr.br/cursos/ci055/livro_alg1.pdf)

---

## Licença

- Conteúdo licenciado sob **Creative Commons BY-NC-ND 2.5 Brasil**  
  [http://creativecommons.org/licenses/by-nc-nd/2.5/br](http://creativecommons.org/licenses/by-nc-nd/2.5/br)
