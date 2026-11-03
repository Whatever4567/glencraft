# v1.0.109 — new mob models (ship all in ONE push)
A=/cursor/stores/store-6b099320-889b-4c23-9eca-54f85c129a7b/grok-bot/agents/146d0e47-1004-4f9b-a662-3b480f6050c9/attachments
- [ ] Pig: $A/01M6E0QEDYVHHXDYWBRTS17CZF.zip
- [ ] Zombie: $A/01M6E0S0481SH83D1MMG68RNSJ.zip (keep knockback/LOS logic, walk+attack anims)
- [ ] Sheep: $A/01M6E134PHT47ZSM1053BCD6Z1.zip (keep sandstorm floating, shearing/wool logic)
- [ ] Haggis: $A/01M6E13EA6J2QPS3ADBY4RH49A.zip (keep existing haggis behaviour)
For each: check licence, optimise (small GLB, compressed textures), scale correctly, hook up anims, keep existing logic. Don't commit raw zips.
Patch notes mention all four. Build, push, verify live.
