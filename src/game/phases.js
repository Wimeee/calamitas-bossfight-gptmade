import { getEncounter } from '../boss/registry.js?v=26.3.0';

export function enter(stage,marker,label){getEncounter().enter(stage,marker,label);}

export function transitionHealth(){getEncounter().afterProjectiles();}
