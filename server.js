require('dotenv').config();
const express = require('express');
const cors = require('cors');
const dns = require('dns')
const app = express();
const mongoose = require('mongoose');
const {Schema} = mongoose;

mongoose.connect(process.env.MONGO_URI,{
    useNewUrlParser: true,
    useUnifiedTopology: true
})

mongoose.connection.on("connected", (err, res) => {
  console.log("mongoose connected")
})

let urlSchema = new Schema({
  original_url: {
    type: String,
    required: true,
  },
  short_url: {
    type: Number, 
    required: true,
  }
})

const Url = mongoose.model('Url', urlSchema);

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use(express.urlencoded())
app.use(express.json())

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

app.post('/api/shorturl', (req, res) => {
  
  let url = new URL(req.body.url);
  console.log(url)
  console.log(!url.protocol.includes('https'));

  if(!url) return res.status(400).send({error: 'invalid url'}) 
  if(!url.protocol.includes('https') || !url.protocol.includes('http')) return res.status(400).send({error: 'Invalid URL'})
  if(!url.host.includes('www'))return res.status(400).send({error: 'Invalid URL'})
  console.log('\tpassing tests')
  
  dns.lookup(url.hostname,(err, address, family) => {

    // err will have null value so might considered false
    if(err) return res.status(400).send({error: 'invalid url'})

    Url.findOne({original_url: url.href},(err, data)=>{

      if(err) return res.status(400).send({error: 'can\'t add url to db'})

      if(data) return res.status(400).send(`url already exists in DB, short: ${data.short_url} `)
      else {
        let initailUrl = new Url({
          original_url : url.href,
          short_url: Date.now()
        })
    
        initailUrl.save((err, data) => {

          if(err) return res.status(400).send({error: 'can\'t add url to db'})

          res.status(200).json({
            original_url : data.original_url,
            short_url: data.short_url
          })
        })
      }
    })
  })
});

app.get('/api/shorturl/:shorturl', (req, res) => {
    let short = req.params.shorturl;
    Url.findOne({short_url: short}, (err, match) => {
      if(err) return res.status(400).send({error: 'invalid url'})
      console.log(match)
      console.log("trinnnnnnng....!")
      res.status(200).redirect(match.original_url)
    })
    // should I use DB to fetch the shortend url?
    // redirect user to the short url
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
