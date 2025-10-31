/**
 * Calculates the sector angles for each node in the graph data
 * @param {Object} data - The graph data object containing people and layout information
 * @returns {Object} - Modified data object with sector angles added to each person
 */
export function calculateSectorAngles(data) {
  if (!data.people || !data.layout?.sector_distribution || !data.layout?.positioning_rules) {
    return data;
  }

  const { sector_distribution, positioning_rules } = data.layout;

  // Group people by sectors
  const sectorGroups = data.people.reduce((acc, person) => {
    if (!acc[person.sector]) {
      acc[person.sector] = [];
    }
    acc[person.sector].push(person);
    return acc;
  }, {});

  // Sort people within each sector based on positioning rules
  Object.values(sectorGroups).forEach(group => {
    group.sort((a, b) => {
      for (const criterion of positioning_rules.sort_by) {
        if (a[criterion] !== b[criterion]) {
          return a[criterion] < b[criterion] ? -1 : 1;
        }
      }
      return 0;
    });
  });

  // Calculate sector boundaries and centers
  let currentAngle = 0; // Start at 12 o'clock
  const sectors = Object.entries(sector_distribution).map(([name, size]) => {
    const startAngle = currentAngle;
    const endAngle = currentAngle + size;
    const centerAngle = startAngle + (size / 2);
    currentAngle = endAngle;

    return {
      name,
      size,
      startAngle,
      endAngle,
      centerAngle,
      peopleCount: (sectorGroups[name] || []).length
    };
  });

  // Calculate angles for each person in each sector
  const modifiedPeople = data.people.map(person => {
    const sector = sectors.find(s => s.name === person.sector);
    if (!sector) return person;

    const sectorGroup = sectorGroups[person.sector];
    const personIndex = sectorGroup.findIndex(p => p.id === person.id);
    const totalInSector = sectorGroup.length;

    // Calculate individual angle within the sector
    let angle;
    if (totalInSector === 1) {
      angle = sector.centerAngle;
    } else {
      const availableSpace = sector.size * 0.8; // Use 80% of sector size for better visual spacing
      const margin = (sector.size - availableSpace) / 2;
      const step = availableSpace / (totalInSector - 1);
      angle = sector.startAngle + margin + (step * personIndex);
    }

    return {
      ...person,
      sectorAngle: angle,
      sectorStart: sector.startAngle,
      sectorEnd: sector.endAngle
    };
  });

  // Update sectors with actual used angles
  sectors.forEach(sector => {
    const peopleInSector = modifiedPeople.filter(p => p.sector === sector.name);
    if (peopleInSector.length > 0) {
      sector.actualStartAngle = Math.min(...peopleInSector.map(p => p.sectorAngle));
      sector.actualEndAngle = Math.max(...peopleInSector.map(p => p.sectorAngle));
    } else {
      sector.actualStartAngle = sector.startAngle;
      sector.actualEndAngle = sector.endAngle;
    }
  });

  return {
    ...data,
    people: modifiedPeople,
    sectors
  };
}