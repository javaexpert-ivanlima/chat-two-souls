const mongo = require('mongodb').MongoClient;
const client = require('socket.io').listen(4000).sockets;

// Conectar mongo
mongo.connect('mongodb://127.0.0.1/mongochat', function (err, db) {
    if (err) {
        throw err;
    }

    console.log('MongoDB connected...');

    // Conectar Socket.io
    client.on('connection', function (socket) {
        let chat = db.collection('chats');

        // Funcao para mandar status
        sendStatus = function (s) {
            socket.emit('status', s);
        }

        socket.on('output', function (data) {
            console.log('get msg');

            let iddousuarioorigem = data.iddousuarioorigem;
            let idusuariodestino = data.idusuariodestino;

            // Buscar historico chat
            chat.find({ iddousuarioorigem: iddousuarioorigem, idusuariodestino: idusuariodestino }).limit(100).sort({ _id: 1 }).toArray(function (err, res) {
                if (err) {
                    throw err;
                }

                // printar mensagens
                socket.emit('output', res);
                console.log(res);
            });
        });

        // Inserir msgs
        socket.on('input', function (data) {
            console.log('insert msg');
            let mensagem = data.mensagem;
            let iddousuarioorigem = data.iddousuarioorigem;
            let idusuariodestino = data.idusuariodestino;

            // verificar msg vazia
            if (mensagem == '') {
                // mandar msg de erro
                sendStatus('msg camp obrigatorio');
            } else {
                // inserir msg mongo
                chat.insert({ iddousuarioorigem: iddousuarioorigem, idusuariodestino: idusuariodestino, mensagem: mensagem, dataHoraMensagen: new Date().toGMTString() }, function () {
                    client.emit('output', [data]);

                    // enviar objeto status
                    sendStatus({
                        message: 'Mensagem enviada',
                        clear: true
                    });
                });
            }
        });

        // Handle clear
        socket.on('clear', function (data) {
            // remover mensagens
            chat.remove({}, function () {
                // Emit cleared
                socket.emit('cleared');
            });
        });
    });
});