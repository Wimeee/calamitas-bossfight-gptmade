// Native layouts verified against FindFrame in the pinned C# source.
export const minionSprites=Object.freeze({
  "cataclysm": {
    "file": "NPCs/SupremeCalamitas/SupremeCataclysm.png",
    "glowFile": "NPCs/SupremeCalamitas/SupremeCataclysmGlow.png",
    "width": 636,
    "height": 1872,
    "cellW": 212,
    "cellH": 208,
    "columns": 3,
    "rows": 9,
    "framesPerClip": 12,
    "clips": {
      "idle": 0,
      "attack": 0
    },
    "scale": 1,
    "anchor": {
      "x": 106,
      "y": 104
    },
    "headFile": "NPCs/SupremeCalamitas/SupremeCataclysm_Head_Boss.png",
    "headW": 46,
    "headH": 48,
    "headAnchor": {
      "x": 23,
      "y": 24
    },
    "sequences": {
      "idle": [
        0,
        1,
        2,
        3,
        4,
        5,
        6,
        7,
        8,
        9,
        10,
        11
      ],
      "attack": [
        12,
        13,
        14,
        15,
        16,
        17,
        18,
        19,
        20,
        21
      ]
    }
  },
  "catastrophe": {
    "file": "NPCs/SupremeCalamitas/SupremeCatastrophe.png",
    "glowFile": "NPCs/SupremeCalamitas/SupremeCatastropheGlow.png",
    "width": 800,
    "height": 1840,
    "cellW": 400,
    "cellH": 230,
    "columns": 2,
    "rows": 8,
    "framesPerClip": 6,
    "clips": {
      "idle": 0,
      "attack": 0
    },
    "scale": 1,
    "anchor": {
      "x": 200,
      "y": 115
    },
    "headFile": "NPCs/SupremeCalamitas/SupremeCatastrophe_Head_Boss.png",
    "headW": 38,
    "headH": 38,
    "headAnchor": {
      "x": 19,
      "y": 19
    },
    "sequences": {
      "idle": [
        0,
        1,
        2,
        3,
        4,
        5
      ],
      "attack": [
        6,
        7,
        8,
        9,
        10,
        11,
        12,
        13,
        14,
        15
      ]
    }
  },
  "sepulcher": {
    "head": {
      "file": "NPCs/SupremeCalamitas/SepulcherHead.png",
      "width": 62,
      "height": 88,
      "anchor": {
        "x": 31,
        "y": 44
      }
    },
    "body": {
      "file": "NPCs/SupremeCalamitas/SepulcherBody.png",
      "width": 82,
      "height": 72,
      "anchor": {
        "x": 41,
        "y": 36
      }
    },
    "bodyAlt": {
      "file": "NPCs/SupremeCalamitas/SepulcherBodyAlt.png",
      "width": 86,
      "height": 82,
      "anchor": {
        "x": 43,
        "y": 41
      }
    },
    "energyBall": {
      "file": "NPCs/SupremeCalamitas/SepulcherBodyEnergyBall.png",
      "width": 22,
      "height": 120,
      "anchor": {
        "x": 11,
        "y": 12
      },
      "cellH": 24,
      "frames": 5
    },
    "arm": {
      "file": "NPCs/SupremeCalamitas/SepulcherArm.png",
      "width": 20,
      "height": 62,
      "anchor": {
        "x": 10,
        "y": 0
      }
    },
    "forearm": {
      "file": "NPCs/SupremeCalamitas/SepulcherForearm.png",
      "width": 18,
      "height": 60,
      "anchor": {
        "x": 9,
        "y": 30
      }
    },
    "hand": {
      "file": "NPCs/SupremeCalamitas/SepulcherHand.png",
      "width": 34,
      "height": 48,
      "anchor": {
        "x": 17,
        "y": 0
      }
    },
    "tail": {
      "file": "NPCs/SupremeCalamitas/SepulcherTail.png",
      "width": 54,
      "height": 54,
      "anchor": {
        "x": 27,
        "y": 27
      }
    },
    "segmentLength": 11,
    "armAngleOffset": -0.35,
    "forearmAngleOffset": 0.2,
    "handAngleOffset": -0.15
  },
  "seeker": {
    "file": "NPCs/SupremeCalamitas/SoulSeekerSupreme.png",
    "glowFile": "NPCs/SupremeCalamitas/SoulSeekerSupremeGlow.png",
    "width": 96,
    "height": 780,
    "cellW": 96,
    "cellH": 130,
    "columns": 1,
    "rows": 6,
    "framesPerClip": 6,
    "clips": {
      "orbit": 0
    },
    "scale": 1,
    "anchor": {
      "x": 48,
      "y": 65
    },
    "glowScale": 1,
    "warningRadius": 21,
    "salvoInterval": 3,
    "salvoWarningTime": 0.65
  },
  "heart": {
    "file": "NPCs/SupremeCalamitas/BrimstoneHeart.png",
    "width": 44,
    "height": 370,
    "cellW": 44,
    "cellH": 61,
    "columns": 1,
    "rows": 6,
    "framesPerClip": 6,
    "clips": {
      "idle": 0,
      "spawn": 0,
      "hit": 0
    },
    "scale": 1,
    "anchor": {
      "x": 22,
      "y": 30.5
    },
    "pulseFrames": 6,
    "pulseFps": 8
  },
  "soulVortex": {
    "file": "ExtraTextures/SoulVortex.png",
    "width": 408,
    "height": 408,
    "scale": 1,
    "anchor": {
      "x": 204,
      "y": 204
    },
    "rotationSpeed": 0.6
  },
  "largeBloom": {
    "file": "Particles/LargeBloom.png",
    "width": 360,
    "height": 360,
    "scale": 1,
    "anchor": {
      "x": 180,
      "y": 180
    },
    "frames": 8,
    "fps": 20
  }
});
