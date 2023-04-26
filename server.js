const express = require('express');
const app = express();
const path = require('path'); // Ajout de l'importation du module path
const port = 3100;
const os = require('os');
const fs = require('fs');
const multer = require('multer');

const staticFilesPath = path.join(__dirname, 'front');

app.use(express.static(staticFilesPath));

app.use(express.json());

const tmpDir = os.tmpdir();

const upload = multer({ dest: `${tmpDir}` }); // Définir le dossier de destination pour les fichiers uploadés


app.get('/api/drive', async (req, res) => {
    try
    {
        const getDir = await fs.promises.readdir(tmpDir, {
            encoding: "utf-8",
            withFileTypes: true
        });

        const items = await Promise.all(getDir.map(async (element) => {
            const itemPath = path.join(tmpDir, element.name);
            const stats = await fs.promises.stat(itemPath);
            return {
                name: element.name,
                size: stats.size,
                isFolder: element.isDirectory(),
            }
        }));

        res.json(items);
    }
    catch (error)
    {
        console.error("Erreur lors de la lecture du dossier :", error);
        res.status(500).json({ message: "Erreur lors de la lecture du dossier" });
    }
});

app.get('/api/drive/*', async (req, res) => {

    const params = req.params[0].split('/');
    const targetPath = path.join(tmpDir, ...params);

    try
    {

        const stats = await fs.promises.stat(targetPath);

        if (stats.isDirectory())
        {

            const getDir = await fs.promises.readdir(targetPath, { // Utiliser targetPath ici
                encoding: "utf-8",
                withFileTypes: true
            });

            const items = await Promise.all(getDir.map(async (element) => {

                if(element.isDirectory())
                {
                    return {
                        name : element.name,
                        isFolder: element.isDirectory(),
                    }
                }
                else
                {

                    const stats = await fs.promises.stat(path.join(targetPath, element.name)); // Utiliser targetPath ici

                    return {
                        name: element.name,
                        size: stats.size,
                        isFolder: element.isDirectory(),
                    }
                }
            }));

            res.json(items);
        }
        else
        {
            const fileContent = await fs.promises.readFile(targetPath, 'utf8');
            res.json(fileContent);
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

    if (!/^[a-zA-Z0-9]+$/.test(name))
    {
        return res.status(400).json({ error: 'Le paramètre "name" ne doit contenir que des caractères alphanumériques' });
    }

    const folderDir = `${tmpDir}/${name}`;

    if (fs.existsSync(folderDir))
    {
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

app.post('/api/drive/*', (req, res) => {

    const name = req.query.name;

    const params = req.params[0].split('/');
    const targetPath = path.join(tmpDir, ...params);

    if (!name)
    {
        return res.status(400).json({ error: 'Le paramètre "name" est requis' });
    }

    if (!/^[a-zA-Z0-9]+$/.test(name))
    {
        return res.status(400).json({ error: 'Le paramètre "name" ne doit contenir que des caractères alphanumériques' });
    }

    const folderDir = `${targetPath}`;

    if (!fs.existsSync(folderDir))
    {
        return res.status(404).json({ error: 'Le dossier n\'existe pas' });
    }

    const newFolderDir = `${folderDir}/${name}`;

    if (fs.existsSync(newFolderDir))
    {
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

    if (!/^[a-zA-Z0-9]+$/.test(name))
    {
        return res.status(400).json({ error: 'Le paramètre "name" ne doit contenir que des caractères alphanumériques' });
    }

    if (!fs.existsSync(folderDir))
    {
        return res.status(404).json({ error: `${folderDir} n'existe pas` });
    }

    if (fs.lstatSync(folderDir).isDirectory()) // Utiliser fs.lstatSync pour obtenir les informations de fichier
    {
        fs.rmdir(`${folderDir}`,{recursive: true}, (err) => {

            if (err)
            {
                return res.status(500).json({ error: `Impossible de supprimer le dossier ${folderDir}` });
            }

            res.status(200).json({ message: `Dossier ${folderDir} supprimé avec succès` });
        });
    }
    else
    {
        fs.unlink(`${folderDir}`, (err) => {

            if (err)
            {
                return res.status(500).json({ error: `Impossible de supprimer le fichier ${folderDir}` });
            }

            res.status(200).json({ message: `Fichier ${folderDir} supprimé avec succès` });
        });
    }
});

app.delete('/api/drive/*/:name', (req, res) => {

    const name = req.params.name;

    const params = req.params[0].split('/');
    const targetPath = path.join(tmpDir, ...params);

    const folderDir = `${targetPath}/${name}`;

    if (!/^[a-zA-Z0-9.]+$/.test(name))
    {
        return res.status(400).json({ error: 'Le paramètre "name" ne doit contenir que des caractères alphanumériques' });
    }

    if (!fs.existsSync(folderDir))
    {
        return res.status(404).json({ error: `${folderDir} n'existe pas` });
    }

    if (fs.lstatSync(folderDir).isDirectory()) { // Utiliser fs.lstatSync pour obtenir les informations de fichier

        fs.rmdir(`${folderDir}`,{recursive: true}, (err) => {

            if (err) {
                return res.status(500).json({ error: `Impossible de supprimer le dossier ${folderDir}` });
            }

            res.status(200).json({ message: `Dossier ${folderDir} supprimé avec succès` });
        });
    }
    else
    {
        fs.unlink(`${folderDir}`, (err) => {

            if (err) {
                return res.status(500).json({ error: `Impossible de supprimer le fichier ${folderDir}` });
            }

            res.status(200).json({ message: `Fichier ${folderDir} supprimé avec succès` });
        });
    }
});

app.put('/api/drive', upload.single('file'), (req, res) => {

    const file = req.file; // Récupérer le fichier à partir de la requête

    if (!file)
    {
        return res.status(400).json({ error: 'Le fichier à upload est requis' });
    }

    const fileName = file.originalname; // Récupérer le nom original du fichier
    const filePath = file.path; // Récupérer le chemin du fichier temporaire

    if (fs.existsSync(`${tmpDir}/${fileName}`))
    {
        return res.status(409).json({ error: 'Le fichier existe déjà' });
    }

    fs.rename(filePath, `${tmpDir}/${fileName}`, (err) => {

        if (err)
        {
            console.error('Une erreur s\'est produite lors du déplacement du fichier :', err);
            res.status(501).json(filePath);
        }
        else
        {
            console.log('Le fichier a été déplacé avec succès !');
            res.status(200).json(filePath);
        }
    });
});

app.put('/api/drive/*', upload.single('file'), (req, res) => {

    const file = req.file;

    if(!file)
    {
        return res.status(400).json({ error: 'Le fichier à upload est requis' });
    }

    const fileName = file.originalname;
    const filePath = file.path;

    const params = req.params[0].split('/');
    const targetPath = path.join(tmpDir, ...params);

    if(fs.existsSync(`${targetPath}/${fileName}`))
    {
        return res.status(409).json({ error: 'Le fichier existe déjà' });
    }

    fs.rename(filePath, `${targetPath}/${fileName}`, (err) => {

        if (err)
        {
            console.error('Une erreur s\'est produite lors du déplacement du fichier :', err);
            res.status(501).json(filePath);
        }
        else
        {
            console.log('Le fichier a été déplacé avec succès !');
            res.status(200).json(filePath);
        }
    });
});

app.listen(port, () => {
    console.log(`Port: ${port}`);
});