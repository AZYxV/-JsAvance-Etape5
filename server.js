const express = require('express');
const app = express();
const path = require('path'); // Ajout de l'importation du module path
const port = 3000;
const os = require('os');
const fs = require('fs');
const e = require("express");

const staticFilesPath = path.join(__dirname, 'front');

app.use(express.static(staticFilesPath));

const tmpDir = os.tmpdir();

app.get('/api/drive', async (req, res) => {
    const getDir = await fs.promises.readdir(tmpDir, {
        encoding: "utf-8",
        withFileTypes: true
    });

    const items = await Promise.all(getDir.map(async (element) => {

        if(element.isDirectory()){
            return {
                name : element.name,
                isFolder: element.isDirectory(),
            }
        }
        else
        {

            const stats = await fs.promises.stat(path.join(tmpDir, element.name));

            return {
                name: element.name,
                size: stats.size,
                isFolder: element.isDirectory(),
            }
        }
    }));

    res.json(items)
});

app.get('/api/drive/*', async (req, res) => {

    const params = req.params[0].split('/');
    const targetPath = path.join(tmpDir, ...params); // Utiliser l'opérateur de décomposition pour rejoindre les paramètres en tant que chemin

    try
    {

        const stats = await fs.promises.stat(targetPath);

        if (stats.isDirectory()) {

            // TODO code pour parcourir les dossiers (BONUS)
        }
        else
        {

            const fileContent = await fs.promises.readFile(targetPath, 'utf8')
            res.json(fileContent)
        }
    }
    catch (error)
    {

       res.status(404).json({error: 'Not found'})

    }
});

app.post('/api/drive', (req, res) => {

    const name = req.query.name;

    if (!name)
    {
        return res.status(400).json({ error: 'Le paramètre "name" est requis' });
    }

    if (!/^[a-zA-Z0-9]+$/.test(name)) {
        return res.status(400).json({ error: 'Le paramètre "name" ne doit contenir que des caractères alphanumériques' });
    }

    const folderDir = `${tmpDir}/${name}`;

    if (fs.existsSync(folderDir)) {
        return res.status(409).json({ error: 'Le dossier existe déjà' });
    }

    fs.mkdir(folderDir, {recursive: true}, (err) => {
        if (err)
        {
            return res.status(500).json({ error: 'Impossible de créer le dossier' });
        }
        res.json({ message: `Dossier créé avec succès : ${folderDir}` });
    });
});


app.listen(port, () => {
    console.log(`Port: ${port}`);
});