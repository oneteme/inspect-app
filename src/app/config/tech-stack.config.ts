/**
 * ─────────────────────────────────────────────────────────────────────────────
 * CONFIGURATION DE LA STACK TECHNIQUE
 * ─────────────────────────────────────────────────────────────────────────────
 * Ce fichier déclare la stack technique affichée dans le dashboard.
 * Chaque entrée référence un ID du catalogue TECH_CATALOG (constants.ts).
 * Commentez ou supprimez les lignes correspondant aux techs non utilisées.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export interface TechStackEntry {
    /** ID correspondant à une clé de TECH_CATALOG dans constants.ts */
    id: string;
    /** Version optionnelle affichée au survol (ex: '17', '3.3.0') */
    version?: string;
}

export const APP_TECH_STACK: TechStackEntry[] = [
    // ── Backend ──
    { id: 'java', version: '17' },
    { id: 'spring', version: '3.3' },

    // ── Frontend ──
    { id: 'angular', version: '17' },

    // ── Bases de données ──
    { id: 'teradata' },
    { id: 'postgresql' },

    // ── Messaging & Intégrations ──
    // { id: 'kafka' },
    { id: 'smtp' },
    { id: 'ftp' },
    { id: 'ldap' },

    // ── Infrastructure ──
    // { id: 'docker' },
    { id: 'kubernetes' },
    // { id: 'apachetomcat' },
    // { id: 'linux' },
    // { id: 'git' },
    // { id: 'github' },
    { id: 'gitlab' },
];
