# Tasks

Run the computation function when adding, modifying, or removing Chegando and
Pedido entries. The computation function's parameter is the cod. produto

Function updates `produto.chegando`, `produto.containers`, `produto.sobrando`

"Filter" search entry followed by dropdown choice of Produto cod, nome, or
Cliente. Does a fuzzy search to match text entry.

pedido has these fields:
codigoProduto
qtdePedida
qtdeJaSeparada
codigoCliente
estado
  (Reserva, Desistencia, Container, Desistencia do Container,
  Faturado, Cancelado)
obs

# Interface

### Pedido

Operador digita:
1. Cod. produto (A)
2. Qtde. pedida (E)
3. Qtde. ja separada (F)
4. Cod. cliente (n/a)
5. Reserva, Desistencia, Container, Desistencia do Container, Faturado,
ou Cancelado (D)
6. Observaçoes (H)

Computador calcula:
7. Nome do produto (L)
8. Qtde. por caixa (n/a)
9. Sobrando (J)
10. Nome do cliente (B)
11. Nome do vendedor (C)
12. Ver se é possivel calcular Desistencia do Container automaticamente (n/a)
13. Data criada (I)
14. Data atualizada (n/a)


##### Pedido display

1. Cod. Prod (1)
2. Qtde desejada (2)
3. Nome cliente (10)
4. Nome vend. (11)
5. Resv. Desist (5)
6. Obs. (6)
7. Sobrando (9)
8. Data criada (13)

Mostrar em tooltip ou clicando num toggle link
(3) Qtde ja reservada
(4) Cod Cliente
(7) Nome prod.
(8) Qtde caixa
(14) Data atualiz.

### Clientes

1. Codigo
2. Nome
3. Vendedor

### Produtos

1. Codigo
2. Nome
3. Quantidade por caixa


### Chegando

1. Codigo Produto
2. Qtde. chegando
3. Container


# Temporary calculations

1. Wanted = Qtde. desejada - Qtde. ja reservada
2. Total wanted = sum of all wanted for a codigo
3. Sobrando = Total Chegando - Total wanted