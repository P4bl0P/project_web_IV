import {
  buildSolarRound,
  calculateAgeInSolarRound,
  calculateScoutBranchForRound,
  getSolarRoundForDate,
} from './scout-branch.util';

describe('scout-branch.util - Lógica oficial de ramas y rondas solares', () => {
  describe('getSolarRoundForDate', () => {
    it('considera el inicio de ronda el 1 de septiembre y el fin el 31 de agosto del año siguiente', () => {
      expect(getSolarRoundForDate('2026-08-31')).toEqual({
        startYear: 2025,
        endYear: 2026,
        label: '2025/2026',
        startDate: '2025-09-01',
        endDate: '2026-08-31',
      });

      expect(getSolarRoundForDate('2026-09-01')).toEqual({
        startYear: 2026,
        endYear: 2027,
        label: '2026/2027',
        startDate: '2026-09-01',
        endDate: '2027-08-31',
      });

      expect(getSolarRoundForDate('2027-01-15')).toEqual(buildSolarRound(2026));
      expect(getSolarRoundForDate('2027-08-31')).toEqual(buildSolarRound(2026));
      expect(getSolarRoundForDate('2027-09-01')).toEqual(buildSolarRound(2027));
    });
  });

  describe('Ejemplos obligatorios de la ronda solar 2026/2027 (01/09/2026 - 31/08/2027)', () => {
    it('Ejemplo 1: niño que cumple 9 años el 23 de diciembre de 2026 pertenece a Lobatos toda la ronda 2026/2027', () => {
      const birthDate = '2017-12-23';
      const result = calculateScoutBranchForRound(birthDate, '2026/2027');

      expect(result.age).toBe(9);
      expect(result.branch).toBe('Lobatos');
      expect(result.solarRound.label).toBe('2026/2027');
      expect(result.isEligibleAsYouth).toBe(true);
      expect(result.isManagedByGroup).toBe(true);
    });

    it('Ejemplo 2: niño que cumple 14 años en enero de 2027 pertenece a Rangers durante toda la ronda 2026/2027', () => {
      const birthDate = '2013-01-20';
      const result = calculateScoutBranchForRound(birthDate, '2026/2027');

      expect(result.age).toBe(14);
      expect(result.branch).toBe('Rangers');
      expect(result.isEligibleAsYouth).toBe(true);
    });

    it('Ejemplo 3: persona que cumple 21 años en diciembre de 2026 pertenece a Responsables desde el inicio de la ronda 2026/2027', () => {
      const birthDate = '2005-12-10';
      const result = calculateScoutBranchForRound(birthDate, '2026/2027');

      expect(result.age).toBe(21);
      expect(result.branch).toBe('Responsables');
      expect(result.isAdultLeader).toBe(true);
      expect(result.isEligibleAsYouth).toBe(false);
      expect(result.isManagedByGroup).toBe(true);
    });
  });

  describe('Límites exactos (1 de septiembre, 31 de agosto y años bisiestos)', () => {
    it('asigna correctamente cumpleaños en 31 de agosto y 1 de septiembre', () => {
      // Ronda 2026/2027 (01/09/2026 - 31/08/2027)
      // Nacido el 31/08/2018: cumple 9 años el 31/08/2027 (dentro de la ronda 2026/2027) -> Lobatos
      const aug31 = calculateScoutBranchForRound('2018-08-31', 2026);
      expect(aug31.age).toBe(9);
      expect(aug31.branch).toBe('Lobatos');

      // Nacido el 01/09/2018: cumple 8 años el 01/09/2026 (y no cumple 9 hasta 01/09/2027, siguiente ronda) -> Castores
      const sep1 = calculateScoutBranchForRound('2018-09-01', 2026);
      expect(sep1.age).toBe(8);
      expect(sep1.branch).toBe('Castores');

      // En la ronda siguiente 2027/2028 pasa a Lobatos con 9 años
      const sep1NextRound = calculateScoutBranchForRound('2018-09-01', 2027);
      expect(sep1NextRound.age).toBe(9);
      expect(sep1NextRound.branch).toBe('Lobatos');
    });

    it('maneja años bisiestos (29 de febrero) correctamente sin desfases', () => {
      const leapKid = calculateScoutBranchForRound('2016-02-29', '2026/2027');
      expect(leapKid.age).toBe(11);
      expect(leapKid.branch).toBe('Lobatos');

      const leapNextRound = calculateScoutBranchForRound('2016-02-29', '2027/2028');
      expect(leapNextRound.age).toBe(12);
      expect(leapNextRound.branch).toBe('Rangers');
    });

    it('calcula exactamente igual con Date UTC midnight o string ISO', () => {
      const fromStr = calculateAgeInSolarRound('2018-09-01', 2026);
      const fromDate = calculateAgeInSolarRound(new Date('2018-09-01T00:00:00.000Z'), 2026);
      expect(fromDate.age).toBe(fromStr.age);
      expect(fromDate.solarRound.label).toBe(fromStr.solarRound.label);
    });
  });

  describe('Todos los tramos oficiales, exclusión de Rutas y menores de edad mínima', () => {
    it('cubre Menor de 6 años (< 6), Castores (6-8), Lobatos (9-11), Rangers (12-14), Pioneros (15-17), Rutas (18-20) y Responsables (21+)', () => {
      const round = '2026/2027'; // Fin: 2027-08-31

      expect(calculateScoutBranchForRound('2022-05-10', round)).toMatchObject({
        age: 5,
        branch: 'Menor de 6 años',
        isEligibleAsYouth: false,
        isManagedByGroup: false,
      });

      // Castores: 6, 7, 8
      expect(calculateScoutBranchForRound('2021-05-10', round)).toMatchObject({ age: 6, branch: 'Castores', isEligibleAsYouth: true });
      expect(calculateScoutBranchForRound('2020-05-10', round)).toMatchObject({ age: 7, branch: 'Castores', isEligibleAsYouth: true });
      expect(calculateScoutBranchForRound('2019-05-10', round)).toMatchObject({ age: 8, branch: 'Castores', isEligibleAsYouth: true });

      // Lobatos: 9, 10, 11
      expect(calculateScoutBranchForRound('2018-05-10', round)).toMatchObject({ age: 9, branch: 'Lobatos', isEligibleAsYouth: true });
      expect(calculateScoutBranchForRound('2017-05-10', round)).toMatchObject({ age: 10, branch: 'Lobatos', isEligibleAsYouth: true });
      expect(calculateScoutBranchForRound('2016-05-10', round)).toMatchObject({ age: 11, branch: 'Lobatos', isEligibleAsYouth: true });

      // Rangers: 12, 13, 14
      expect(calculateScoutBranchForRound('2015-05-10', round)).toMatchObject({ age: 12, branch: 'Rangers', isEligibleAsYouth: true });
      expect(calculateScoutBranchForRound('2014-05-10', round)).toMatchObject({ age: 13, branch: 'Rangers', isEligibleAsYouth: true });
      expect(calculateScoutBranchForRound('2013-05-10', round)).toMatchObject({ age: 14, branch: 'Rangers', isEligibleAsYouth: true });

      // Pioneros: 15, 16, 17
      expect(calculateScoutBranchForRound('2012-05-10', round)).toMatchObject({ age: 15, branch: 'Pioneros', isEligibleAsYouth: true });
      expect(calculateScoutBranchForRound('2011-05-10', round)).toMatchObject({ age: 16, branch: 'Pioneros', isEligibleAsYouth: true });
      expect(calculateScoutBranchForRound('2010-05-10', round)).toMatchObject({ age: 17, branch: 'Pioneros', isEligibleAsYouth: true });

      // Rutas: 18, 19, 20 -> fuera del ámbito del grupo, nunca asignados a Pioneros
      for (const year of [2009, 2008, 2007]) {
        const rutas = calculateScoutBranchForRound(`${year}-05-10`, round);
        expect(rutas.branch).toBe('Rutas');
        expect(rutas.isExternalRutas).toBe(true);
        expect(rutas.isEligibleAsYouth).toBe(false);
        expect(rutas.isManagedByGroup).toBe(false);
      }

      // Responsables: 21+
      expect(calculateScoutBranchForRound('2006-05-10', round)).toMatchObject({
        age: 21,
        branch: 'Responsables',
        isAdultLeader: true,
        isEligibleAsYouth: false,
        isManagedByGroup: true,
      });
    });

    it('permite consultar rondas pasadas o futuras explícitamente sin alterar cálculos históricos', () => {
      const birthDate = '2017-12-23';
      expect(calculateScoutBranchForRound(birthDate, '2025/2026').branch).toBe('Castores');
      expect(calculateScoutBranchForRound(birthDate, '2026/2027').branch).toBe('Lobatos');
      expect(calculateScoutBranchForRound(birthDate, '2029/2030').branch).toBe('Rangers');
    });
  });
});
