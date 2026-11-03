import {getLocale,registerTranslation} from '../core/localization.js?v=25.0.0';
// Keys/text from installed Calamity2.2.4 en-US boss localization; Ukrainian translation.
export const calamitasDialogue=Object.freeze({
 SCalSummonText:["Do you enjoy going through hell?","Тобі подобається проходити крізь пекло?"],
 SCalSummonTextRematch:["If you're looking for some fourth-degree burns, you've got the right person.","Якщо шукаєш опіків четвертого ступеня — звертаєшся за адресою."],
 SCalBH2Text:["It wasn't too long ago you barely managed to defeat my doppelganger. Quite the failure, wasn't it?","Ще зовсім недавно ти ледве здолав мого двійника. Жалюгідна пародія, чи не так?"],
 SCalBH2TextRematch:["You'll still have to work hard for this victory.","За цю перемогу тобі все одно доведеться добряче попрацювати."],
 SCalBH3Text:["You've harnessed great power, but you wield it for no one but yourself.","Ти опанував величезну силу, але використовуєш її лише заради себе."],
 SCalBH3TextRematch:["I haven't had such an interesting target dummy to test my magic on in a long time.","Давно в мене не було такої цікавої тренувальної мішені для перевірки моєї магії."],
 SCalPhase2Text:["You will suffer greatly.","Ти дуже страждатимеш."],
 SCalPhase2TextRematch:["Here we go again.","Ну ось, знову починається."],
 SCalBH4Text:["It's absurd to even think of trying to get away. As long as you live, you will suffer.","Навіть думати про втечу безглуздо. Поки ти живий, ти страждатимеш."],
 SCalBH4TextRematch:["I wonder if you've seen these in your nightmares since our first battle?","Цікаво, чи бачив ти їх у кошмарах після нашої першої битви?"],
 SCalBH5Text:["You have no stake in this battle. No one gave you any say in this matter!","Тобі нічого здобувати в цій битві. Ніхто не давав тобі права втручатися!"],
 SCalBH5TextRematch:["Isn't this exciting?","Хіба це не захопливо?"],
 SCalDesparationText1:["Just stop!","Просто зупинись!"],
 SCalDesparationText1Rematch:["A terrific display, I concede this match to you.","Чудовий виступ. Я визнаю твою перемогу в цьому поєдинку."],
 SCalDesparationText2:["I have no future if I lose here.","Якщо я тут програю, у мене немає майбутнього."],
 SCalDesparationText2Rematch:["No doubt you will face enemies stronger than I.","Без сумніву, тобі ще доведеться зустріти ворогів, сильніших за мене."],
 SCalDesparationText3:["Once you have bested me, you will only have one path forward.","Коли ти мене здолаєш, перед тобою залишиться лише один шлях."],
 SCalDesparationText3Rematch:["I trust you will not make the same mistakes he did.","Сподіваюся, ти не повториш його помилок."],
 SCalStartText:['You should have just died...','Тобі варто було просто померти…'],
 SCalStartTextRematch:['When the time comes, would you like to join my creation?','Коли настане час, не хочеш приєднатися до мого творіння?'],
 SCalSepulcher2Text:['Once the dust has settled and only one remains, if it is you, what value will this have had?!','Коли пил осяде й залишиться лише хтось один — якщо це будеш ти, який у всьому цьому був сенс?!'],
 SCalSepulcher2TextRematch:['Here comes the crawling tomb, one last time.','Повзуча гробниця повертається. Востаннє.'],
 SCalBrothersText:["Would you like to meet my family? Horrible, isn't it?",'Хочеш познайомитися з моєю родиною? Жахливо, чи не так?'],
 SCalBrothersTextRematch:['Empty shells of their former selves. I doubt even a scrap of their spirits remain.','Порожні оболонки тих, ким вони колись були. Сумніваюся, що від їхніх душ лишилася бодай крихта.'],
 SCalSeekerRingText:['An upstart who recklessly stole and killed their way to power. I wonder, who does that remind me of...?','Вискочка, що бездумно крав і вбивав заради влади. Цікаво, кого це мені нагадує…?'],
 SCalSeekerRingTextRematch:["Your skill hasn't faltered in the least.",'Твоя майстерність анітрохи не згасла.'],
 SCalDesparationText4:['And that path... also has no future.','І цей шлях… також не має майбутнього.'],
 SCalDesparationText4Rematch:["I can't imagine what your future holds now.",'Не можу уявити, що тепер чекає на тебе попереду.'],
 SCalAcceptanceText1:['Even if he has thrown all else away, his power remains.','Навіть якщо він відкинув усе інше, його сила залишилася.'],
 SCalAcceptanceText2:['I have no more energy left to resent him, or you...','У мене більше немає сил ненавидіти його. Чи тебе…'],
 SCalAcceptanceText3:['It will all be in your hands now.','Тепер усе буде у твоїх руках.']
});
for(const line of Object.values(calamitasDialogue))registerTranslation(line[1],line[0]);
export function sayCalamitas(g,key,duration=4.8,rematch=true){const id=rematch&&g.rematch&&calamitasDialogue[key+'Rematch']?key+'Rematch':key;const line=calamitasDialogue[id];if(!line)return false;g.dialogueSeen??=new Set();if(g.dialogueSeen.has(id))return false;g.dialogueSeen.add(id);g.dialogueHistory??=[];g.dialogueHistory.push({key:id,at:g.t||0});if(g.dialogueHistory.length>32)g.dialogueHistory.shift();g.dialogKey=id;g.dialog=line[1];g.dialogT=duration;g.nativeDialogue=true;return true;}
export function calamitasDialogueText(g){return calamitasDialogue[g.dialogKey]?.[getLocale()==='en'?0:1]||g.dialog||'';}
export function updateDesperationDialogue(g){if(g.stage!=='normal'||g.phaseN<5||!g.done.has('sep2')||g.boss.hp<=1)return;for(const [hp,key]of [[.02,'SCalDesparationText3'],[.04,'SCalDesparationText2'],[.06,'SCalDesparationText1']])if(g.boss.hp/g.boss.max<=hp&&sayCalamitas(g,key))return;}
