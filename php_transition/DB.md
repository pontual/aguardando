PONTUAL VENDAS
--------------

Manage orders, backorders, products, clients, and salespeople

REQUIREMENTS
------------
An existing database named pontualimportb (define in db/connect_live.php)

A global superuser password defined as $SU_PASSWORD (define in db/connect_live.php)

TASKS
-----

ADD USERS
---------

Check if username already exists for given group

sanitize inputs both in browser and in PHP

Start by building user logins and access levels (admin vs. unprivileged users)
* Lookup cookies or session information

Fetching information works if user is validated

Single page, updates send Ajax requests, API calls return JSON

Add pedido through modal, additional modals created to add cliente and produto

Copy produto data from pontualimportb1 database

users belong to usergroups

the group 'supergroup' is special, and the user 'superuser' in this group can
do anything

superusers within a group are allowed to add, edit, and delete anything in the
group

Require login to view, and require admin privileges to add and edit anything

Show thumbnail when hovering on photo icon (originally "Foto" text link)

display a table for produtos
codigo	disponiveis	 chegam total	lista de containers chegando  pedidos total

pedidos fall into categories Reserva (so that I know who to demand (cobrar)),
Aguardar desistencia, Aguardar container, Faturado, and Cancelado in this order

sort by category type (ativo/arquivado) value first, then by type, then by date

desistencias do not count against disponiveis

Desistencias, when existing reservas is not enough, automatically reduce
Container amount and gets marked as Aguardar Desistencia e Container

Links or buttons to sort by codigo as texto, container number, cliente

When selecting pedidos, pass a filtering function that returns True when a
pedido matches the criteria as an alternative to Django select conventions

button "Consultado?", when clicked, updates a last modified datetime field


MODELS
------

compare with https://github.com/pontual/django-apps/blob/master/pedidos/models.py

Usergroup
* id (PK)
* name (unique)

User == Vendedor
* id (PK)
* usergroup_id (FK)
* superuser (status int, 1 or 0)
* name
* email
* password_hash
* time_created
* creator_id
unique (usergroup_id, name)

Produto
* id (PK)
* usergroup_id (FK)
* codigo (varchar)
* descricao
* time_created
* creator_id (FK)
unique (usergroup_id, codigo)
FK (usergroup_id)

Cliente
* id (PK)
* usergroup_id (FK)
* codigo (int)
* nome
* user_id (FK to vendedor)
* time_created (datetime)
* creator_id (FK to User)
unique (usergroup_id, codigo)
FK (usergroup_id, user_id, creator_id)

Pedido
* data_pedido (as written on pedido)
* cliente_id (FK)
* observacoes
* time_created
* time_updated (also modified when Line items are created, deleted or updated)
* creator_id (FK)

LineItem
* pedido_id (FK)
* produto_id (FK)
* quantidade
* ja_separado
* time_created
* creator_id (FK)

Chegando
* usergroup_id (FK)
* produto_id (FK)
* quantidade
* container (varchar because of S/N)
* time_created
* creator_id (FK)

