# Documentation API pour l'application de gestion de drive

Cette API permet de gérer les dossiers et les fichiers à la racine d'un drive. Les opérations possibles sont les suivantes :

## **Liste des dossiers et fichiers à la racine du "drive"**

Retourne une liste contenant les dossiers et fichiers à la racine du "drive".

```
GET /api/drive
```

Réponses :

- HTTP 200 OK : renvoie la liste des dossiers et fichiers présents dans le drive au format JSON.
- Content-Type: application/json

## **Contenu d'un dossier ou d'un fichier**

Retourne le contenu d'un dossier ou d'un fichier en fonction de son nom.

```
GET /api/drive/{name}
```

Réponses :

- Si {name} est un dossier :
    - HTTP 200 OK : renvoie la liste des dossiers et fichiers présents dans ce dossier au format JSON.
    - Content-Type: application/json
- Si {name} est un fichier :
    - HTTP 200 OK : renvoie le contenu du fichier au format octet-stream.
    - Content-Type: application/octet-stream
- HTTP 404 Not Found : renvoie cette erreur si le nom {name} n'existe pas dans le drive.

## **Création d'un dossier**

Crée un nouveau dossier à la racine du drive ou dans un dossier existant.

### **Création d'un dossier à la racine du drive**

```
POST /api/drive?name={name}
```

Réponses :

- HTTP 201 Created : renvoie cette réponse si le dossier a été créé avec succès.
- HTTP 400 Bad Request : renvoie cette erreur si le nom {name} contient des caractères non-alphanumériques.

### **Création d'un dossier dans un dossier existant**

```
POST /api/drive/{folder}?name={name}
```

Réponses :

- HTTP 201 Created : renvoie cette réponse si le dossier a été créé avec succès.
- HTTP 400 Bad Request : renvoie cette erreur si le nom {name} contient des caractères non-alphanumériques.
- HTTP 404 Not Found : renvoie cette erreur si le dossier {folder} n'existe pas dans le drive.

## **Suppression d'un dossier ou d'un fichier**

Supprime un dossier ou un fichier en fonction de son nom.

### **Suppression d'un dossier ou d'un fichier à la racine du drive**

```
DELETE /api/drive/{name}
```

Réponses :

- HTTP 200 OK : renvoie cette réponse si le dossier ou le fichier a été supprimé avec succès.
- HTTP 400 Bad Request : renvoie cette erreur si le nom {name} contient des caractères non-alphanumériques.

### **Suppression d'un dossier ou d'un fichier dans un dossier existant**

```
DELETE /api/drive/{folder}/{name}
```

Réponses :

- HTTP 200 OK : renvoie cette réponse si le dossier ou le fichier a été supprimé avec succès.
- HTTP 400 Bad Request : renvoie cette erreur si le nom {name} contient des caractères non-alphanumériques.
- HTTP 404 Not Found : renvoie cette erreur si le dossier {folder} n'existe pas dans le drive.

## **Création d'un fichier à la racine du "drive"**

Créez un fichier à la racine du "drive" en utilisant la méthode HTTP PUT sur l'endpoint "/api/drive". Le contenu du fichier doit être inclus dans le corps de la requête en tant que données binaires.

### Requête

```
PUT /api/drive
Content-Type: application/octet-stream

<contenu du fichier>
```

### Réponse

- HTTP 201 : Le fichier a été créé avec succès.
- HTTP 400 : Aucun fichier n'a été présenté dans la requête.
- HTTP 500 : Erreur lors de la création du fichier.

## **Création d'un fichier dans un dossier**

Créez un fichier dans un dossier en utilisant la méthode HTTP PUT sur l'endpoint "/api/drive/{folder}", où {folder} est le nom du dossier dans lequel le fichier doit être créé. Le contenu du fichier doit être inclus dans le corps de la requête en tant que données binaires, avec un en-tête Content-Type de type multipart/form-data.

### Requête

```
PUT /api/drive/{folder}
Content-Type: multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW

------WebKitFormBoundary7MA4YWxkTrZu0gW
Content-Disposition: form-data; name="file"; filename="monfichier.txt"
Content-Type: text/plain

<contenu du fichier>

------WebKitFormBoundary7MA4YWxkTrZu0gW--
```

### Réponse

- HTTP 201 : Le fichier a été créé avec succès.
- HTTP 400 : Aucun fichier n'a été présenté dans la requête ou des caractères non-alphanumériques ont été utilisés dans le nom du fichier.
- HTTP 404 : Le dossier spécifié n'existe pas.
- HTTP 500 : Erreur lors de la création du fichier.