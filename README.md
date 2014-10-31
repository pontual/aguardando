# Aguardando



# Models

```
tinacg
|
+- banana_store
   |
   +- clientes
   |  |
   |  +- "2180"
   |  |  |
   |  |  +- name: "Redd"
   |  |
   |  +- "2742"
   |     |
   |     +- name: "XBZ"
   |
   +- produtos
   |  |
   |  +- "137350B"
   |  |  |
   |  |  +- name: "Chaveiro de metal"
   |  |
   |  +- "143036"
   |     |
   |     +- name: "Kit churrasco c/ 4 pcs"
   |
   +- chegando
   |  |
   |  +- ---firebase-timestamp
   |     |
   |     +- codigo: "143036"
   |     +- quantidade: 10000  (INTEGER)
   |     +- container: "S/N"
   |  
   +- lineItems
      |
      +- --- firebase-timestamp
         |
         +- timeCreated: SEE DOCS Firebase.ServerValue.TIMESTAMP
         +- timeModified: SEE DOCS
         +- status: one of "1: Reserva", "2: Desistencia", "3: Container",
         |    "4: Desistencia do container", "5: Faturado", or "6: Cancelado"
         |    Numbers are added for sorting.
         |    "1: Reserva" are the line items from which to request
         +- codigo: "143036"
         +- cliente: "2180"
         +- vendedor: "Celia"
         +- quantidade: 200  (total, INTEGER)
         +- jaReservado: 20  (INTEGER)
         +- observacoes: "Com Joao"
```         

# Views

LineItems (main)
Clientes
Produtos
Chegando

# Tasks

copy the structure of TiNAtasks, and apply the following changes

* replace table trs with divs, as in the [second answer here](http://stackoverflow.com/questions/4035966/create-a-html-table-where-each-tr-is-a-form)

* edits don't automatically save to firebase, see chat example in angularjs/angularfire/chat: `input ng-change="messages.$save(message)"`

* make each row edit its own form, toggle show/hide

* $add, update has `.then()` callbacks, use them to modify a status message indicating success "Successfully updated / added ..."

* css style changes based on line item status

Undo one level?

if Desistencia, then do not subtract from container totals (Chegando)

Does callback to child_modified provide previous values?

Count total number of line items per container, to verify against physical
paper copies

nesting line items as children of pedidos complicates aggregating data, beyond
my experience level right now

find a way to store container number, when changing status to Reserva (add
callback to child_modified?)

Editing a line item should change totals

autocomplete when entering codigo and clientes name. Entering a number also
fills in the string, and entering a string fills in the number

clicking on an edit button, icon, or link opens a modal with edit form (and x)
"On submit" it becomes gray and callback closes it

aggregate by cliente, produto, vendedor, container

checkbox to decide if "inactive" line items are included in aggregate lists,
simply use a ng-show on each element

how to handle multiple chegandos on same item? could tally by codigo and
concatenate the multiple containers into a string

line item's container label should be auto-computed

for testing, create child from firebaseRef based on user id.
the test branch is a sibling of banana_store

LineItems table should be sortable by column heading, like tablesorter.
Double-clicking reverses sort

Setup user profiles page where user's group is assigned manually by a
superuser, then use this group information like
"$group_id": "$group_id == $user_group_id"

count chegando totals summing by codigo, but note which container is assigned
to a pedido based on order, and based by quantity. For example, if 5000 arrives
in 1440, then 2000 in 1441, and there is a first pedido of 4000, it gets
assigned to 1440, but the next pedido would be assigned 1440 AND 1441. To keep
things simple I might just concatenate all container numbers and display that.
However, once the container amount is exhausted, later pedidos must become
"aguardando desistencia do container"

make login tokens last years

# Security rules

```
{
    "rules": {
        ".read": "auth != null && auth.provider == 'password'",
        ".write": "auth != null && auth.provider == 'password'"
    }
}
```