// Nightshade Protocol — level data and tuning constants.
// A level is a grid of tiles:
//   '#' wall, '.' floor, 'B' bush cover, 'C' crate cover,
//   'I' intel cache, 'E' exit door, 'P' player start.
// Guards walk the waypoint lists in tile coordinates, pausing at each stop.
export const TILE = 40;
export const COLS = 25;
export const ROWS = 16;
export const VIEW_W = 1280;
export const VIEW_H = 720;

export const PLAYER_SPEED = 175;
export const SNEAK_SPEED = 95;
export const GUARD_PATROL_SPEED = 58;
export const GUARD_CHASE_SPEED = 158;
export const VISION_RANGE = 230;
export const VISION_HALF_ANGLE = 0.62;
export const SNEAK_VISION_RANGE = 150;
export const CATCH_DISTANCE = 30;
export const HIDE_DISTANCE = 62;
export const NOISE_RADIUS = 95;
export const DECOY_RADIUS = 330;

export const LEVELS = [
  {
    name: 'Level 1 — The Archive Wing',
    brief: 'Lift 3 intel caches, then slip out the green exit unseen.',
    decoys: 3,
    map: [
      '#########################',
      '#P....#......#......I...#',
      '#.....#..B...#..C.......#',
      '#.....#......#......#...#',
      '#.##.....##..#..##..#...#',
      '#....B.......#......#...#',
      '#.####..#####...##......#',
      '#....#......#......#....#',
      '#..G.....B..#..I...#..#.#',
      '#.####..#####..####.#...#',
      '#....#......#......#..#.#',
      '#.##...##..C#..##..#..#.#',
      '#....B......#......#....#',
      '#.####..#####..##...##..#',
      '#....#......#..I....#.E.#',
      '#########################',
    ],
    guards: [
      { path: [[7, 8], [11, 8], [11, 3], [7, 3]], speed: 58 },
      { path: [[18, 13], [18, 6], [23, 6], [23, 13]], speed: 62 },
    ],
  },
  {
    name: 'Level 2 — The Vault Floor',
    brief: 'More eyes, tighter halls. Bushes and crates are your friends.',
    decoys: 3,
    map: [
      '#########################',
      '#P...#....B....#....I...#',
      '#....#.........#........#',
      '#.##....##.....#..##....#',
      '#....B.....#...#....C...#',
      '#.####.#####...#.####...#',
      '#....#.....#...#....#...#',
      '#.G......C....B....#..#.#',
      '#.####.#####.#####..#...#',
      '#....#.....#.....#......#',
      '#.##...##..#..##..#.##..#',
      '#....B.....#......#.....#',
      '#.####.#####..##..#..#..#',
      '#....#.....I..#...#.....#',
      '#....#..B.....#..I...#E.#',
      '#########################',
    ],
    guards: [
      { path: [[3, 7], [10, 7], [10, 11], [3, 11]], speed: 62 },
      { path: [[14, 3], [20, 3], [20, 9], [14, 9]], speed: 66 },
      { path: [[8, 13], [13, 13], [13, 5], [6, 5]], speed: 60 },
    ],
  },
  {
    name: 'Level 3 — The Director Suite',
    brief: 'The last floor. Four guards, no room for mistakes.',
    decoys: 4,
    map: [
      '#########################',
      '#P....#..B...#.....I....#',
      '#.....#......#..........#',
      '#.##.....##..#..##..#...#',
      '#....B.......#......#...#',
      '#.####..#####...##..#...#',
      '#....#......#......#....#',
      '#..G....B...#..I...#..#.#',
      '#.####..#####..####.#...#',
      '#....#......#......#..#.#',
      '#.##...##..C#..##..#..#.#',
      '#....B......#......#....#',
      '#.####..#####..##...##..#',
      '#....#......#..I....#.E.#',
      '#..G....B...#......#....#',
      '#########################',
    ],
    guards: [
      { path: [[6, 7], [11, 7], [11, 11], [6, 11]], speed: 66 },
      { path: [[18, 3], [22, 3], [22, 8], [19, 8]], speed: 70 },
      { path: [[14, 10], [18, 10], [18, 14], [14, 14]], speed: 64 },
      { path: [[4, 14], [9, 14], [9, 9], [4, 9]], speed: 62 },
    ],
  },
];
