# 🇬🇳 API Guinée Geo

> Une API open-source fournissant des données géographiques structurées sur les subdivisions administratives de la Guinée.

---

## 🧭 Table des matières

- [Présentation](#pr%C3%A9sentation)
- [Technologies](#technologies)
- [Hiérarchie administrative](#hi%C3%A9rarchie-administrative)
- [Base URL](#base-url)
- [Installation locale](#installation-locale)
- [Endpoints principaux](#endpoints-principaux)
- [Documentation Swagger](#documentation-swagger)
- [Contribuer](#contribuer)
- [Licence](#licence)

---

## 📌 Présentation

L'**API Guinée Geo** est une API RESTful qui permet d'accéder à la hiérarchie administrative de la Guinée :

- Régions
- Préfectures
- Sous-préfectures
- Communes
- Quartiers

Utile pour les développeurs, chercheurs, ONG, gouvernements locaux ou toute personne ayant besoin de données géographiques fiables sur la Guinée.

---

## 🛠️ Technologies

- Node.js + Express.js (Backend REST API)
- MongoDB + Mongoose (Base de données)
- Swagger (Documentation API)
- Vercel (Déploiement serverless)

---

## 🗺️ Hiérarchie administrative

```mermaid
graph TD
  Pays --> Region
  Region --> Prefecture
  Prefecture --> SousPrefecture
  Region --> Commune
  Commune --> Quartier
```

---

## 🌐 Base URL

```
https://api-guinea-geo.vercel.app
```

---

## 💻 Installation locale

```bash
git clone https://github.com/ton-utilisateur/api-guinea-geo.git
cd api-guinea-geo
npm install
```

Créer un fichier `.env` avec :

```env
MONGO_URI=<ton lien MongoDB>
```

Lancer le serveur :
```bash
npm run dev
```

---

## 🔗 Endpoints principaux

### ✅ Régions
- `GET /regions` — liste toutes les régions
- `GET /regions/search?name=Labé` — recherche par nom
- `GET /regions/:name/prefectures` — préfectures d'une région

### ✅ Préfectures
- `GET /prefectures` — liste toutes les préfectures
- `GET /prefectures/search?name=Labé` — recherche par nom
- `GET /prefectures/stats` — statistiques globales ou par région (`?region=Faranah`)

### ✅ Sous-Préfectures
- `GET /sous-prefectures` — liste complète
- `GET /sous-prefectures/search?name=Koulé`

### ✅ Communes
- `GET /communes`
- `GET /communes/search?name=Kaloum`

### ✅ Quartiers
- `GET /quartiers`
- `GET /quartiers/search?name=Almamya`

---

## 📘 Documentation Swagger

Une documentation interactive est disponible ici :

📍 [`/api-docs`](https://api-guinea-geo.vercel.app/api-docs)

Tu peux la tester en local :
```bash
npm run dev
# Puis ouvre http://localhost:3000/api-docs
```

---

## 🤝 Contribuer

Les contributions sont les bienvenues ! Pour contribuer :

```bash
git clone https://github.com/ton-utilisateur/api-guinea-geo.git
cd api-guinea-geo
git checkout -b ma-contribution
```

Puis ouvre une **pull request** ✨

---

## 📄 Licence

Ce projet est sous licence **MIT**. Tu peux l'utiliser librement pour des projets personnels, professionnels ou éducatifs.

---

## 🇬🇳 Vive la Guinée !
