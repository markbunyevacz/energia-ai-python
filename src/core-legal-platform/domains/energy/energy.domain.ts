import { LegalDomain } from "../../../legal-domains/types";

export const energyDomain: LegalDomain = {
  code: 'energy',
  name: 'Energiajog',
  description: 'Az energiaágazat szabályozásával, szerződéseivel és megfelelőségével kapcsolatos jogi terület.',
  active: true,
  documentTypes: [
    'villamosenergia-kereskedelmi_szerződés',
    'hálózathasználati_szerződés',
    'csatlakozási_szerződés',
    'szállítói_keretszerződés'
  ],
  agentConfig: {
    contract: {
      keywords: [
        'szerződés',
        'megállapodás',
        'feltétel',
        'felmondás',
        'módosítás',
        'kötelezettség',
        'jog',
        'kártérítés',
        'garancia',
        'szavatosság',
        'hálózathasználati',
        'villamosenergia',
        'földgáz',
        'ellátási',
        'kereskedelmi'
      ]
    },
    compliance: {
      keywords: [
        'megfelelőség',
        'előírás',
        'szabályozás',
        'ellenőrzés',
        'audit',
        'kockázat',
        'biztonság',
        'mekh',
        'magyar energia és közmű-szabályozási hivatal',
        'adatszolgáltatás'
      ]
    }
  }
}; 