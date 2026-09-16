// backend/server.js

// 1. Imports des modules
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config(); // Charge les variables d'environnement depuis .env

// 2. Import des routeurs (vérifie que le chemin est correct)
const productRoutes = require('./routes/productRoutes');

// 3. Création de l'application Express
const app = express();

// 4. Définition du port (priorité à la variable d'env, sinon 5000)
const PORT = process.env.PORT || 5000;

// 5. Middlewares globaux
app.use(cors());                     // Autorise les requêtes cross-origin
app.use(bodyParser.json());           // Analyse le JSON dans le corps des requêtes
app.use(bodyParser.urlencoded({ extended: true })); // Pour les formulaires classiques

// 6. Route de test (pour vérifier que le serveur répond)
app.get('/', (req, res) => {
  res.send('✅ API du marketplace fonctionne !');
});

// 7. Montage des routes API (toutes les routes sous /api/produits)
app.use('/api/produits', productRoutes);

// 8. Gestion des routes inexistantes (404)
app.use((req, res, next) => {
  res.status(404).json({ error: 'Route non trouvée' });
});

// 9. Gestionnaire d'erreurs global (pour les erreurs dans les routes)
app.use((err, req, res, next) => {
  console.error('❌ Erreur serveur :', err.stack);
  res.status(500).json({ error: 'Erreur interne du serveur' });
});

// 10. Démarrage du serveur
const server = app.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
});

// 11. Gestion des erreurs non capturées (pour éviter les crashs silencieux)
process.on('uncaughtException', (err) => {
  console.error('🔥 Erreur non capturée :', err);
  server.close(() => {
    process.exit(1); // Arrêt propre après affichage de l'erreur
  });
});

process.on('unhandledRejection', (err) => {
  console.error('⚠️ Rejet non géré :', err);
  server.close(() => {
    process.exit(1);
  });
});

// 12. Arrêt propre avec Ctrl+C
process.on('SIGINT', () => {
  console.log('\n🛑 Arrêt du serveur demandé');
  server.close(() => {
    console.log('Serveur arrêté');
    process.exit(0);
  });
});