const express = require('express');
const path = require('path');

const app = express();

app.use(express.static(path.join(__dirname, 'frontend'))); 

// Redirecionar raiz para login 

app.get('/', (req, res) => { res.redirect('/login/index.html'); });

app.listen(5500, ()=>{
    console.log("servidor frontend rodando na porta 5500");
})