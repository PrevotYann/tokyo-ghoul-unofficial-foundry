// Hand-traced against the original 1536 × 1024 artwork. Coordinates are pixels.
// v14 CONST.EDGE_SENSE_TYPES.NORMAL and WALL_MOVEMENT_TYPES.NORMAL are both 20.
const SOLID = { move: 20, sight: 20, light: 20, sound: 20 };
const FENCE = { move: 20, sight: 0, light: 0, sound: 0 };
const rect = (x1, y1, x2, y2) => [[x1, y1, x2, y1], [x2, y1, x2, y2], [x2, y2, x1, y2], [x1, y2, x1, y1]];
const path = points => points.slice(1).map((point, i) => [...points[i], ...point]);
const wall = (c, name, overrides = {}) => ({ c, ...SOLID, door: 0, ds: 0, dir: 0, flags: { "tokyo-ghoul-unofficial": { name } }, ...overrides });
const door = (c, name, state = 0, overrides = {}) => wall(c, name, { door: 1, ds: state, ...overrides });
const light = (x, y, dim, bright, color) => ({ x, y, walls: true, hidden: false, config: { dim, bright, color, alpha: 0.2, luminosity: 0.4, attenuation: 0.5, angle: 360 } });

export const sceneLayouts = {
  alley: {
    party: [["aya", 660, 810], ["ren", 750, 810], ["mio", 840, 810], ["daichi", 660, 890], ["nao", 750, 890], ["sora", 840, 890]],
    walls: [
      ...path([[60, 320], [60, 16], [530, 16], [530, 90]]).map(c => wall(c, "Coffee shop exterior")),
      door([530, 90, 530, 155], "Coffee shop rear service door"),
      ...path([[530, 155], [530, 320], [244, 320]]).map(c => wall(c, "Coffee shop exterior")),
      door([180, 320, 244, 320], "Coffee shop entrance", 1),
      wall([60, 320, 180, 320], "Coffee shop exterior"),
      ...rect(50, 450, 550, 760).map(c => wall(c, "Southwest building")),
      ...rect(1020, 445, 1505, 760).map(c => wall(c, "Southeast building")),
      ...rect(758, 198, 851, 450).map(c => wall(c, "Delivery van")),
      wall([1030, 20, 1030, 310], "Loading yard fence", FENCE),
      wall([1030, 20, 1490, 20], "Loading yard boundary"),
      wall([1490, 20, 1490, 310], "Loading yard boundary"),
      wall([1030, 310, 1110, 310], "Loading yard fence", FENCE),
      door([1110, 310, 1190, 310], "Loading yard gate", 0, FENCE),
      wall([1190, 310, 1490, 310], "Loading yard fence", FENCE)
    ],
    lights: [light(325, 250, 32, 18, "#ffd5a0"), light(185, 95, 24, 12, "#ffd5a0"), light(680, 720, 38, 20, "#69cddd"), light(910, 680, 32, 15, "#d04c64"), light(720, 950, 42, 24, "#69cddd"), light(1230, 200, 32, 16, "#80bdca")],
    // Sight/door assertions probe the normal entrance without grazing a corner.
    doorProbe: { name: "Coffee shop entrance", from: { x: 212, y: 365 }, to: { x: 212, y: 275 } },
    wallProbe: { from: { x: 300, y: 365 }, to: { x: 300, y: 275 } }
  },
  clinic: {
    party: [["aya", 660, 860], ["ren", 740, 860], ["mio", 820, 860], ["daichi", 660, 940], ["nao", 740, 940], ["sora", 820, 940]],
    walls: [
      ...path([[110, 750], [110, 80], [1380, 80], [1380, 320]]).map(c => wall(c, "Clinic exterior")),
      door([1380, 320, 1380, 400], "Clinic side service door", 2),
      ...path([[1380, 400], [1380, 750], [860, 750], [860, 835]]).map(c => wall(c, "Clinic exterior")),
      door([685, 835, 860, 835], "Clinic front entrance", 1),
      ...path([[685, 835], [685, 750], [110, 750]]).map(c => wall(c, "Clinic exterior")),
      wall([640, 80, 640, 300], "Reception corridor partition"),
      door([640, 300, 640, 380], "Reception door", 1),
      wall([110, 400, 640, 400], "Reception / cold room divider"),
      wall([640, 380, 640, 400], "Reception corridor partition"),
      wall([595, 400, 595, 535], "Cold room corridor partition"),
      door([595, 535, 595, 615], "Cold room door", 0),
      wall([595, 615, 595, 750], "Cold room corridor partition"),
      wall([850, 80, 850, 305], "Treatment corridor partition"),
      door([850, 305, 850, 385], "Treatment room door", 0),
      wall([850, 385, 850, 420], "Treatment corridor partition"),
      wall([850, 420, 1380, 420], "Treatment / office divider"),
      wall([970, 420, 970, 540], "Office corridor partition"),
      door([970, 540, 970, 620], "Office door", 0),
      wall([970, 620, 970, 750], "Office corridor partition")
    ],
    lights: [light(385, 215, 30, 16, "#c4ece9"), light(1100, 245, 30, 17, "#85d7df"), light(350, 570, 30, 15, "#85d7df"), light(1170, 590, 26, 16, "#e9cd9e"), light(740, 150, 25, 14, "#85d7df"), light(745, 525, 30, 16, "#a6c9d1"), light(773, 875, 25, 16, "#b6d0d8")],
    doorProbe: { name: "Treatment room door", from: { x: 805, y: 345 }, to: { x: 895, y: 345 } },
    wallProbe: { from: { x: 805, y: 250 }, to: { x: 895, y: 250 } }
  },
  station: {
    party: [["aya", 650, 880], ["ren", 730, 880], ["mio", 810, 880], ["daichi", 650, 960], ["nao", 730, 960], ["sora", 810, 960]],
    walls: [
      wall([100, 20, 1460, 20], "Northern station boundary"),
      wall([1460, 20, 1510, 170], "Tunnel boundary"),
      wall([1510, 170, 1510, 895], "Eastern station boundary"),
      wall([45, 20, 45, 280], "Western retaining wall"),
      door([45, 280, 45, 410], "Western station gate", 1, FENCE),
      wall([45, 410, 45, 870], "Western retaining wall"),
      wall([45, 870, 640, 870], "South yard fence", FENCE),
      wall([900, 870, 1180, 870], "South yard fence", FENCE),
      wall([1400, 870, 1510, 870], "South yard fence", FENCE),
      ...rect(140, 605, 330, 810).map(c => wall(c, "Freight containers")),
      ...rect(1260, 340, 1465, 440).map(c => wall(c, "Station delivery van")),
      wall([1170, 635, 1390, 635], "Captive enclosure fence", FENCE),
      wall([1390, 635, 1390, 815], "Captive enclosure fence", FENCE),
      wall([1170, 635, 1170, 815], "Captive enclosure fence", FENCE),
      wall([1170, 815, 1220, 815], "Captive enclosure fence", FENCE),
      door([1220, 815, 1300, 815], "Captive enclosure gate", 2, FENCE),
      wall([1300, 815, 1390, 815], "Captive enclosure fence", FENCE),
      // Invisible movement walls mark the platform lip, leaving its two stairs open.
      wall([135, 550, 725, 550], "Platform edge — use the stairs", FENCE),
      wall([810, 550, 1490, 550], "Platform edge — use the stairs", FENCE)
    ],
    lights: [light(205, 315, 34, 16, "#88d2de"), light(595, 315, 34, 16, "#88d2de"), light(965, 315, 34, 16, "#88d2de"), light(1340, 315, 34, 16, "#88d2de"), light(1265, 700, 24, 12, "#e3c994"), light(770, 905, 35, 18, "#b7c9cf"), light(1090, 735, 30, 12, "#9bbac7")],
    doorProbe: { name: "Captive enclosure gate", from: { x: 1260, y: 860 }, to: { x: 1260, y: 770 } },
    wallProbe: { from: { x: 1470, y: 650 }, to: { x: 1530, y: 650 } }
  }
};

export function buildSceneLayout(key, makeId) {
  const layout = sceneLayouts[key];
  return {
    walls: layout.walls.map((entry, i) => ({ ...structuredClone(entry), _id: makeId(`wall:${key}:${i}`) })),
    lights: layout.lights.map((entry, i) => ({ ...structuredClone(entry), _id: makeId(`light:${key}:${i}`) }))
  };
}
