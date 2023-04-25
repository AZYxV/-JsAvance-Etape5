const express = require('express');
const app = express();
const path = require('path'); // Ajout de l'importation du module path
const port = 3100;
const os = require('os');
const fs = require('fs');
const e = require("express");
const bb = require('express-busboy');
const {json} = require("express");

const staticFilesPath = path.join(__dirname, 'front');

app.use(express.static(staticFilesPath));

app.use(express.json());

const tmpDir = os.tmpdir();

bb.extend(app, {
    upload: true,
    path: `${tmpDir}`,
    allowedPath: /./
});

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

app.post('/api/drive/:folder', (req, res) => {

    const name = req.query.name;

    const folder = req.params.folder;

    if (!name)
    {
        return res.status(400).json({ error: 'Le paramètre "name" est requis' });
    }

    if (!/^[a-zA-Z0-9]+$/.test(name)) {
        return res.status(400).json({ error: 'Le paramètre "name" ne doit contenir que des caractères alphanumériques' });
    }

    const folderDir = `${tmpDir}/${folder}`;

    if (!fs.existsSync(folderDir)) {
        return res.status(404).json({ error: 'Le dossier n\'existe pas' });
    }

    const newFolderDir = `${folderDir}/${name}`;

    if (fs.existsSync(newFolderDir)) {
        return res.status(409).json({ error: 'Le dossier existe déjà' });
    }

    fs.mkdir(newFolderDir, {recursive: true}, (err) => {
        if (err)
        {
            return res.status(500).json({ error: 'Impossible de créer le dossier' });
        }
        res.status(201).json({ message: `Dossier créé avec succès : ${newFolderDir}` });
    });
});

app.delete('/api/drive/:name', (req, res) => {

    const name = req.params.name;

    const folderDir = `${tmpDir}/${name}`;

    if (!/^[a-zA-Z0-9]+$/.test(name)) {
        return res.status(400).json({ error: 'Le paramètre "name" ne doit contenir que des caractères alphanumériques' });
    }

    if (!fs.existsSync(folderDir)) {
        return res.status(404).json({ error: `${folderDir} n'existe pas` });
    }

    if (fs.lstatSync(folderDir).isDirectory()) { // Utiliser fs.lstatSync pour obtenir les informations de fichier
        fs.rmdir(`${folderDir}`,{recursive: true}, (err) => {
            if (err) {
                return res.status(500).json({ error: `Impossible de supprimer le dossier ${folderDir}` });
            }
            res.status(200).json({ message: `Dossier ${folderDir} supprimé avec succès` });
        });
    } else {
        fs.unlink(`${folderDir}`, (err) => {
            if (err) {
                return res.status(500).json({ error: `Impossible de supprimer le fichier ${folderDir}` });
            }
            res.status(200).json({ message: `Fichier ${folderDir} supprimé avec succès` });
        });
    }
});

app.delete('/api/drive/:folder/:name', (req, res) => {

    const folder = req.params.folder;

    const name = req.params.name;

    const folderDir = `${tmpDir}/${folder}/${name}`;

    if (!/^[a-zA-Z0-9]+$/.test(name)) {
        return res.status(400).json({ error: 'Le paramètre "name" ne doit contenir que des caractères alphanumériques' });
    }

    if (!fs.existsSync(folderDir)) {
        return res.status(404).json({ error: `${folderDir} n'existe pas` });
    }

    if (fs.lstatSync(folderDir).isDirectory()) { // Utiliser fs.lstatSync pour obtenir les informations de fichier
        fs.rmdir(`${folderDir}`,{recursive: true}, (err) => {
            if (err) {
                return res.status(500).json({ error: `Impossible de supprimer le dossier ${folderDir}` });
            }
            res.status(200).json({ message: `Dossier ${folderDir} supprimé avec succès` });
        });
    } else {
        fs.unlink(`${folderDir}`, (err) => {
            if (err) {
                return res.status(500).json({ error: `Impossible de supprimer le fichier ${folderDir}` });
            }
            res.status(200).json({ message: `Fichier ${folderDir} supprimé avec succès` });
        });
    }
});

app.put('/api/drive', (req, res) => {

    const file = req.files.file;

    const fileObj = JSON.parse(JSON.stringify(file));

    const filePath = fileObj.file;

    const fileName = fileObj.filename;

    if (!file) {
        return res.status(400).json({ error: 'Le fichier à upload est requis' });
    }

    if (fs.existsSync(`${tmpDir}/${fileName}`)) {
        return res.status(409).json({ error: 'Le fichier existe déjà' });
    }


    fs.rename(`${filePath}`, `${tmpDir}/${fileName}`, (err) => {
        if (err) {
            console.error('Une erreur s\'est produite lors du déplacement du fichier :', err);
            res.status(501).json(filePath);
        } else {
            console.log('Le fichier a été déplacé avec succès !');
            res.status(200).json(filePath);
        }
    });
});

app.listen(port, () => {
    console.log(`Port: ${port}`);
});