(function() {
  var app = angular.module('aguardando', ['components', 'firebase', 'ui.bootstrap', 'angularPikaday']);
  var ref = new Firebase("https://aguardando.firebaseio.com/aguardando");

  function formSetEditable(formId, state) {
    var form = document.getElementById(formId);
    var elements = form.elements;
    for (var i = 0, len = elements.length; i < len; i++) {
      elements[i].disabled = !state;
    }
  }
  
  app.controller("OrganizationController", ['$scope', '$firebase', '$modal', function($scope, $firebase, $modal) {
    function init(authData) {
      $scope.loginStatus = "Login válido até " + (new Date(authData.expires * 1000));
      $scope.loggedIn = true;
      $scope.operatorEmail = authData.password.email;

      $scope.notification = " ";

      $scope.alertarResultado = function(message) {
        $scope.alterarSenhaResultado = message;
        $scope.$apply();
      };
      
      $scope.DEBUG = true;
      $scope.isAdmin = false;

      // CHECK ADMIN STATUS
      var administradoresRef = ref.child("administradores");
      $scope.administradoresSync = $firebase(administradoresRef);
      $scope.administradores = $scope.administradoresSync.$asObject();

      $scope.administradores.$loaded().then(function() {
        if ($scope.administradores[authData.uid] === 1) {
          $scope.isAdmin = true
        }
      });
      
      // CALCULACOES
      var computedRef = ref.child("computed");
      $scope.computedSync = $firebase(computedRef);
      $scope.computed = $scope.computedSync.$asObject();

      // END CALCULACOES
      
      
      // CLIENTES
      var clientesRef = ref.child("clientes");
      $scope.clientesSync = $firebase(clientesRef);
      $scope.clientesObj = $scope.clientesSync.$asObject();
      $scope.clientes = $scope.clientesSync.$asArray();
      $scope.clienteOrder = "nome";

      $scope.items = ['item1', 'item2'];

      $scope.setCliente = function(codigo, nome, vendedor) {
        if (vendedor === undefined) {
          vendedor = "";
        }
        $scope.clientesSync.$set(codigo, { codigo: parseInt(codigo), nome: nome, idVendedor: vendedor }).then(function() { $scope.$broadcast("newClienteAdded"); });
      };

      $scope.editClienteOpen = function(cliente) {
        var modalInstance = $modal.open({
          templateUrl: 'myClienteModalContent.html',
          controller: 'EditClienteModalCtrl',
          size: 'lg',
          resolve: {
            items: function() {
              return $scope.items;
            },
            codigo: function() {
              return cliente.codigo;
            },
            clienteNome: function() {
              return cliente.nome;
            },
            idVendedor: function() {
              return cliente.idVendedor || 'pontual';
            },
            vendedores: function() {
              return $scope.vendedores;
            },
          }
        });

        modalInstance.result.then(function(selected) {
          $scope.setCliente(cliente.codigo, selected.nome, selected.idVendedor);
        }, function() {
          // do nothing
        });
      };  // END CLIENTES
      
      

      // PRODUTOS
      var produtosRef = ref.child("produtos");
      $scope.produtosSync = $firebase(produtosRef);
      $scope.produtosObj = $scope.produtosSync.$asObject();
      $scope.produtos = $scope.produtosSync.$asArray();
      $scope.produtoOrder = "codigo";

      $scope.setProduto = function(codigo, nome, qtdePorCaixa, sobrando, chegando, containers) {
        nome = nome || "";
        qtdePorCaixa = qtdePorCaixa || 0;
        sobrando = sobrando || 0;
        chegando = chegando || 0;
        containers = containers || '';
        
        $scope.produtosSync.$set(codigo.toUpperCase(),
                                 { codigo: codigo.toUpperCase(),
                                   nome: nome,
                                   qtdePorCaixa: parseInt(qtdePorCaixa),
                                   sobrando: sobrando,
                                   chegando: parseInt(chegando),
                                   containers: containers,
                                 })                      
          .then(function() { $scope.computeSobrandoChegando(codigo.toUpperCase()); })
          .then(function() { $scope.$broadcast("newProdutoAdded"); })
          .then(function() { $scope.notification = "Assinalado " + codigo + " " + nome; });
      };

      $scope.updateProduto = function(codigo, nome, qtdePorCaixa, sobrando, chegando, containers) {
        nome = nome || "";
        qtdePorCaixa = qtdePorCaixa || 0;
        sobrando = sobrando || 0;
        chegando = chegando || "";
        containers = containers || '';
        
        $scope.produtosSync.$set(codigo.toUpperCase(),
                                 { codigo: codigo.toUpperCase(),
                                   nome: nome,
                                   qtdePorCaixa: parseInt(qtdePorCaixa),
                                   sobrando: sobrando,
                                   chegando: chegando,
                                   containers: containers,
                                 })                      
          .then(function() { $scope.$broadcast("newProdutoAdded"); })
          .then(function() { $scope.notification = "Updated produto " + codigo;
                             console.log("updated produto " + codigo); });
      };

      $scope.editProdutoOpen = function(produto) {
        var modalInstance = $modal.open({
          templateUrl: 'myProdutoModalContent.html',
          controller: 'EditProdutoModalCtrl',
          size: 'lg',
          resolve: {
            items: function() {
              return $scope.items;
            },
            codigo: function() {
              return produto.codigo;
            },
            produtoNome: function() {
              return produto.nome;
            },
            produtoQtdePorCaixa: function() {
              return produto.qtdePorCaixa;
            },
          }
        });

        modalInstance.result.then(function(selected) {
          $scope.setProduto(produto.codigo, selected.nome, selected.qtdePorCaixa);
        }, function() {
          // do nothing
        });
      };  // END PRODUTOS
      

      // PEDIDOS
      var pedidosRef = ref.child("pedidos");
      $scope.pedidosSync = $firebase(pedidosRef);
      $scope.pedidos = $scope.pedidosSync.$asArray();

      // for time range
      // new Firebase(".../pedidos")
      //  .startAt(startTime)
      //  .endAt(endTime)

      $scope.showFiltro = false;

      $scope.showAddPedido = false;

      $scope.pedidoEstadoOrder = function(pedido) {
        switch (pedido.estado) {
        case 'Reserva': return "7";
        case 'Desistencia': return "2";
        case 'Desistencia do Container': return "3";
        case 'Container': return "4" + $scope.produtosObj[pedido.codigoProduto].containers;
        case 'Faturado': return "5";
        case 'Cancelado': return "6";
        default: return "0";
        }
      };

      $scope.pedidoClienteOrder = function(pedido) {
        return $scope.clientesObj[pedido.codigoCliente].nome;
      };

      $scope.pedidoVendedorOrder = function(pedido) {
        return $scope.vendedoresObj[$scope.clientesObj[pedido.codigoCliente].idVendedor].nome;
      };

      $scope.pedidoTableOrder = ['codigoProduto', $scope.pedidoEstadoOrder, 'dataCriadaNum'];

      $scope.pedidoClass = function(estado) {
        switch (estado[0]) {
        case "7": return 'reservaStyle';
        case "2": return 'desistenciaStyle';
        case "3": return 'desistenciaDoContainerStyle';
        case "4": return 'containerStyle';
        case "5": return 'faturadoStyle';
        case "6": return 'canceladoStyle';
        default: return '';
        }
      };

      $scope.pedidoEstadoOpcoes = [
        'Desistencia',
        'Reserva',
        'Container',
        'Desistencia do Container',
        'Faturado',
        'Cancelado',
      ];

      $scope.pedidoViewFiltroProduto = "";
      $scope.pedidoViewFiltroCliente = "";
      $scope.pedidoViewFiltroContainer = "";

      $scope.pedidoFiltroProduto = "";
      $scope.pedidoFiltroCliente = "";
      $scope.pedidoFiltroContainer = "";

      $scope.firstInParens = function(s) {
        var r=/\((.*?)\)/g, a=[], m;
        while (m = r.exec(s)) {
          a.push(m[1]);
        }
        var result = a[0] || "";
        return result;
      };

      // PEDIDO VIEW SHOW BOOLEANS
      $scope.pedidoViewShowProdutoNome = false;
      $scope.pedidoViewShowProdutoJaSep = false;
      $scope.pedidoViewShowProdutoQtdePorCaixa = false;
      $scope.pedidoViewShowClienteCodigo = false;
      $scope.pedidoViewShowClienteVendedor = false;
      $scope.pedidoViewShowContainerSobrando = false;
      $scope.pedidoViewShowContainerChegando = false;
      $scope.pedidoViewShowContainerPrevisao = false;
      $scope.pedidoViewShowPedidoObs = false;
      $scope.pedidoViewShowPedidoDataCriada = false;

      $scope.pedidoFiltroCorresponde = function(pedidoCodigoProduto, pedidoNomeCliente, pedidoContainer, buscaCodigoProduto, buscaCodigoCliente, buscaContainer, pedidoEstado) {
        pedidoNomeCliente = pedidoNomeCliente || "";
        
        produtoCorresponde = pedidoCodigoProduto.indexOf(buscaCodigoProduto.toUpperCase()) > -1;

        clienteCorresponde = (pedidoNomeCliente.toLowerCase()).indexOf(buscaCodigoCliente.toLowerCase()) > -1;

        containerCorresponde = pedidoContainer.indexOf(buscaContainer) > -1 && pedidoEstado === 'Container';

        if (buscaCodigoProduto === '') {
          produtoCorresponde = true;
        }

        if (buscaCodigoCliente === '') {
          clienteCorresponde = true;
        }
        
        if (buscaContainer === '') {
          containerCorresponde = true;
        }
        
        return produtoCorresponde && clienteCorresponde && containerCorresponde;
      };

      // CALENDAR
      $scope.today = function() {
        $scope.pedido_dataCriada = moment().format("D/M/YY");
        $scope.pedido_horaCriada = moment().format("H:mm:ss");
      };
      $scope.today();

      $scope.horaNow = function() {
        return moment().format("H:mm:ss");
      };
      
      $scope.open = function($event) {
        $event.preventDefault();
        $event.stopPropagation();

        $scope.opened = true;
      };
      
      $scope.openModalCalendar = function($event) {
        $event.preventDefault();
        $event.stopPropagation();

        $scope.modalCalendarOpened = true;
      };

      // MOMENT.JS
      $scope.getms = function(s) {
        var m = moment(s, "D/M/YY H:mm:ss");
        var result = m.valueOf();
        if (isNaN(result)) {
          result = 0;
        }
        return result;
      };

      $scope.getFormattedDate = function(ms) {
        var result = moment(ms).locale('pt-BR').format('ddd D-MMM-YY H:mm:ss');
        if (result === 'Invalid date') {
          result = 'data invalida';
        }
        if (ms === undefined) {
          result = "";
        }
        return result;
      };
      
      $scope.computePedidosTotal = function(pedidosArray) {
        var total = 0;

        /*
          angular.forEach(pedidosArray, function(value, key) {
          total += parseInt(value.quantidade);
          });
          if (isNaN(total)) {
          total = "";
          }
        */
        
        $scope.computed.pedidosTotal = total;
        $scope.computed.$save();
      };

      $scope.pedidos.$loaded().then(function() {
        $scope.computePedidosTotal($scope.pedidos);
      });

      $scope.addPedido = function(pedido_codigoProduto, pedido_qtdePedida, pedido_qtdeJaSeparada, pedido_codigoCliente, pedido_estado, pedido_obs, pedido_dataCriada, pedido_horaCriada) {
        pedido_obs = pedido_obs || "";
        pedido_qtdePedida = pedido_qtdePedida || 0;
        pedido_qtdeJaSeparada = pedido_qtdeJaSeparada || 0;
        pedido_estado = pedido_estado || "Reserva";
        
        $scope.pedidos.$add({ codigoProduto: pedido_codigoProduto,
                              qtdePedida: parseInt(pedido_qtdePedida),
                              qtdeJaSeparada: parseInt(pedido_qtdeJaSeparada),
                              codigoCliente: parseInt(pedido_codigoCliente),
                              estado: pedido_estado,
                              obs: pedido_obs,
                              dataCriadaNum: $scope.getms(pedido_dataCriada + " " + pedido_horaCriada),
                              dataCriada: pedido_dataCriada,
                              horaCriada: pedido_horaCriada,
                              dataAtualizada: (new Date()).format("weekdayTime"),
                            })
          .then(function() { $scope.computeSobrandoChegando(pedido_codigoProduto.toUpperCase()); })
          .then(function() { $scope.notification = "Adicionado pedido " + pedido_codigoCliente + " " + pedido_qtdePedida + "pçs " + pedido_codigoProduto; })
          .then(function() { $scope.$broadcast("newPedidoAdded"); });
      };

      $scope.editPedidoOpen = function(pedido) {
        var modalInstance = $modal.open({
          templateUrl: 'myPedidoModalContent.html',
          controller: 'EditPedidoModalCtrl',
          size: 'lg',
          resolve: {
            codigoProduto: function() {
              return pedido.codigoProduto;
            },
            qtdePedida: function() {
              return pedido.qtdePedida;
            },
            qtdeJaSeparada: function() {
              return pedido.qtdeJaSeparada;
            },
            codigoCliente: function() {
              return pedido.codigoCliente;
            },
            estado: function() {
              return pedido.estado;
            },
            obs: function() {
              return pedido.obs;
            },
            pedidos: function() {
              return $scope.pedidos;
            },
            vendedores: function() {
              return $scope.vendedores;
            },
            clientesObj: function() {
              return $scope.clientesObj;
            },
            produtosObj: function() {
              return $scope.produtosObj;
            },
            editProdutoOpen: function() {
              return $scope.editProdutoOpen;
            },
            editClienteOpen: function() {
              return $scope.editClienteOpen;
            },
            pedidoEstadoOpcoes: function() {
              return $scope.pedidoEstadoOpcoes;
            },
            pedido: function() {
              return pedido;
            },
            modalCalendarOpened: function() {
              return $scope.modalCalendarOpened;
            },
          }
        });

        modalInstance.result.then(function(selected) {
          selected.pedido.dataCriadaNum = $scope.getms(selected.pedido.dataCriada + " " + selected.pedido.horaCriada);
          $scope.pedidos.$save(selected.pedido)
            .then(function() { $scope.computeSobrandoChegando(selected.pedido.codigoProduto.toUpperCase()); })
            .then(function() { $scope.notification = "Modificado pedido de " + selected.pedido.qtdePedida + " pçs. " + selected.pedido.codigoProduto + " " + $scope.clientesObj[selected.pedido.codigoCliente].nome;} );
        }, function() {
          // do nothing
        });
      };
      // END PEDIDOS


      // CHEGANDO
      $scope.showChegandoChegou = false;
      
      var chegandosRef = ref.child("chegandos");
      $scope.chegandosSync = $firebase(chegandosRef);
      $scope.chegandos = $scope.chegandosSync.$asArray();

      $scope.chegandoTableOrder = ['codigoProduto', 'container'];

      $scope.chegandoChegouOpcoes = [
        'Sim',
        'Não',
      ];

      $scope.showAddChegando = false;
      $scope.showChegandoFiltro = false;

      $scope.chegandoFiltroCodigo = "";
      $scope.chegandoFiltroContainer = "";      

      $scope.chegandoFiltroCorresponde = function(chegandoCodigo, chegandoContainer, buscaCodigo, buscaContainer) {
        codigoCorresponde = chegandoCodigo.indexOf(buscaCodigo.toUpperCase()) > -1;
        containerCorresponde = chegandoContainer.indexOf(buscaContainer.toUpperCase()) > -1;

        if (buscaCodigo === '') {
          codigoCorresponde = true;
        }

        if (buscaContainer === '') {
          containerCorresponde = true;
        }
        return codigoCorresponde && containerCorresponde;
      };
      
      $scope.addChegando = function(chegando_codigoProduto, quantidade, container) {
        quantidade = quantidade || 0;
        container = container || "";
        
        $scope.chegandos.$add({ codigoProduto: chegando_codigoProduto,
                                quantidade: parseInt(quantidade),
                                container: container,
                                chegou: false,
                              })
          .then(function() { $scope.computeSobrandoChegando(chegando_codigoProduto); })
          .then(function() { $scope.notification = "Adicionado chegando " + quantidade + " pçs " + chegando_codigoProduto; })
          .then(function() { $scope.$broadcast("newChegandoAdded"); });
      };

      $scope.alterarChegandoChegou = function(container, estado) {
        var novoEstado = false;
        if (estado === "Sim") {
          novoEstado = true;
        }

        angular.forEach($scope.chegandos, function(chegando, pushId) {
          if (chegando.container === container) {
            chegando.chegou = novoEstado;
            $scope.chegandos.$save(chegando)
              .then(function() { $scope.computeSobrandoChegando(chegando.codigoProduto.toUpperCase()); })
              .then(function() { $scope.notification = "Alterado container chegou " + chegando.codigoProduto + " " + chegando.container; });
          }
        });
      };

      $scope.editChegandoOpen = function(chegando) {
        var modalInstance = $modal.open({
          templateUrl: 'myChegandoModalContent.html',
          controller: 'EditChegandoModalCtrl',
          size: 'lg',
          resolve: {
            produtosObj: function() {
              return $scope.produtosObj;
            },
            chegando: function() {
              return chegando;
            },
            editProdutoOpen: function() {
              return $scope.editProdutoOpen;
            },
          }
        });

        modalInstance.result.then(function(selected) {
          $scope.chegandos.$save(selected.chegando)
            .then(function() { $scope.computeSobrandoChegando(selected.chegando.codigoProduto.toUpperCase()); })
            .then(function() { $scope.notification = "Modificado chegando " + selected.chegando.codigoProduto + " " + selected.chegando.quantidade + " pçs."; });
        }, function() {
          
        });
      };
      
      // END CHEGANDO
      
      // CONTAINERS
      var containersRef = ref.child("containers");
      $scope.containersSync = $firebase(containersRef);
      $scope.containersObj = $scope.containersSync.$asObject();
      $scope.containers = $scope.containersSync.$asArray();
      $scope.containerOrder = "nome";

      $scope.setContainer = function(numero, data, hora, chegou) {
        $scope.containersSync.$set(numero, {
          numero: numero,
          dataPrevisao: data,
          horaPrevisao: hora,
          dataPrevisaoNum: $scope.getms(data + " " + hora),
          chegou: chegou,
        })
          .then(function() { $scope.computeContainerSobrando(numero) });
      };

      $scope.editContainerOpen = function(container) {
        var modalInstance = $modal.open({
          templateUrl: 'myContainerModalContent.html',
          controller: 'EditContainerModalCtrl',
          size: 'lg',
          resolve: {
            numero: function() {
              return container.numero;
            },
            dataPrevisao: function() {
              return container.dataPrevisao;
            },
            horaPrevisao: function() {
              return container.horaPrevisao;
            },
            chegou: function() {
              return container.chegou;
            },
          }
        });

        modalInstance.result.then(function(selected) {
          $scope.setContainer(container.numero, selected.dataPrevisao, selected.horaPrevisao, selected.chegou);
        }, function() {
          // do nothing
        });
      };  // END CONTAINERS

      
      // VENDEDORES
      var vendedoresRef = ref.child("vendedores");
      $scope.vendedoresSync = $firebase(vendedoresRef);
      $scope.vendedoresObj = $scope.vendedoresSync.$asObject();
      $scope.vendedores = $scope.vendedoresSync.$asArray();

      $scope.setVendedor = function(id, nome) {
        $scope.vendedoresSync.$set(id, { id: id, nome: nome });
      };  // END VENDEDORES

      // MINHA CONTA
      $scope.alterarSenha = function(oldPassword, newPassword) {
        formSetEditable("senhaForm", false);
        ref.changePassword({
          email: $scope.operatorEmail,
          oldPassword: oldPassword,
          newPassword: newPassword,
        }, function(error) {
          if (error === null) {
            $scope.alertarResultado("Senha alterada com sucesso.");
            formSetEditable("senhaForm", true);
          } else {
            $scope.alertarResultado("Houve um erro na ateração de senha: " + error);
            formSetEditable("senhaForm", true);
          }
        });
      };

      // CALCULACOES

      var containerSort = function(chegandoA, chegandoB) {
        if ($scope.containersObj[chegandoA.container] === undefined) {
          dateNumA = 1577898000000;
        } else {
          dateNumA = $scope.containersObj[chegandoA.container].dataPrevisaoNum;
        }
        
        if ($scope.containersObj[chegandoB.container] === undefined) {
          dateNumB = 1577898000000;
        } else {
          dateNumB = $scope.containersObj[chegandoB.container].dataPrevisaoNum;
        }

        if (dateNumA > dateNumB) {
          return 1;
        } else if (dateNumB > dateNumA) {
          return -1;
        } else {
          if (chegandoA.container > chegandoB.container) {
            return 1;
          } else if (chegandoB.container > chegandoA.container) {
            return -1;
          } else {
            return 0;
          }
        }

        console.log("container sort: no match");
        return 0;
      };

      var sumChegandos = function(chegandos) {
        var total = 0;
        for (var i = 0; i < chegandos.length; i++) {
          total += chegandos[i];
        }
        return total;
      }

      var subtractFromChegandos = function(chegandos, amount) {
        var result = chegandos.slice();
        for (var i = 0; i < chegandos.length-1; i++) {
          var toSubtract = Math.min(amount, result[i]);
          result[i] -= toSubtract;
          amount -= toSubtract;
        }
        result[chegandos.length-1] -= amount;
        return result;
      }
      
      $scope.computeSobrandoChegando = function(codigo) {
        codigo = codigo.toUpperCase();
        var chegandoTotal = 0;
        var containers = [];
        var containerLabels = [];
        var chegandoPorContainer = [];

        var chegandoSummary = "";

        var local_chegandos = $scope.chegandos.slice();
        
        angular.forEach(local_chegandos.sort(containerSort), function(chegando, pushId) {
          var chegando_container_chegou = false;
          if ($scope.containersObj[chegando.container] !== undefined) {
            chegando_container_chegou = $scope.containersObj[chegando.container].chegou;
          }
          
          if (chegando.codigoProduto === codigo && !chegando_container_chegou) {
            chegandoSummary += chegando.quantidade.toString() + " (" + chegando.container + ") ";
            
            chegandoTotal += parseInt(chegando.quantidade);
            containers.push(chegando.container);
            chegandoPorContainer.push(chegando.quantidade);
            containerLabels.push(chegando.container);
          }
        });
        if (isNaN(chegandoTotal)) {
          chegandoTotal = 0;
        }

        containers = containers.sort().join(", ");

        // var sobrando = chegandoTotal;
        var totalPedidos = 0;

        angular.forEach($scope.pedidos, function(pedido, pushId) {
          if (pedido.codigoProduto.toUpperCase() === codigo && pedido.estado === 'Container') {
            // sobrando -= (pedido.qtdePedida - pedido.qtdeJaSeparada);
            totalPedidos += (pedido.qtdePedida - pedido.qtdeJaSeparada);
          }
        });

        chegandoPorContainer = subtractFromChegandos(chegandoPorContainer, totalPedidos);
        
        // if (sobrando < 0) {
        // sobrando = 0;
        // }

        var sobrandoSummary = "";

        for (var i = 0; i < chegandoPorContainer.length; i++) {
          sobrandoSummary += chegandoPorContainer[i] + " (" + containerLabels[i] + ") ";
        }

        var redo_produtoNome = "";
        var redo_produtoQtdePorCaixa = 0;
        
        if ($scope.produtosObj[codigo] !== undefined) {
          redo_produtoNome = $scope.produtosObj[codigo].nome;
          redo_produtoQtdePorCaixa = $scope.produtosObj[codigo].qtdePorCaixa;
        }
        
        $scope.updateProduto(codigo,
                             redo_produtoNome,
                             redo_produtoQtdePorCaixa,
                             sobrandoSummary,
                             chegandoSummary,
                             containers);
      };

      /*
        $scope.computeSobrandoChegando = function(codigo) {
        codigo = codigo.toUpperCase();
        var chegandoTotal = 0;
        var containers = [];

        var chegandoSummary = "";

        angular.forEach($scope.chegandos.sort(function(a, b) { if (a.container > b.container) { return 1; } else if (a.container < b.container) { return -1; } else { return 0; } }), function(chegando, pushId) {
        if (chegando.codigoProduto === codigo && !chegando.chegou) {
        chegandoSummary += chegando.quantidade.toString() + " (" + chegando.container + ") ";
        chegandoTotal += parseInt(chegando.quantidade);
        if (containers.indexOf(chegando.container) === -1) {
        containers.push(chegando.container);
        }
        }
        });
        if (isNaN(chegandoTotal)) {
        chegandoTotal = 0;
        }

        containers = containers.sort().join(", ");

        var sobrando = chegandoTotal;

        angular.forEach($scope.pedidos, function(pedido, pushId) {
        if (pedido.codigoProduto.toUpperCase() === codigo && pedido.estado === 'Container') {
        sobrando -= (pedido.qtdePedida - pedido.qtdeJaSeparada);
        }
        });

        if (sobrando < 0) {
        sobrando = 0;
        }
        
        $scope.updateProduto(codigo,
        $scope.produtosObj[codigo].nome,
        $scope.produtosObj[codigo].qtdePorCaixa,
        sobrando,
        chegandoSummary,
        containers);
        };
      */
      
      $scope.forceComputeSobrando = function() {
        angular.forEach($scope.produtos, function(produto, id) {
          $scope.notification = produto.codigo;
          $scope.computeSobrandoChegando(produto.codigo);
        });
      };

      $scope.computeContainerSobrando = function(numero) {
        angular.forEach($scope.chegandos, function(chegando, id) {
          if (chegando.container === numero) {
            $scope.computeSobrandoChegando(chegando.codigoProduto);
          }
        });
      };

      // ADICIONAR PRODUTOS EM LOTES
      $scope.processarLoteProdutos = function(lote) {
        var lines = lote.split("\n");
        angular.forEach(lines, function(line) {
          var lineElems = line.split(",");
          $scope.setProduto(lineElems[0], lineElems[1], parseInt(lineElems[2]), 0, 0, "");
        });        
      };

      // ADICIONAR CHEGANDOS EM LOTES
      $scope.processarLoteChegandos = function(lote) {
        var lines = lote.split("\n");
        angular.forEach(lines, function(line) {
          var lineElems = line.split(",");
          $scope.addChegando(lineElems[0], parseInt(lineElems[1]), lineElems[2]);
        });        
      };
      
    }  // END init()

    function clean() {
      $scope.loginStatus = "Por favor fazer login";
      $scope.loggedIn = false;
    }

    $scope.logout = function() {
      ref.unauth();
      document.location.href = "login.html";
    }
    
    var authData = ref.getAuth();
    if (authData) {
      init(authData);
    } else {
      clean();
    }
  }]);

  app.controller('EditClienteModalCtrl', function($scope, $modalInstance, items, clienteNome, idVendedor, codigo, vendedores) {
    $scope.items = items;
    $scope.vendedores = vendedores;
    $scope.selected = {
      item: $scope.items[0],
      codigo: codigo,
      nome: clienteNome,
      idVendedor: idVendedor,
    };
    $scope.ok = function() {
      $modalInstance.close($scope.selected);
    };
    $scope.cancel = function() {
      $modalInstance.dismiss('Cancelar');
    };
  });  // END EDIT CLIENTE MODAL

  app.controller('EditContainerModalCtrl', function($scope, $modalInstance, numero, dataPrevisao, horaPrevisao, chegou) {
    $scope.selected = {
      numero: numero,
      dataPrevisao: dataPrevisao,
      horaPrevisao: horaPrevisao,
      chegou: chegou,
    };
    $scope.ok = function() {
      $modalInstance.close($scope.selected);
    };
    $scope.cancel = function() {
      $modalInstance.dismiss('Cancelar');
    };
  });  // END EDIT CONTAINER MODAL

  
  app.controller('EditProdutoModalCtrl', function($scope, $modalInstance, items, produtoNome, codigo, produtoQtdePorCaixa) {
    $scope.items = items;
    $scope.selected = {
      item: $scope.items[0],
      codigo: codigo,
      nome: produtoNome,
      qtdePorCaixa: produtoQtdePorCaixa,
    };
    $scope.ok = function() {
      $modalInstance.close($scope.selected);
    };
    $scope.cancel = function() {
      $modalInstance.dismiss('Cancelar');
    };
  });  // END EDIT PRODUTO MODAL

  app.controller('EditPedidoModalCtrl', function($scope, $modalInstance, codigoProduto, qtdePedida, qtdeJaSeparada, codigoCliente, estado, obs, clientesObj, produtosObj, vendedores, pedidos, editClienteOpen, editProdutoOpen, pedidoEstadoOpcoes, modalCalendarOpened, pedido) {
    $scope.clientesObj = clientesObj;
    $scope.produtosObj = produtosObj;
    $scope.vendedores = vendedores;
    $scope.pedidos = pedidos;

    $scope.editClienteOpen = editClienteOpen;
    $scope.editProdutoOpen = editProdutoOpen;

    $scope.pedidoEstadoOpcoes = pedidoEstadoOpcoes;

    $scope.pedido = pedido;
    
    $scope.selected = {
      codigoProduto: codigoProduto,
      qtdePedida: qtdePedida,
      qtdeJaSeparada: qtdeJaSeparada,
      codigoCliente: codigoCliente,
      estado: estado,
      obs: obs,
      pedido: pedido,
    };
    $scope.ok = function() {
      $modalInstance.close($scope.selected);
    };
    $scope.cancel = function() {
      $modalInstance.dismiss('Cancelar');
    }
  });  // END EDIT PEDIDO MODAL

  app.controller('EditChegandoModalCtrl', function($scope, $modalInstance, chegando, produtosObj, editProdutoOpen) {
    $scope.produtosObj = produtosObj;
    $scope.editProdutoOpen = editProdutoOpen;
    $scope.chegando = chegando;

    $scope.selected = {
      chegando: chegando,
    };
    $scope.ok = function() {
      $modalInstance.close($scope.selected)
    };
    $scope.cancel = function() {
      $modalInstance.dismiss('Cancelar');
    }
  });  // END EDIT CHEGANDO MODAL

  app.directive("focusOn", function() {
    return function(scope, elem, attr) {
      scope.$on(attr.focusOn, function(e) {
        elem[0].focus();
      });
    };
  });
  
})();
