import { getEncounter } from '../boss/registry.js?v=31.1.3';

export function enter(stage,marker,label){getEncounter().enter(stage,marker,label);}

export function transitionHealth(){getEncounter().afterProjectiles();}
