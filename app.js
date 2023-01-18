const { Client, MessageMedia,List, Buttons, LocalAuth } = require('whatsapp-web.js');

const express = require('express');
const { body, validationResult } = require('express-validator');
const fileUpload = require('express-fileupload');
const { phoneNumberFormatter } = require('./helpers/formatter');


// const qrcode = require('qrcode-terminal');
const qrcode = require('qrcode');
const axios = require('axios');

const http = require('http');
const socketIO = require('socket.io');

const port = process.env.PORT || 5000;
const app = express();
const server = http.createServer(app);
const io = socketIO(server);


app.use(express.json());
app.use(express.urlencoded({
  extended: true
}));

app.use(fileUpload({
    debug: false
  }));

app.get('/',(req, res)=>{
    res.sendFile('scan.html', {root:__dirname});
})

const client = new Client({
   restartOnAuthFail: true,
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--single-process', // <- this one doesn't works in Windows
          '--disable-gpu'
        ],
      }
});

const balasan=[];
//Balasan Otomatis
client.on('message', msg => {
  console.log('Respon ', msg);

    if (msg.body == '!Tambah') {
      balasan.push(msg.timestamp);
      client.sendMessage(msg.from, 'Antrian ke-'+balasan.length);
      console.log('Membalas'+balasan.length);

    }else if (msg.body == 'Aktif') {
      client.sendMessage(msg.from, 'Terimakasih sudah respon, nomor telah tersimpan otomatis');

    }else if(msg.body == 'Hubungi nomor baru saya'){
      client.sendMessage(msg.from, 'Terimakasih sudah respon, bisa kirimkan nomor barunya');
    
    }else if (msg.body === '!buttons') {
        let button = new Buttons('Button body',[{body:'bt1'},{body:'bt2'},{body:'bt3'}],'title','footer');
        client.sendMessage(msg.from, button);
    }else if (msg.body === '!list') {
        let sections = [{title:'Menu',rows:[{id:'nasgor',title:'Nasi Goreng', description: 'enak'},{title:'Banyu Putih'}]}];
        let list = new List('Dipilih dipilih','Pilih',sections,'Menu','footer');
        client.sendMessage(msg.from, list);
    }
});

client.initialize();

//Socet IO
// Socket IO
io.on('connection', function(socket) {
  socket.emit('message', 'Connecting...');

  client.on('qr', (qr) => {
    console.log('QR RECEIVED', qr);
    qrcode.toDataURL(qr, (err, url) => {
      socket.emit('qr', url);
      socket.emit('message', 'QR Code received, scan please!');
    });
  });

  client.on('ready', () => {
    socket.emit('ready', 'Whatsapp is ready!');
    socket.emit('message', 'Whatsapp is ready!');
  });

  client.on('authenticated', () => {
    socket.emit('authenticated', 'Whatsapp is authenticated!');
    socket.emit('message', 'Whatsapp is authenticated!');
    console.log('AUTHENTICATED');
  });

  client.on('auth_failure', function(session) {
    socket.emit('message', 'Auth failure, restarting...');
  });

  client.on('disconnected', (reason) => {
    socket.emit('message', 'Whatsapp is disconnected!');
    client.destroy();
    client.initialize();
  });
});


  const checkRegisteredNumber = async function(number) {
    const isRegistered = await client.isRegisteredUser(number);
    return isRegistered;
  }

  // Mengirim Pesan
app.get('/send-message', [
    body('number').notEmpty(),
    body('message').notEmpty(),
  ], async (req, res) => {
    const errors = validationResult(req).formatWith(({
      msg
    }) => {
      return msg;
    });
  
    if (!errors.isEmpty()) {
      return res.status(422).json({
        status: false,
        message: errors.mapped()
      });
    }
  
    const number = phoneNumberFormatter(req.body.number); 
    const message = req.body.message;
  
    const isRegisteredNumber = await checkRegisteredNumber(number);
  
    if (!isRegisteredNumber) {
      return res.status(422).json({
        status: false,
        message: 'The number is not registered'
      });
    }
  
    client.sendMessage(number, message).then(response => {
      res.status(200).json({
        status: true,
        response: response
      });
    }).catch(err => {
      res.status(500).json({
        status: false,
        response: err
      });
    });
});

// Send media
app.post('/send-media', async (req, res) => {
    const number = phoneNumberFormatter(req.body.number);
    const caption = req.body.caption;
    const fileUrl = req.body.file;
  
    // const media = MessageMedia.fromFilePath('./image-example.png');
    // const file = req.files.file;
    // const media = new MessageMedia(file.mimetype, file.data.toString('base64'), file.name);
    
    let mimetype;
    const attachment = await axios.get(fileUrl, {
      responseType: 'arraybuffer'
    }).then(response => {
      mimetype = response.headers['content-type'];
      return response.data.toString('base64');
    });
  
    const media = new MessageMedia(mimetype, attachment, 'Media');
  
    client.sendMessage(number, media, {
      caption: caption
    }).then(response => {
      res.status(200).json({
        status: true,
        response: response
      });
    }).catch(err => {
      res.status(500).json({
        status: false,
        response: err
      });
    });
});

app.get('/periksa',(req, res)=>{
  
  const names = ['6281338332023@c.us','6281338332023@c.us','6281338332023@c.us','6281338332023@c.us','6281338332023@c.us','6281338332023@c.us','6281338332023@c.us','6281338332023@c.us','6281338332023@c.us','6281338332023@c.us'];

    // Runs 5 times, with values of step 0 through 4.
    let button = new Buttons('Saya Celvinanda, apakah nomor ini aktif?',[{body:'Aktif'},{body:'Hubungi nomor baru saya'}],'Memeriksa nomor whatsapp','Terimakasih');

    client.sendMessage('6281338332023@c.us', button).then(response => {
      res.status(200).json({
        status: true,
        response: response
      });
    }).catch(err => {
      res.status(500).json({
        status: false,
        response: err
      });
  });  

});

app.get('/kirim0',(req, res)=>{

  let button = new Buttons('Saya Celvinanda, apakah nomor ini aktif?',[{body:'Aktif'},{body:'Hubungi nomor baru saya'}],'Memeriksa nomor whatsapp','Terimakasih');

  client.sendMessage('6285719405644@c.us', button).then(response => {
    res.status(200).json({
      status: true,
      response: response
    });
  }).catch(err => {
    res.status(500).json({
      status: false,
      response: err
    });
  });  
});

  //Menjalankan server
server.listen(port, function() {
  console.log('App running on *: ' + port);
});