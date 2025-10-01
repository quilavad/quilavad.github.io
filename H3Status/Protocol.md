# H3Status 0.3.0 Event Reference

> ⚠️ **Warning:** This data structure is **under development** and is **subject to change**.

## Endpoints

By default, the server runs on port `9504` `(H*3*V*R)`.

- `/`: Default endpoint, recieve all game events.

### Example (JS):
```js
const ws = new WebSocket("ws://localhost:9504/");
```

## Object Reference

### Event Object

Every message sent by the server follows this format.\
`type` indicates the event that was triggered, which may or may not contain a relevant `status` object. (More information below)

```js
  {
    "type"  : String,
    "status": Object,
  }
```

Type | Status | Description
---- | ------ | -----------
`"hello"` | [VersionStatus](Protocol.md#versionstatus-object) | Sent on initial connection.
`"sceneEvent"` | [SceneStatus](Protocol.md#scenestatus-object) | Sent when a scene is loaded or reloaded.
`"ammoEvent"` | [AmmoStatus](Protocol.md#ammostatus-object) | Sent when the ammunition in a weapon changes.
`"healthEvent"` | [HealthStatus](Protocol.md#healthstatus-object) | Sent when the player health changes.
`"buffEvent"` | [BuffStatus](Protocol.md#buffstatus-object) | Sent when the player uses a powerup.
`"TNHLevelEvent"` | [TNHLevelStatus](Protocol.md#tnhlevelstatus-object) | Sent when a T&H run begins.
`"TNHPhaseEvent"` | [TNHPhaseStatus](Protocol.md#tnhphasestatus-object) | Sent on phase change in T&H, e.g. Take, Hold, and Complete.
`"TNHHoldPhaseEvent"` | [TNHHoldPhaseStatus](Protocol.md#tnhholdphasestatus-object) | Sent on Hold phase change in T&H, e.g. Analyzing and Hacking.
`"TNHLostStealthBonus"`<br>`"TNHLostNoHitBonus"` | | Sent when a point bonus is lost in T&H.
`"TNHScoreEvent"` | [TNHScoreStatus](Protocol.md#tnhscorestatus-object) | Sent when the score changes in T&H.
`"TNHEncryptionDestroyed"` | | Sent when an encryption target is destroyed.
`"TNHTokenEvent"` | [TNHTokenStatus](Protocol.md#tnhtokenstatus-object) | Sent when the override token count changes in T&H.

### VersionStatus Object

```js
{
  "version"    : String, // Mod version (major.minor.patch)
  "gameVersion": String, // Game version (update.alpha.patch)
}
```

### SceneStatus Object

```js
{
  "name": String, // Name of the loaded scene
}
```

### AmmoStatus Object

```js
{
  "weapon"    : String, // Name of the current weapon
  "roundType" : String, // Weapon round category
  "roundClass": String, // Weapon round subcategory
  "hand"      : Number, // 0 (Left) | 1 (Right)

  "current" : Number, // Number of unspent rounds in the weapon
  "spent"   : Number, // Number of spent rounds in the weapon
  "capacity": Number, // Total round capacity of the weapon
}
```

### HealthStatus Object

```js
{
  "change"   : Number, // The change in player health
  "health"   : Number, // The player's current health
  "maxHealth": Number, // The player's maximum health
}
```

### BuffStatus object

```js
{
  "type"    : String,  // The type of powerup used
  "duration": Number,  // The duration of the effect
  "inverted": Boolean, // Whether the effect is inverted
}
```

<details>
  <summary><strong>Buff Types</strong></summary>

```js
[
  "Health",
  "QuadDamage",    // "Bullet Boost"
  "InfiniteAmmo",
  "Invincibility", // "Shield"
  "GhostMode",
  "FarOutMeat",
  "MuscleMeat",
  "HomeTown",
  "SnakeEye",
  "Blort",
  "Regen",
  "Cyclops",
  "WheredIGo",
  "ChillOut",
]
```

</details>

### TNHLevelStatus Object

```js
{
  "seed"           : Number // Chosen seed
  "levelName"      : String // Name of the current level
  "characterName"  : String // Name of the current character
  "scoreMultiplier": Number // Total base score multiplier

  "aiDifficulty" : String // "Standard" | "Arcade"
  "radarMode"    : String // "Standard" | "Omnipresent" | "Off"
  "targetMode"   : String // "AllTypes" | "Simple" | "NoTargets"
  "healthMode"   : String // "StandardHealth" | "HardcoreOneHit" | "CustomHealth"
  "equipmentMode": String // "Spawnlocking" | "LimitedAmmo"
}
```

### TNHPhaseStatus Object

```js
{
  "phase": String, // Current phase type
  "level": Number, // Current level (Hold number)
  "count": Number, // Total levels (number of Holds)
  "seed" : Number, // Chosen seed

  "hold"  : Number,   // Index of the current hold
  "supply": Number[], // Indices of the current supply points

  // INSTITUTION ONLY:
  "holdName"   : String, // Name of the current Hold
  "supplyNames": String, // Name of the current supply points
}
```

<details>
  <summary><strong>Phase Types</strong></summary>

```js
[
  "Take",
  "Hold",
  "Completed",
  "Dead",
]
```

</details>

### TNHHoldPhaseStatus Object

```js
{
  "phase": String, // Current phase type
  "level": Number, // Current level (encryption number)
  "count": Number, // Total levels (number of encryptions)

  "encryptionType" : String, // Current encryption type
  "encryptionCount": Number, // Number of targets this wave
  "encryptionTime" : Number, // Seconds before encryption hack fails
}
```

<details>
  <summary><strong>Phase Types</strong></summary>

```js
[
  "Beginning",
  "Analyzing",
  "Hacking",
  "Transition",
  "Ending",
]
```

</details>

<details>
  <summary><strong>Encryption Types</strong></summary>

```js
[
  "Static",
  "Hardened",
  "Swarm",
  "Recursive",
  "Stealth",
  "Agile",
  "Regenerative",
  "Polymorphic",
  "Cascading",
  "Orthagonal",
  "Refractive",
]
```

</details>

### TNHScoreStatus Object

```js
{
  "type" : String, // The event that increased the score
  "value": Number, // The value of the score event
  "mult" : Number, // The global score multiplier
  "score": Number, // The current final player score
}
```

<details>
  <summary><strong>Score Event Types</strong></summary>

```js
[
  "HoldPhaseComplete",         // The current Hold was completed
  "HoldDecisecondsRemaining",  // Encryption time remaining in deciseconds
  "HoldWaveCompleteNoDamage",  // Encryption was cleared with no damage
  "HoldPhaseCompleteNoDamage", // Hold was cleared with no damage
  "HoldKill",                  // An enemy died during a Hold
  "HoldHeadshotKill",          // An enemy died from a hit to the head
  "HoldMeleeKill",             // An enemy died from a melee weapon
  "HoldJointBreak",            // An enemy died from joint twisting
  "HoldJointSever",            // An enemy died from joint pulling
  "HoldKillDistanceBonus",     // Increases every 25m from the target
  "HoldKillStreakBonus",       // Two enemies died within one second
  "TakeCompleteNoDamage",      // Take was completed with no damage
  "TakeCompleteNoAlert",       // No enemies were alerted during Take
  "TakeKillGuardUnaware",      // A guard in the Hold room died unalerted
  "TakeHoldPointTakenClean",   // No alerted guards died during Take
]
```

</details>

### TNHTokenStatus Object

```js
{
  "change" : Number, // The change in player override tokens
  "tokens": Number, // The current override token count
}
```
