const express = require('express');
const app = express();
const path = require('path'); // Ajout de l'importation du module path
const port = 3000;

const staticFilesPath = path.join(__dirname, 'front');

app.use(express.static(staticFilesPath));


app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});