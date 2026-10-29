import { getEncounter } from '../boss/registry.js?v=19.1.1';

export function enter(stage,marker,label){getEncounter().enter(stage,marker,label);}

export function transitionHealth(){getEncounter().afterProjectiles();}
