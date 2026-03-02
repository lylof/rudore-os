# GUIDE DE DÉMARRAGE RAPIDE
## Système de Points RUDORE - Implémentation en 7 Jours

---

## 🚀 LANCEMENT EXPRESS

### JOUR 1: SETUP (2 heures)

#### Étape 1: Créer le Google Sheets (30 min)

**Colonnes essentielles:**
```
Builder | Projet | Tâche | Complexité | PB | MQ | MR | Points Finaux | Date
```

**Formule automatique:**
```
Points Finaux = PB × MQ × MR
```

#### Étape 2: Créer les Labels Trello (15 min)

- 🟢 Très Simple = 10 pts
- 🔵 Simple = 25 pts  
- 🟡 Moyen = 50 pts
- 🟠 Complexe = 100 pts
- 🔴 Très Complexe = 200 pts
- ⚫ Critique = 400 pts

#### Étape 3: Template de Carte (15 min)

```markdown
## [COMPLEXITÉ] Nom de la Tâche

**Points de Base:** XX
**Assigné:** @nom
**Deadline:** JJ/MM

### Critères d'Acceptation
- [ ] Critère 1
- [ ] Critère 2
- [ ] Critère 3

### Évaluation Qualité
_[Rempli par manager à la fin]_
- Qualité: [ ] 0.5 | [ ] 0.8 | [ ] 1.0 | [ ] 1.2 | [ ] 1.5
```

#### Étape 4: Brief Équipe (1h)

**Expliquer en 10 minutes:**
1. Points = Complexité × Qualité × Rôle
2. Matrice simple (montrer les 6 niveaux)
3. Dashboard accessible à tous
4. Questions/réponses

---

### JOUR 2-7: PILOTE SUR 1 PROJET

**Choisir:** Projet actif avec 2-3 builders

**Process quotidien:**

1. **Matin:** Manager attribue tâches + complexité
2. **Travail:** Builder exécute
3. **Soir:** Manager évalue qualité
4. **Vendredi:** Update spreadsheet + review

**Checklist hebdomadaire:**
- [ ] Toutes les tâches ont un label complexité
- [ ] Toutes les tâches terminées ont une éval qualité
- [ ] Spreadsheet à jour
- [ ] Feedback collecté
- [ ] Ajustements si nécessaire

---

## 📊 MATRICE SIMPLIFIÉE

### Points de Base (6 niveaux)

| Label | Temps | Points |
|-------|-------|--------|
| 🟢 Très Simple | <1h | 10 |
| 🔵 Simple | 1-3h | 25 |
| 🟡 Moyen | 3-8h | 50 |
| 🟠 Complexe | 8-16h | 100 |
| 🔴 Très Complexe | 16-40h | 200 |
| ⚫ Critique | 40h+ | 400 |

### Multiplicateur Qualité (5 niveaux)

| Qualité | Multi | Quand l'utiliser |
|---------|-------|------------------|
| Refusé | 0.5 | À refaire complètement |
| Acceptable | 0.8 | OK après corrections |
| Bon | 1.0 | Conforme aux specs |
| Excellent | 1.2 | Dépasse attentes |
| Exceptionnel | 1.5 | Innovation majeure |

### Multiplicateur Rôle (4 niveaux)

| Niveau | Multi |
|--------|-------|
| Junior | 0.8 |
| Mid | 1.0 |
| Senior | 1.3 |
| Lead | 1.5 |

---

## 💡 3 EXEMPLES RAPIDES

### Exemple A: Tâche Simple, Bon Travail
```
Tâche: Formulaire contact
Complexité: Simple (25 pts)
Builder: Mid (1.0)
Qualité: Bon (1.0)

Points = 25 × 1.0 × 1.0 = 25 points
```

### Exemple B: Tâche Complexe, Excellent
```
Tâche: Système paiement
Complexité: Complexe (100 pts)
Builder: Senior (1.3)
Qualité: Excellent (1.2)

Points = 100 × 1.2 × 1.3 = 156 points
```

### Exemple C: Tâche Moyenne, Refaite
```
Tâche: Page produit
Complexité: Moyen (50 pts)
Builder: Junior (0.8)
Qualité: Acceptable (0.8)

Points = 50 × 0.8 × 0.8 = 32 points
```

---

## ⚠️ 3 RÈGLES D'OR

### 1. TRANSPARENCE
- Dashboard visible par tous
- Formules accessibles
- Décisions expliquées

### 2. SIMPLICITÉ
- Pas de calculs compliqués
- Pas de bureaucratie
- 5 minutes par tâche max

### 3. COMMUNICATION
- Feedback hebdomadaire
- Questions encouragées
- Ajustements rapides

---

## 🎯 CHECKLIST QUOTIDIENNE MANAGER

**MATIN (10 min):**
- [ ] Créer cartes Trello pour tâches du jour
- [ ] Attribuer label complexité
- [ ] Assigner aux builders

**SOIR (10 min):**
- [ ] Review travail terminé
- [ ] Attribuer multiplicateur qualité
- [ ] Commenter feedback constructif

**VENDREDI (30 min):**
- [ ] Update Google Sheets
- [ ] Calculer total points par builder
- [ ] Partager dashboard
- [ ] Retro équipe (15 min)

---

## 🆘 FAQ EXPRESS

**Q: Qui décide de la complexité?**
A: Le manager, mais le builder peut challenger

**Q: Peut-on changer la complexité après?**
A: Oui, si mal estimé. Documenter pourquoi.

**Q: Comment gérer une tâche collaborative?**
A: Split points proportionnellement (ex: 70/30)

**Q: Que faire si travail exceptionnel?**
A: Multiplicateur qualité 1.5 + reconnaissance publique

**Q: Builder pas d'accord avec évaluation?**
A: Discussion 1-on-1. Si pas résolu, escalade COO.

---

## 📞 CONTACTS

- **Process:** Jean-Pierre (COO)
- **Technique:** Leonel (CTO)
- **Équité:** Honoré (CSO)

---

## 🎓 RESSOURCES

- **Document Complet:** systeme_points_equity_rudore.md
- **Google Sheets Template:** [lien à créer]
- **Video Tutorial:** [à créer]
- **FAQ Live:** [Notion/Wiki]

---

**TL;DR:** 
1. Créer labels Trello (6 couleurs = 6 points)
2. Créer Google Sheets (formule: PB × MQ × MR)
3. Briefer équipe (10 min)
4. Tester 1 semaine sur 1 projet
5. Ajuster et déployer

**Temps total setup:** 2 heures  
**Temps quotidien:** 20 minutes  
**ROI:** Transparence + Motivation + Méritocratie

---

*Document créé pour RUDORE & Co - 02/02/2026*  
*Version: Quick Start 1.0*
