# Data Model Design

## Naming conventions
- Stats use lower-case keys: `str`, `acc`, `per`, `end`, `spd`, `crl`.
- RCL is not a normal stat for all actors. Track it by source:
  - `rcl.ghoul` or active `kagune.system.rcl` for Ghouls.
  - `rcl.kagune` and active `quinque.system.rcl` for Quinx.
  - active `quinque.system.rcl` for Investigators.
- Resource objects use `{ value, max, temp, min }` where practical.

## Actor: `character`
Recommended system data:

```js
{
  identity: {
    class: "ghoul|investigator|quinx",
    faction: "ghoul|ccg|other",
    rankGhoul: "C|B|A|S|SS|SSS",
    rankInvestigator: "rank3|rank2|rank1|firstClass|associateSpecial|specialClass",
    alias: "",
    age: null,
    pronouns: "",
    notes: ""
  },
  stats: {
    str: { base: 10, temp: 0, edge: 0, kakuja: 0, total: 10 },
    acc: { base: 10, temp: 0, edge: 0, kakuja: 0, total: 10 },
    per: { base: 10, temp: 0, edge: 0, kakuja: 0, total: 10 },
    end: { base: 10, temp: 0, edge: 0, kakuja: 0, total: 10 },
    spd: { base: 10, temp: 0, edge: 0, kakuja: 0, total: 10 },
    crl: { base: 10, temp: 0, edge: 0, kakuja: 0, total: 10 }
  },
  rcl: {
    ghoul: { value: 0, max: 0, spent: 0 },
    kagune: { value: 0, max: 0, spent: 0 },
    quinque: { value: 0, max: 0, spent: 0 }
  },
  resources: {
    vitality: { value: 60, max: 60, tempMaxPenalty: 0 },
    stamina: { value: 60, max: 60, tempMaxPenalty: 0 },
    mealScore: { value: 15, max: 15, lastCheckedThresholds: [] },
    rage: { active: false, voluntarilyEntered: false, tempStatBudget: 0, assigned: {} },
    maneuverBudget: { value: 2, max: 2, reactionsReserved: 0 }
  },
  combat: {
    mode: "squad|raid",
    rangeBand: "melee|close|mid|long|far",
    pendingReactions: [],
    readiedAction: null,
    counterDeclared: false,
    grapple: { isGrappling: false, grappledBy: null, targets: [] }
  },
  hunger: {
    active: false,
    regenerationSuppressed: false,
    failedAt: null
  },
  kakuja: {
    eligible: false,
    stage: "none|half|full",
    masteredHalf: false,
    masteredFull: false,
    active: false,
    selectedBonus: null,
    masterySuccesses: 0,
    lostControl: false,
    kakujaEdges: []
  },
  progression: {
    statPoints: 0,
    consumed: [],
    kakuhouStorage: [],
    notes: ""
  },
  biography: {
    appearance: "",
    personality: "",
    backstory: "",
    likes: "",
    dislikes: "",
    goals: ""
  },
  automation: {
    ruleNotes: "",
    manualAdjustments: []
  }
}
```

## Actor: `npc`
NPCs can use the same shape with simplified fields:
- `identity.class`
- stats
- resources
- one active Kagune or Quinque
- edges
- raid tags such as `mob`, `elite`, `boss`

## Item: `kagune`
```js
{
  type: "ukaku|koukaku|rinkaku|bikaku|chimera",
  primaryType: "ukaku|koukaku|rinkaku|bikaku",
  secondaryType: null,
  rcl: 10,
  manifested: false,
  range: { melee: "close|mid", projectile: "long|infinite|null" },
  edgeSlots: { max: 3, used: 0, bonusFromType: 0 },
  edges: [],
  evolution: { spentRcl: 0, statPurchases: [], swappedEdges: [] },
  description: "",
  dynamicNotes: ""
}
```

Kagune type effects:
- Ukaku: `+3 SPD`, max stamina reduced by total SPD, Close range with Long-range projectiles.
- Koukaku: `+3 END`, `-3 SPD`, Close range.
- Rinkaku: gains High-Speed Regeneration, max vitality reduced by total END, Mid range.
- Bikaku: +1 starting edge, `-2` to one of CRL/PER/RCL, Mid range.

## Item: `quinque`
```js
{
  type: "ukaku|koukaku|rinkaku|bikaku|chimera|kakujaWeapon",
  primaryType: "ukaku|koukaku|rinkaku|bikaku",
  secondaryType: null,
  rcl: 10,
  rcBonds: { value: 10, max: 10, broken: false, repairDaysRemaining: 0 },
  equipped: true,
  range: { melee: "close|mid", projectile: "long|infinite|null" },
  edgeSlots: { max: 3, used: 0 },
  edges: [],
  gimmick: null,
  sidearm: { enabled: false, ammoType: "ukaku|koukaku|rinkaku|bikaku", ammo: { value: 0, max: 0 } },
  kakuja: { isKakujaWeapon: false, freeGimmick: false, dynamicEdge: null },
  description: ""
}
```

Quinque type guidelines:
- Ukaku: ranged or light melee; Close melee and Long ranged attacks.
- Koukaku: heavy melee; Close range.
- Rinkaku: specialty/odd weapons; Mid range.
- Bikaku: balanced/general weapons; Mid range.

## Item: `edge`
```js
{
  category: "ghoul|investigator|universal",
  appliesTo: ["kagune", "quinque", "actor", "kakuja"],
  allowedTypes: ["ukaku", "koukaku", "rinkaku", "bikaku", "any"],
  forbiddenTypes: [],
  slots: 1,
  grantsManeuvers: [],
  incompatibleWith: [],
  mustChooseAtCreation: false,
  canTakeAfterCreation: true,
  automation: "full|partial|manual",
  effects: [],
  formula: "",
  notes: ""
}
```

## Item: `gimmick`
```js
{
  gimmickType: "attack|defense|form|utility|dynamic",
  active: false,
  staminaCostMode: "maxEndSpd|tripleMaxEndSpd|none|custom",
  selectedStat: null,
  selectedBenefit: null,
  grantedEdges: [],
  dynamicEffect: "",
  automation: "full|partial|manual"
}
```

## Item: `maneuver`
```js
{
  maneuverType: "action|reaction|interrupt|both",
  requiresEdge: null,
  requiresBothManeuvers: false,
  staminaFormula: "",
  damageFormula: "",
  rangeModifier: 0,
  automation: "full|partial|manual",
  chatAction: "strike|move|ready|breather|allOut|counter|enhance|overextend|grab|throw|heavyStrike|dodge|block|takeHit"
}
```

## Item: `consumable`
Use for grenades, medkits, flesh/meal sources, and Q bullets.
```js
{
  consumableType: "medkit|fragGrenade|incendiaryGrenade|rcLimiterGrenade|qBullet|food|other",
  quantity: 1,
  maxCarry: null,
  range: "melee|close|mid|long|far",
  area: "none|closeRadius|custom",
  effect: {},
  automation: "full|partial|manual"
}
```

## Item: `kakuhou`
```js
{
  sourceName: "",
  sourceRank: "C|B|A|S|SS|SSS",
  sourceRcl: 10,
  sourceKaguneType: "ukaku|koukaku|rinkaku|bikaku",
  sourceEdges: [],
  consumed: false,
  usedFor: "upgrade|forge|discard|null"
}
```

## Active effects / conditions
Model these as Foundry ActiveEffects where possible:
- Bleeding: stacks; 1 Vitality damage at start of turn per stack; regeneration removes stacks.
- Burning: stacks; END roll at start of turn, damage and growth on failure, clear on success.
- Grappled: cannot move or attack; can Take a Breather or oppose STR to break.
- Hunger Active: damages and suppresses regeneration until fed.
- Rage Active: temp stat budget and stamina drain.
- Regeneration Suppressed.
- Kakuja Active.
- Lost Control.
- RC Limiter Cloud.
- Quinque Broken.

## Validation rules
Build validation functions that return warnings/errors:
- Ghoul has exactly one active Kagune unless Chimera.
- Investigator has at least one equipped Quinque, no more than two carried equipped Quinque.
- Quinx has one Kagune and at least one Quinque.
- Edge slot limits are enforced.
- Incompatible edges cannot coexist.
- Type restrictions are enforced.
- Creation-only edges are locked after creation unless the evolution rules permit them.
- CRL max restrictions for Chimera are enforced.
- Kakuja prerequisites are enforced.
- Starting stat point total is 60 across STR, ACC, PER, END, SPD, CRL.
