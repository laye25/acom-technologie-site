# Security Spec: Partner Portal & Order Access

## Data Invariants
1. Un Partenaire ne peut voir que les commandes qui lui ont été explicitement assignées (`partnerId == request.auth.uid`).
2. Un Partenaire ne peut modifier que le `status` (`in_production`, `shipped`, `delivered`) et le `trackingNumber` de ses propres commandes.
3. Un Admin a accès à tout.
4. Les PII (Informations du client) ne sont accessibles qu'aux Admins ou au Partenaire assigné, sous condition stricte.

## Dirty Dozen Payloads (Exemples de tests)
1. Tentative de lecture de `orders` où `partnerId` != `auth.uid` -> PERMISSION_DENIED
2. Modification du prix de la commande par un partenaire -> PERMISSION_DENIED
3. Modification du `partnerId` de la commande par un partenaire -> PERMISSION_DENIED
4. Saisie d'un `trackingNumber` de 1000 caractères -> PERMISSION_DENIED (Validation taille)
5. Tentative de lecture de la collection `partners` par un Partenaire autre que lui-même -> PERMISSION_DENIED
6. Tentative de création d'un `rating` par un partenaire -> PERMISSION_DENIED (Seul le client peut créer un rating)
7. ... (Etc)

## Rôles
- `isAdmin`: Email ou rôle `admin` dans Firestore.
- `isPartner`: Authentifié et `exists(/databases/$(database)/documents/partners/$(request.auth.uid))`.
