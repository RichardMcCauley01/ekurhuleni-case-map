#!/usr/bin/env python3
"""Build data/cases.json, data/events.json, data/media.json and js/data.js from the curated records below.
Rules: every item cites sources (keys in tools/sources.py); approximate values are marked; uncharged persons
are never named; accused people are described, not named; pins are area/road level only."""
import json, os, sys, math
sys.path.insert(0, os.path.dirname(__file__))
from sources import S, src

# group: taskteam = under task team investigation, no arrest reported
#        arrest   = arrest made / charges (police say separate, or link not stated)
#        other    = not part of task team cases, or outside Ekurhuleni
CASES = []
def CASE(**k):
    k["sources"] = src(*k["sources"])
    CASES.append(k)

CASE(id="mahlangu", num=1, name="Busisiwe Mahlangu", age="37", group="arrest",
  linkStatus="Arrest made: her partner (per police). Police say he has not been linked to the other deaths.",
  statusShort="arrest made (partner; not linked to other deaths per police)",
  lastSeen=None,
  found=dict(date="2026-07-15", precision="day", place="Open field (veld) near the R21, Kempton Park", lat=-26.105, lng=28.238, pinPrecision="road/area",
             placeNote="Pin placed in Kempton Park near the R21; the exact spot was not reported. One map published by The Star places this case in Pomona (Kempton Park)."),
  circumstances="Found naked with her hands bound with cable ties (as reported by BBC and IOL). She was the first of the women whose deaths are now part of the Ekurhuleni investigation.",
  legal="Her partner (boyfriend) was arrested two days later, on 17 July 2026, and remains in custody (BBC, Presidency). The accused has not been named here; he is presumed innocent. No court date was found in public reporting.",
  court=[], conflicts=[], sources=["bbc_12","dm_0928","presidency_0929","iol_0928"])

CASE(id="kekana", num=2, name="Itumeleng Kekana", age="32", group="taskteam",
  linkStatus="Under task team investigation. No arrest reported.",
  statusShort="under task team investigation; no arrest",
  lastSeen=dict(date="2026-07-17", precision="approximate", time="≈19:00", place="Left home in Kempton Park in the evening, telling a neighbour she was going to see someone (per her brother, via Daily Maverick)", lat=None, lng=None),
  found=dict(date="2026-08-03", precision="day", place="Bushes beside Great North Road, Pomona (Kempton Park), near the Max informal settlement", lat=-26.104, lng=28.260, pinPrecision="road/area",
             placeNote="Found by a man on his way to work."),
  circumstances="Kempton Park police said her decomposing body was found in bushes next to the road with multiple stab wounds (Daily Maverick). Originally from Mmakwane Village, QwaQwa (Free State); she sold beauty products in Kempton Park. She was buried in QwaQwa on 22 August and leaves a 14-year-old daughter.",
  legal="No arrest reported. Her family has asked investigators for CCTV footage from a camera near the scene (Daily Maverick).",
  court=[], conflicts=["BBC describes her as found 'on a bridge', badly bruised and partially clothed. Daily Maverick (quoting police) says she was found in bushes next to Great North Road."],
  sources=["dm_kekana","bbc_12","tsa_0926","news24_timeline","dm_0928"])

CASE(id="mjobo", num=3, name="Nomfesane Mjobo", age=None, group="taskteam",
  linkStatus="Under task team investigation. No arrest reported.",
  statusShort="under task team investigation; no arrest",
  lastSeen=None,
  found=dict(date="2026-08-26", precision="day", place="Kempton Park area (exact place not publicly detailed)", lat=-26.096, lng=28.234, pinPrecision="town-level only",
             placeNote="Pin shows Kempton Park generally; the exact location was not reported."),
  circumstances="Few details have been released publicly. Family and friends held a candlelight vigil at the site where she was found (eNCA, 28 Sept).",
  legal="No arrest reported.",
  court=[], conflicts=["IOL (21 Sept) and The Star mention a 32-year-old woman found partially clothed near the R21 on 24 August. It is unclear whether that refers to this case. BBC and the SAPS list give 26 August."],
  sources=["bbc_12","enca_mjobo","dm_0928","presidency_0929"])

CASE(id="clayville", num=4, name="Unidentified woman (Clayville)", age="late 20s (police estimate)", group="taskteam",
  linkStatus="Added to the central task team probe on 15 September. Unidentified. No arrest reported.",
  statusShort="unidentified; under task team investigation; no arrest",
  lastSeen=None,
  found=dict(date="2026-09-07", precision="day", place="In a river at Clayville, near the Mall of Tembisa (listed by SAPS as 'Clayville River, Olifantsfontein')", lat=-25.958, lng=28.222, pinPrecision="suburb",
             placeNote="Pin at Clayville suburb level."),
  circumstances="Found in the water wearing only underwear. Police later appealed for help to trace her family and followed up on a possible family address (21-22 Sept).",
  legal="No arrest reported. Remains unidentified as of the latest reports found.",
  court=[], conflicts=["BBC spells the area 'Olifantsfontain'. Some early reports did not include this case in the count until it was added on 15 Sept."],
  sources=["bbc_12","national_0916","star_0922","dm_0928","st_0916"])

CASE(id="nkomo", num=5, name="Gracious Nkomo", age="28", group="taskteam",
  linkStatus="Under task team investigation. No arrest reported.",
  statusShort="under task team investigation; no arrest",
  lastSeen=None,
  found=dict(date="2026-09-10", precision="day", place="Near the R21, Kempton Park", lat=-26.100, lng=28.240, pinPrecision="road/area",
             placeNote="Marker offset slightly from case 1 so the two do not overlap; the exact spots were not reported."),
  circumstances="Found partially clothed; police described the body as decomposed. Identified by her family at the Germiston mortuary on 17 September (SAPS via SAnews). Born in Zimbabwe; Daily Maverick reports she is the only publicly identified foreign national among the victims.",
  legal="No arrest reported.",
  court=[], conflicts=["One outlet (joburgetc) and a map in The Star appear to confuse her with the Dawn Park case (Jabulile Ntimba). This site follows SAPS/SAnews, BBC and Daily Maverick (R21, Kempton Park)."],
  sources=["sanews_nkomo","bbc_12","dm_0928","national_0918","national_0916"])

CASE(id="moselakgomo", num=6, name="Elizabeth 'Tsontso' Moselakgomo", age="38", group="taskteam",
  linkStatus="Under task team investigation. No arrest reported.",
  statusShort="under task team investigation; no arrest",
  lastSeen=dict(date="2026-09-09", precision="day", place="Left home for an afternoon/evening run (Kempton Park area; her home suburb is reported inconsistently, so it is not mapped)", lat=None, lng=None),
  found=dict(date="2026-09-12", precision="day", place="Behind a hotel in Rhodesfield, Kempton Park", lat=-26.123, lng=28.229, pinPrecision="suburb",
             placeNote="Found on the evening/night of Saturday 12 September."),
  circumstances="A runner who did not return from her run; her eight-year-old daughter raised the alarm. Found badly bruised and partially clothed. Her family identified her at the Germiston mortuary on 14 September. She was buried in Mpumalanga around 19-20 September. Her disappearance drew wide public attention.",
  legal="No arrest reported.",
  court=[], conflicts=["Her home suburb is given as Roseville (News24) and Rhodesfield (The South African)."],
  sources=["bbc_runner","bbc_12","saps_0914","dm_0928","tsa_0926","news24_timeline"])

CASE(id="mathebula", num=7, name="Vutomi Mathebula", age="28", group="taskteam",
  linkStatus="Under task team investigation. No arrest reported.",
  statusShort="under task team investigation; no arrest",
  lastSeen=dict(date="2026-03-22", precision="day", place="Told her family she was going shopping at Dragon City, Johannesburg (her stated destination, not a confirmed sighting); reported missing the next day", lat=-26.211, lng=28.017, kind="stated destination"),
  found=dict(date="2026-09-14", precision="day", place="Porcelain Avenue, Olifantsfontein (found by a passer-by on Monday morning)", lat=-25.964, lng=28.236, pinPrecision="road/area",
             placeNote=""),
  circumstances="Missing for almost six months. Her family reported ransom demands after she disappeared: they paid R3,000 and a further R2,500 was demanded (Daily Maverick, The South African). She was found semi-naked and bruised. Her name was initially withheld; an uncle identified her by her hairstyle and clothing. She was buried in Limpopo on 24 September.",
  legal="No arrest reported.",
  court=[], conflicts=["Some reports describe the 14 September discovery as being in 'Kempton Park'. Most reports and the SAPS list give Olifantsfontein."],
  sources=["dm_0928","tsa_0926","saps_0914","dm_kekana","bbc_12"])

CASE(id="motapane", num=8, name="Dineo Evelyn Motapane", age="38", group="taskteam",
  linkStatus="Under task team investigation. No arrest reported.",
  statusShort="under task team investigation; no arrest",
  lastSeen=dict(date="2026-09-13", precision="approximate", time="≈17:00", place="Last seen by relatives on Sunday afternoon (place not reported). The family had not reported her missing.", lat=None, lng=None),
  found=dict(date="2026-09-15", precision="approximate", time="≈06:40", place="Beside Moshoeshoe Street, KwaThema (Springs), found by a passer-by", lat=-26.295, lng=28.391, pinPrecision="road/area", placeNote=""),
  circumstances="Preliminary findings indicated she had been strangled (as reported). BBC describes the body as battered and partly burned. Her family identified her at the Springs mortuary on 16 September. She leaves a young daughter (reported as two years old). Residents held a march in KwaThema.",
  legal="No arrest reported.",
  court=[], conflicts=[],
  sources=["dm_kekana","bbc_12","tsa_0926","dm_0928","st_0916"])

CASE(id="ntimba", num=9, name="Jabulile Ntimba", age="about 30", group="arrest",
  linkStatus="Arrest made: two women charged. Police cite a possible relationship ('love triangle') motive and have not linked this case to the others.",
  statusShort="arrest made - two women charged (separate motive per police)",
  lastSeen=None,
  found=dict(date="2026-09-17", precision="day", place="Open area on Lama Street, Villa Liza, Dawn Park (Boksburg)", lat=-26.326, lng=28.248, pinPrecision="road/area", placeNote="Found on Thursday morning."),
  circumstances="Found partially clothed with a fatal throat injury (as reported).",
  legal="Three people were arrested over the weekend of 19-20 September by the Gauteng Murder and Robbery Unit. A man was released: prosecutors declined to enrol charges, though police said he remains under investigation. Two women were charged with premeditated murder and defeating the ends of justice. They appeared in the Boksburg Magistrates' Court on 21 September and were remanded in custody until 1 October for a bail application. They are presumed innocent and are not named on this site.",
  court=[dict(date="2026-09-21", text="First appearance, Boksburg Magistrates' Court; remanded in custody", scheduled=False),
         dict(date="2026-10-01", text="Bail application, Boksburg Magistrates' Court", scheduled=True)],
  conflicts=["eNCA spells her surname 'Timba'. The suburb is spelled both 'Villa Liza' and 'Villa Lisa'. BBC (26 Sept) says 'three men appeared in court' in one of the earlier cases, which does not match other reports (two women charged, one man released)."],
  sources=["tsa_0924","dm_0928","bbc_12","national_0922","sabc_0920","bbc_10th"])

CASE(id="nxumalo", num=10, name="Ntombifuthi Nxumalo", age=None, group="arrest",
  linkStatus="Arrest made: a 36-year-old man charged with murder. Gauteng police said it was too early to say whether this case is linked to the others.",
  statusShort="arrest made - man charged with murder (link not established)",
  lastSeen=dict(date="2026-09-25", precision="approximate", time="evening", place="At a tavern with a female friend on Friday night; reportedly left with a man (tavern location not reported)", lat=None, lng=None),
  found=dict(date="2026-09-26", precision="day", place="At/next to Mooifontein Cemetery, Vusimuzi section, Tembisa (Saturday morning)", lat=-26.026, lng=28.206, pinPrecision="section/area",
             placeNote="Pin at Vusimuzi section level; the cemetery's exact position was not verified."),
  circumstances="Found with serious head injuries; stones were found nearby and the Gauteng commissioner said she may have been stoned (as reported). Residents reported hearing screams at about 23:00 on Friday. Her friend identified her by her clothes. She leaves five children; her family planned a burial in Nongoma, KwaZulu-Natal.",
  legal="A 36-year-old man was traced to a village in Limpopo and arrested. He appeared in the Tembisa Magistrates' Court on 29 September, charged with murder. The State opposes bail and the bail hearing was postponed to 6 October; he remains in custody. He is presumed innocent and is not named on this site.",
  court=[dict(date="2026-09-29", text="First appearance, Tembisa Magistrates' Court; bail hearing postponed", scheduled=False),
         dict(date="2026-10-06", text="Bail hearing, Tembisa Magistrates' Court", scheduled=True)],
  conflicts=["IOL spells her first name 'Ntombifuthu'.", "Arrest timing: Daily Maverick says Saturday evening (26 Sept); the President's address says Sunday morning (27 Sept)."],
  sources=["dm_0928","iol_0928","timeslive_0929","bbc_10th","sabc_0926","presidency_0929","bbc_12"])

CASE(id="springs", num=11, name="Unidentified woman (Springs)", age=None, group="taskteam",
  linkStatus="The task team responded to the scene. Unidentified. No arrest reported; police have not confirmed a link.",
  statusShort="unidentified; task team attended; link not confirmed; no arrest",
  lastSeen=None,
  found=dict(date="2026-09-27", precision="approximate", time="≈12:00", place="Open veld near Rhokana Road, Springs, close to a railway line, found by a patrolling security company", lat=-26.315, lng=28.447, pinPrecision="road/area", placeNote=""),
  circumstances="Found semi-naked; IOL reports she appeared to have been strangled. The task team, Crime Intelligence and the Investigative Psychology Section attended (EWN).",
  legal="No arrest reported.",
  court=[], conflicts=[],
  sources=["ewn_0927","iol_0928","dm_0928","bbc_12"])

CASE(id="nhlanzi", num=12, name="Boitumelo Nhlanzi", age="23", group="other",
  linkStatus="Not part of the task team cases. Police say it is not linked. Murder and robbery case opened.",
  statusShort="not part of task team cases",
  lastSeen=None,
  found=dict(date="2026-09-28", precision="approximate", time="≈05:45", place="Mapungubwe Street, Temong section, Tembisa (shot on her way to work)", lat=-26.004, lng=28.212, pinPrecision="road/area", placeNote=""),
  circumstances="Shot dead on her way to work early on Monday; her belongings were taken. Police said her estranged husband was a person of interest. He was found dead in his vehicle in Midrand later that day; police do not suspect foul play and an inquest was opened. He is not named here.",
  legal="Murder and robbery case opened. Police said the case is not linked to the other Ekurhuleni cases and is not being investigated by the task team (Daily Maverick).",
  court=[], conflicts=["BBC names her 'Boitumelo Gift Mashita'. Daily Maverick and IOL use 'Boitumelo Nhlanzi'. BBC includes her in its count of 12."],
  sources=["dm_0928","iol_0928","bbc_12"])

CASE(id="soweto", num=None, name="Unidentified woman (Moroka Dam, Soweto)", age="20s (police estimate)", group="other",
  linkStatus="Outside Ekurhuleni (City of Johannesburg). Inquest opened. No confirmed link.",
  statusShort="outside Ekurhuleni; inquest; no confirmed link",
  lastSeen=None,
  found=dict(date="2026-09-20", precision="approximate", time="≈17:00", place="In Moroka Dam, Soweto, wrapped in a duvet", lat=-26.262, lng=27.877, pinPrecision="landmark", placeNote="BBC gives a distance of about 63 km (as reported, method not stated). The straight-line distance between the approximate pins on this map is about 40 km from central Kempton Park."),
  circumstances="Found on Sunday afternoon. Police opened an inquest. Gauteng police have mentioned it alongside the Ekurhuleni cases but have not confirmed a link.",
  legal="Inquest opened. No arrest reported.",
  court=[], conflicts=["Daily Maverick counts her among 13 victims; the President's count of 11 covers Ekurhuleni only."],
  sources=["iol_0921","tsa_0924","dm_0928","bbc_12","bbc_10th"])

# ---------------- EVENTS ----------------
EV = []
PART = {"moselakgomo-found":"evening/night","mathebula-found":"morning","nxumalo-found":"morning","inv-reward":"late night","inv-address":"evening","nhlanzi-husband":"later that day","kekana-found":"morning (on a passer-by's way to work)"}
def E(id, dt, prec, title, desc, lane, cat, status, loc, sources, note=None):
    EV.append(dict(id=id, datetime=dt, precision=prec, title=title, description=desc, lane=lane, category=cat,
                   status=status, location=loc, sources=src(*sources), note=note, partOfDay=PART.get(id)))
POL="police statement"; OFF="official statement"; CRT="court / charges"; MED="media report"; EXP="expert opinion"; SCH="scheduled"
INV="investigation"

# --- per-case events ---
E("mahlangu-found","2026-07-15","day","Busisiwe Mahlangu (37) found near the R21, Kempton Park",
  "The body of Busisiwe Mahlangu was found in an open field near the R21 in Kempton Park. BBC and IOL report she was found naked with her hands bound. She is the first case in the official chronology.",
  "mahlangu","found",MED,"R21, Kempton Park",["bbc_12","iol_0928","dm_0928"])
E("mahlangu-arrest","2026-07-17","day","Partner arrested in Mahlangu case",
  "Two days later police arrested her partner (boyfriend), who remains in custody. Police and the President have said he has not been linked to the other deaths. He is presumed innocent and is not named here.",
  "mahlangu","arrest-court",POL,"Kempton Park",["bbc_12","presidency_0929","dm_0928"])
E("kekana-missing","2026-07-17T19:00","approximate","Itumeleng Kekana (32) goes missing in Kempton Park",
  "According to her brother, a neighbour saw her leave at about 7pm on 17 July, saying she was going to see someone. From 18 July her phone was off. Relatives came to Kempton Park on 19 July and searched police stations, hospitals and mortuaries.",
  "kekana","last-seen",MED,"Kempton Park",["dm_kekana","news24_timeline"],note="Time is approximate (the neighbour's account as relayed by her brother).")
E("kekana-found","2026-08-03","day","Itumeleng Kekana found beside Great North Road, Pomona",
  "A man on his way to work found her body in bushes beside Great North Road in Pomona, Kempton Park, near the Max informal settlement. Police said she had multiple stab wounds.",
  "kekana","found",POL,"Great North Road, Pomona (Kempton Park)",["dm_kekana","tsa_0926","bbc_12"],note="BBC says she was found 'on a bridge'. Daily Maverick, quoting police, says in bushes next to the road.")
E("kekana-burial","2026-08-22","day","Itumeleng Kekana buried in QwaQwa",
  "She was laid to rest in QwaQwa (Free State). She leaves her parents and a 14-year-old daughter.",
  "kekana","community",MED,"QwaQwa, Free State",["dm_kekana"])
E("mjobo-found","2026-08-26","day","Nomfesane Mjobo found in the Kempton Park area",
  "Nomfesane Mjobo was found in the Kempton Park area. Few details have been released publicly.",
  "mjobo","found",MED,"Kempton Park area",["bbc_12","dm_0928","presidency_0929"],note="IOL and The Star mention a 32-year-old woman found near the R21 on 24 August; it is unclear whether that is the same case.")
E("mjobo-vigil","2026-09-27","approximate","Candlelight vigil for Nomfesane Mjobo",
  "Family and friends held a candlelight vigil at the site where she was found (reported by eNCA on 28 September).",
  "mjobo","community",MED,"Kempton Park area",["enca_mjobo"],note="eNCA's report is dated 28 Sept; the exact vigil date is not stated.")
E("clayville-found","2026-09-07","day","Unidentified woman found in a river at Clayville",
  "A woman believed to be in her late 20s was found in a river at Clayville, near the Mall of Tembisa, wearing only underwear. She has not been publicly identified.",
  "clayville","found",POL,"Clayville (Olifantsfontein), near Tembisa",["bbc_12","st_0916","national_0916"])
E("clayville-added","2026-09-15","day","Clayville case added to the central probe",
  "Police added the 7 September Clayville case to the central investigation after reviewing cases (The National).",
  "clayville","official",POL,"Gauteng",["national_0916","st_0916"])
E("clayville-family","2026-09-21","approximate","Police appeal to trace the Clayville woman's family",
  "Police said they were tracing a possible family address and appealed for help to identify her.",
  "clayville","identified",POL,"Clayville / Tembisa",["star_0922"],note="Reported on 22 Sept; the statement was made on or around 21 Sept.")
E("nkomo-found","2026-09-10","day","Woman found near the R21 in Kempton Park (later identified as Gracious Nkomo)",
  "The partially clothed, decomposed body of a woman was found near the R21 in Kempton Park.",
  "nkomo","found",POL,"R21, Kempton Park",["bbc_12","national_0916","dm_0928"])
E("nkomo-id","2026-09-17","day","Gracious Nkomo (28) identified by her family",
  "SAPS said her family identified her at the Germiston mortuary. She was born in Zimbabwe.",
  "nkomo","identified",POL,"Germiston mortuary",["sanews_nkomo","national_0918","dm_0928"])
E("moselakgomo-missing","2026-09-09","day","Elizabeth Moselakgomo (38) does not return from a run",
  "She left home for an afternoon/evening run and did not return. Her eight-year-old daughter raised the alarm.",
  "moselakgomo","last-seen",MED,"Kempton Park area",["bbc_runner","tsa_0926","dm_0928"])
E("moselakgomo-found","2026-09-12","day","Elizabeth Moselakgomo found in Rhodesfield",
  "Her body was found on the Saturday evening/night behind a hotel in Rhodesfield, Kempton Park, badly bruised and partially clothed.",
  "moselakgomo","found",MED,"Rhodesfield, Kempton Park",["bbc_runner","saps_0914","bbc_12"],note="Reported as Saturday evening/night; the exact time was not reported.")
E("moselakgomo-id","2026-09-14","day","Moselakgomo identified by her family",
  "Her family identified her at the Germiston mortuary.",
  "moselakgomo","identified",MED,"Germiston mortuary",["bbc_runner","tsa_0926"])
E("moselakgomo-burial","2026-09-20","approximate","Elizabeth Moselakgomo buried in Mpumalanga",
  "She was buried in Mpumalanga on the weekend of 19-20 September.",
  "moselakgomo","community",MED,"Mpumalanga",["tsa_0926","dm_0928"],note="Weekend of 19-20 Sept; the exact day varies between reports.")
E("mathebula-missing","2026-03-22","day","Vutomi Mathebula (28) last heard from",
  "She told her family she was going shopping at Dragon City, Johannesburg, and was reported missing the next day. Her family later received ransom demands: they paid R3,000 and a further R2,500 was demanded.",
  "mathebula","last-seen",MED,"Johannesburg (stated destination: Dragon City)",["dm_0928","tsa_0926"],note="Dragon City is where she said she was going, not a confirmed sighting.")
E("mathebula-found","2026-09-14","day","Woman found on Porcelain Avenue, Olifantsfontein (later identified as Vutomi Mathebula)",
  "A passer-by found a semi-naked, bruised body on Porcelain Avenue, Olifantsfontein, on Monday morning.",
  "mathebula","found",POL,"Porcelain Avenue, Olifantsfontein",["saps_0914","dm_kekana","dm_0928","tsa_0926"],note="Reported as 'Monday morning'; the exact time was not reported.")
E("mathebula-id","2026-09-19","approximate","Vutomi Mathebula identified",
  "Her uncle identified her by her hairstyle and clothing. Her name had been withheld at first.",
  "mathebula","identified",MED,"Gauteng",["tsa_0926","dm_0928"],note="Exact identification date not confirmed; she was among the victims SAPS named by 20-21 Sept.")
E("mathebula-burial","2026-09-24","day","Vutomi Mathebula buried in Limpopo",
  "Her family buried her in Limpopo.",
  "mathebula","community",MED,"Limpopo",["tsa_0926","dm_0928"])
E("motapane-lastseen","2026-09-13T17:00","approximate","Dineo Motapane (38) last seen by relatives",
  "Relatives last saw her at about 17:00 on Sunday. The family had not reported her missing.",
  "motapane","last-seen",POL,"KwaThema area (place not reported)",["dm_kekana","tsa_0926"])
E("motapane-found","2026-09-15T06:40","approximate","Dineo Motapane found beside Moshoeshoe Street, KwaThema",
  "A passer-by found her body beside Moshoeshoe Street, KwaThema (Springs). Preliminary findings indicated strangulation (as reported). BBC describes the body as battered and partly burned.",
  "motapane","found",POL,"KwaThema, Springs",["tsa_0926","bbc_12","st_0916"])
E("motapane-id","2026-09-16","day","Motapane identified at Springs mortuary",
  "SAPS said on the evening of 16 September that her family had identified her at the Springs mortuary.",
  "motapane","identified",POL,"Springs mortuary",["dm_kekana"])
E("ntimba-found","2026-09-17","day","Jabulile Ntimba (about 30) found in Villa Liza, Dawn Park",
  "Her body was found on Thursday morning in an open area on Lama Street, Villa Liza, Dawn Park (Boksburg), partially clothed with a fatal throat injury (as reported). It was the ninth body in the series reported at the time.",
  "ntimba","found",POL,"Villa Liza, Dawn Park (Boksburg)",["dm_kekana","tsa_0924","bbc_12","cnn_0918"])
E("ntimba-arrests","2026-09-20","approximate","Three arrested in the Ntimba case",
  "The Gauteng Murder and Robbery Unit arrested three people over the weekend of 19-20 September. A man was released because prosecutors declined to enrol charges; police said he remains under investigation.",
  "ntimba","arrest-court",POL,"Gauteng",["tsa_0924","national_0922","dm_0928"],note="Weekend of 19-20 Sept; exact day not reported.")
E("ntimba-court","2026-09-21","day","Two women charged over Ntimba's death appear in court",
  "Two women charged with premeditated murder and defeating the ends of justice appeared in the Boksburg Magistrates' Court and were remanded in custody until 1 October. Police cited a possible 'love triangle' motive and said the case is not linked to the others. The accused are presumed innocent and are not named here.",
  "ntimba","arrest-court",CRT,"Boksburg Magistrates' Court",["tsa_0924","dm_0928","bbc_12"])
E("ntimba-bail","2026-10-01","day","Scheduled: bail application of the two accused (Ntimba case)",
  "The two women are due back in the Boksburg Magistrates' Court for a bail application. This date was scheduled as of the latest reports; the outcome is not known to this site.",
  "ntimba","arrest-court",SCH,"Boksburg Magistrates' Court",["tsa_0924"])
E("nxumalo-tavern","2026-09-25T23:00","approximate","Ntombifuthi Nxumalo seen at a tavern; screams heard",
  "She had been drinking at a tavern with a female friend on Friday night and reportedly left with a man. Residents said they heard screams at about 23:00.",
  "nxumalo","last-seen",MED,"Tembisa (tavern location not reported)",["dm_0928","iol_0928","bbc_10th"])
E("nxumalo-found","2026-09-26","day","Ntombifuthi Nxumalo found at Mooifontein Cemetery, Tembisa",
  "Her body was found on Saturday morning at Mooifontein Cemetery, Vusimuzi section, Tembisa, with serious head injuries; stones were found nearby. Her friend identified her by her clothes.",
  "nxumalo","found",POL,"Vusimuzi, Tembisa",["bbc_10th","dm_0928","iol_0928","sabc_0926"],note="Reported as Saturday morning; the exact time was not reported.")
E("nxumalo-arrest","2026-09-27","approximate","36-year-old man arrested in Limpopo (Nxumalo case)",
  "Police traced a 36-year-old man to a village in Limpopo and arrested him. He is presumed innocent and is not named here.",
  "nxumalo","arrest-court",POL,"Limpopo",["iol_0928","dm_0928","presidency_0929"],note="Daily Maverick says Saturday evening (26 Sept); the President says Sunday morning (27 Sept).")
E("nxumalo-court","2026-09-29","day","Accused in Nxumalo case appears in court; bail hearing postponed",
  "The man appeared in the Tembisa Magistrates' Court charged with murder. The State opposes bail; the hearing was postponed to 6 October and he remains in custody.",
  "nxumalo","arrest-court",CRT,"Tembisa Magistrates' Court",["timeslive_0929"])
E("nxumalo-bail","2026-10-06","day","Scheduled: bail hearing in the Nxumalo case",
  "The bail hearing is scheduled for 6 October in the Tembisa Magistrates' Court.",
  "nxumalo","arrest-court",SCH,"Tembisa Magistrates' Court",["timeslive_0929"])
E("springs-found","2026-09-27T12:00","approximate","Unidentified woman found near Rhokana Road, Springs",
  "A patrolling security company found a semi-naked body in open veld near Rhokana Road, Springs, close to a railway line. IOL reports she appeared to have been strangled. The task team, Crime Intelligence and the Investigative Psychology Section attended.",
  "springs","found",POL,"Springs",["ewn_0927","iol_0928","dm_0928"])
E("nhlanzi-shot","2026-09-28T05:45","approximate","Boitumelo Nhlanzi (23) shot dead in Temong, Tembisa",
  "She was shot on Mapungubwe Street on her way to work and her belongings were taken. A murder and robbery case was opened. Police said the case is not linked to the others and is not part of the task team investigation.",
  "nhlanzi","found",POL,"Temong, Tembisa",["dm_0928","iol_0928","bbc_12"])
E("nhlanzi-husband","2026-09-28","day","Estranged husband (person of interest) found dead in Midrand",
  "Police had identified her estranged husband as a person of interest. He was found dead in his vehicle in Midrand the same day. Police do not suspect foul play and an inquest was opened.",
  "nhlanzi","official",POL,"Midrand",["dm_0928","iol_0928"])
E("soweto-found","2026-09-20T17:00","approximate","Unidentified woman found in Moroka Dam, Soweto (outside Ekurhuleni)",
  "A woman believed to be in her 20s was found wrapped in a duvet in Moroka Dam, Soweto. Police opened an inquest. No link to the Ekurhuleni cases has been confirmed.",
  "soweto","found",POL,"Moroka, Soweto (Johannesburg)",["iol_0921","tsa_0924","bbc_12"])

# --- investigation & officials lane ---
E("inv-saps-warning","2026-09-14","day","SAPS issues public warning; dedicated task team set up",
  "SAPS warned women in and around Kempton Park and Rhodesfield to take 'extreme caution', saying the similarities between cases were 'sufficiently concerning for the police to issue a public warning'. Acting National Commissioner Lt Gen Puleng Dimpane directed that a dedicated multidisciplinary task team, led by Gauteng Deputy Provincial Commissioner Maj Gen Mbuso Khumalo, take over the investigations (including Murder and Robbery detectives and the Investigative Psychology Section). The public was asked to share tips via the MySAPS app.",
  INV,"official",POL,"Gauteng",["saps_0914","bbc_runner"])
E("inv-cameron","2026-09-15","day","Police committee chair cautions against assuming links",
  "Ian Cameron, chair of Parliament's portfolio committee on police, said SAPS had not said all the cases were connected and the public should be careful not to claim links investigators had not established. He also backed the police warning to women.",
  INV,"official",OFF,"Parliament",["st_0916"])
E("inv-reward","2026-09-15","day","Late-night briefing: R400,000 reward; 8 cases after review",
  "At a late-night briefing, Acting Police Minister Firoz Cachalia announced a reward of up to R400,000 for information and more police visibility (Operation Shanela). After a review the number of cases in the investigation rose from five to eight. Investigators were considering a single perpetrator, several perpetrators, or copycat killings.",
  INV,"official",OFF,"Parktown, Johannesburg",["national_0916","cnn_0918"],note="Reported as a 'late night' briefing; the exact time was not reported.")
E("inv-ramaphosa-early","2026-09-15","approximate","President Ramaphosa: 'no stone' to be left unturned",
  "President Cyril Ramaphosa spoke of the 'fear and uncertainty' the killings had caused, directed that the investigation be prioritised, and said no stone should be left unturned.",
  INV,"official",OFF,"National",["cnn_0918","national_0916"],note="Exact date not confirmed; this had been reported by 16 Sept.")
E("inv-labuschagne","2026-09-16","day","Former SAPS profiler: treat as possible serial murders until shown otherwise",
  "Prof Gérard Labuschagne, an investigative forensic psychologist and former SAPS profiler, said: 'Due to the relatively close geographic proximity and timeframe of the murders and the similar victimology, it makes sense to treat this as a serial (murder investigation) until information to the contrary comes to light.' He stressed he was not involved in the investigation and could not say definitively that one killer was responsible.",
  INV,"expert",EXP,"—",["st_0916","dm_0927"])
E("inv-da-reward","2026-09-16","approximate","DA offers to add R500,000 to the reward",
  "The Democratic Alliance offered to add R500,000 to the cash reward for information leading to arrests and prosecution.",
  INV,"official",MED,"—",["dm_kekana"],note="Reported by 17 Sept; exact date of the offer not confirmed.")
E("inv-backlash","2026-09-17","approximate","Criticism of police safety advice to women",
  "Activists and commentators criticised police safety advice to women as putting the burden on women rather than on perpetrators and policing (CNN, Daily Maverick).",
  INV,"community",MED,"—",["cnn_0918","dm_0927"],note="Approximate: criticism was reported from mid-September.")
E("inv-poi","2026-09-20","day","Three persons of interest called in for questioning",
  "Speaking at a briefing in Pretoria on Sunday, Acting Police Minister Firoz Cachalia said three persons of interest had been called in for questioning: 'These investigations have not confirmed conclusively that we are dealing with a serial killer because all the cases are not necessarily linked. There are some indications of different modus operandi and different motives.' The persons of interest have not been named, and this site does not name them.",
  INV,"official",OFF,"Pretoria",["ewn_0920","sabc_0920"])
E("inv-names","2026-09-21","approximate","SAPS releases names of identified victims",
  "SAPS released the names of the victims who had been identified; by 20 September, eight of the nine women then in the investigation had been identified (as reported).",
  INV,"identified",POL,"Gauteng",["sabc_0920","ekay_0924"],note="Approximate: names were released around 20-21 Sept.")
E("inv-parliament","2026-09-23","day","Parliamentary briefing: forensics 'linking some persons of interest'",
  "Briefing Parliament's Portfolio Committee on Police, Acting Deputy National Commissioner Lt Gen Hilda Senthumule said forensic work was linking some persons of interest to some of the identified victims (none were named, and the evidence was not described). Gauteng Commissioner Lt Gen Tommy Mthombeni said: 'As of now, we could not confirm whether there is a serial killer, though it cannot be ruled out.' KwaZulu-Natal commissioner Lt Gen Nhlanhla Mkhwanazi was reported to have been brought into the investigation.",
  INV,"official",OFF,"Parliament (Portfolio Committee on Police)",["tsa_0924","ekay_0924"])
E("inv-mthombeni","2026-09-26","day","Gauteng commissioner: serial killer 'cannot' be ruled out, too early to link latest case",
  "At the Tembisa scene, Lt Gen Mthombeni said the other cases shared a 'similar victimology' and modus operandi, but it was too soon to say whether the latest death was linked: 'For now, it's not something which we can overrule to say there's a serial killer, but we cannot conclusively indicate as such.'",
  INV,"official",POL,"Tembisa",["bbc_10th","sabc_0926"])
E("inv-mosikili","2026-09-27","day","Deputy National Commissioner describes multidisciplinary team",
  "Deputy National Commissioner Lt Gen Tebello Mosikili described a multidisciplinary team (forensics, data analysis, fingerprints, intelligence, Home Affairs and criminologists) and pointed to poor lighting in some areas.",
  INV,"official",POL,"—",["dm_0927"])
E("inv-dm-analysis","2026-09-28","day","Daily Maverick overview: similarities and differences",
  "Daily Maverick summarised what is publicly known about the similarities between the cases (victim profile, geography, timing, secluded places) and the differences (relationship links in some cases, different causes of death). See the 'Patterns & differences' panel.",
  INV,"expert",MED,"—",["dm_0928"])
E("inv-newsletter","2026-09-28","day","Presidential newsletter: violence against women 'a stain on our national conscience'",
  "In his weekly newsletter, President Ramaphosa wrote: 'The abuse, rape and killing of women is a stain on our national conscience.'",
  INV,"official",OFF,"National",["presidency_0928"])
E("inv-address","2026-09-29","day","President's address to the nation on the Ekurhuleni killings",
  "President Ramaphosa said the bodies of 11 women had been found in Ekurhuleni since July. The investigation was raised to national level under the Deputy National Commissioner for Detective Services, and the CSIR is helping with digital forensics. He said: 'At present, the police have not found evidence establishing that these killings were committed by a single perpetrator. All possibilities remain under investigation.' He also said forensic material had been collected and persons of interest identified in other cases, and announced national measures including a case-recovery audit, a plan for the forensic backlog, municipal women's safety audits and alcohol-related measures.",
  INV,"official",OFF,"National (televised address)",["presidency_0929","enca_0930"],note="Evening address; the exact start time is not given in the transcript.")

EV[:] = [e for e in EV if e["id"] != "mathebula-id"]

# ---------------- PATTERNS & DIFFERENCES (quoted/attributed, no conclusions) ----------------
PATTERNS = {
 "said": [
  dict(who="SAPS (14 Sept statement)", text="The similarities between cases were 'sufficiently concerning for the police to issue a public warning'.", sources=src("saps_0914")),
  dict(who="Prof Gérard Labuschagne, former SAPS profiler (16 Sept)", text="'Due to the relatively close geographic proximity and timeframe of the murders and the similar victimology, it makes sense to treat this as a serial (murder investigation) until information to the contrary comes to light.' He said he was not involved in the investigation.", sources=src("st_0916","dm_0927")),
  dict(who="Acting Police Minister Firoz Cachalia (20 Sept)", text="'…not confirmed conclusively that we are dealing with a serial killer because all the cases are not necessarily linked. There are some indications of different modus operandi and different motives.'", sources=src("ewn_0920","sabc_0920")),
  dict(who="Gauteng Commissioner Lt Gen Tommy Mthombeni (23 and 26 Sept)", text="'As of now, we could not confirm whether there is a serial killer, though it cannot be ruled out.' On 26 Sept he referred to a 'similar victimology' and modus operandi among earlier cases.", sources=src("tsa_0924","bbc_10th")),
  dict(who="President Cyril Ramaphosa (29 Sept)", text="'At present, the police have not found evidence establishing that these killings were committed by a single perpetrator. All possibilities remain under investigation.'", sources=src("presidency_0929")),
  dict(who="Forensic specialist quoted anonymously by Daily Maverick", text="Offenders can change their methods, so differences between cases don't rule out a link; but South Africa's high crime rates mean that cases in the same area could be unrelated.", sources=src("dm_kekana","dm_0928")),
 ],
 "similar": [
  dict(text="Victims reported as black women, mostly in their 20s and 30s.", sources=src("dm_0928","bbc_12")),
  dict(text="Most bodies were found in and around Kempton Park, the R21 corridor, Clayville/Olifantsfontein and Tembisa; several were near the R21.", sources=src("dm_0928","wapo_0916")),
  dict(text="Six bodies were found within about ten days in September, mostly in open or secluded places, with no eyewitnesses identified publicly.", sources=src("dm_0928")),
  dict(text="Several victims were reported as found partially clothed or unclothed.", sources=src("bbc_12","dm_0928")),
 ],
 "different": [
  dict(text="Three cases have arrests, and police cite relationship motives in two of them (Mahlangu: partner arrested; Ntimba: 'love triangle' per police). A 12th case (Nhlanzi) involved an estranged husband as a person of interest, and police say it is not linked.", sources=src("dm_0928","bbc_12","tsa_0924")),
  dict(text="Reported causes of death differ: stab wounds, a throat injury, strangulation, head injuries, and a shooting.", sources=src("dm_0928","bbc_12")),
  dict(text="Dawn Park (Boksburg), KwaThema and Springs are further from the Kempton Park cluster; the Soweto case is outside Ekurhuleni.", sources=src("dm_0928","wapo_0916","bbc_12")),
  dict(text="One victim (Mathebula) had been missing since March 2026, with ransom demands reported. Others were found within days of last being seen.", sources=src("dm_0928","tsa_0926")),
 ],
}

# ---------------- COUNTS / CONFLICTS ----------------
CONFLICTS = [
 dict(topic="How many cases?", text="The President (29 Sept) said 11 bodies had been found in Ekurhuleni since July. BBC (28 Sept) counts 12, including Boitumelo Nhlanzi, whom police say is not linked. Daily Maverick (28 Sept) lists 13 victims, including the Soweto case and Nhlanzi. Earlier reports gave 5, 8, 9 and 10 as cases were added or found.", sources=src("presidency_0929","bbc_12","dm_0928","national_0916","tsa_0926")),
 dict(topic="How many were reported missing first?", text="The President said 'only two' of the women had been reported missing. Daily Maverick says at least four had been reported missing before they were found.", sources=src("presidency_0929","dm_0928")),
 dict(topic="Arrests in the Ntimba case", text="Most reports: three arrested, two women charged, one man released. BBC (26 Sept) says 'three men appeared in court' in one of the earlier cases.", sources=src("tsa_0924","dm_0928","bbc_10th")),
 dict(topic="Nxumalo arrest timing", text="Saturday evening, 26 Sept (Daily Maverick) vs Sunday morning, 27 Sept (Presidency).", sources=src("dm_0928","presidency_0929")),
 dict(topic="Mjobo date", text="26 Aug (BBC, SAPS list) vs a 24 Aug case near the R21 mentioned by IOL/The Star, which may or may not be the same case.", sources=src("bbc_12","iol_0928")),
 dict(topic="Names and spellings", text="Ntimba / 'Timba' (eNCA); Ntombifuthi / 'Ntombifuthu' (IOL); Boitumelo Nhlanzi / 'Boitumelo Gift Mashita' (BBC); Villa Liza / Villa Lisa; Olifantsfontein / 'Olifantsfontain' (BBC).", sources=src("bbc_12","iol_0928","dm_0928")),
 dict(topic="Mapping errors elsewhere", text="At least one outlet and one published map placed Gracious Nkomo in Dawn Park, apparently confusing her with Jabulile Ntimba. This site follows SAPS/SAnews, BBC and Daily Maverick.", sources=src("sanews_nkomo","bbc_12","dm_0928")),
]

# ---------------- MEDIA & DOCUMENTS ----------------
MEDIA = []
def M(id, type, title, key, description, events):
    t, u, o, d, a = S[key]
    MEDIA.append(dict(id=id, type=type, title=title, outlet=o, date=d, url=u, description=description, events=events))
M("m-saps","official document","SAPS statement: warning and dedicated task team","saps_0914","Official police statement of 14 Sept (four bodies in the Kempton Park area; public warning; task team; MySAPS tip line).",["inv-saps-warning"])
M("m-sanews","official document","SAnews: Gracious Nkomo identified","sanews_nkomo","Government news agency report on the SAPS identification statement.",["nkomo-id"])
M("m-address","official document / transcript","President Ramaphosa's address to the nation (full text)","presidency_0929","Full text of the 29 Sept address: case count, national-level investigation, measures.",["inv-address"])
M("m-newsletter","official document","From the desk of the President, 28 Sept","presidency_0928","Weekly presidential newsletter referring to violence against women.",["inv-newsletter"])
M("m-parl","parliamentary briefing coverage","Parliament briefing: Senthumule and Mthombeni","tsa_0924","Coverage of the 23 Sept Portfolio Committee on Police briefing.",["inv-parliament"])
M("m-parl2","parliamentary briefing coverage","Senthumule assures MPs of police progress","ekay_0924","eKayNews coverage of the same briefing.",["inv-parliament"])
M("m-enca-video","video report","eNCA: Specialised team probing Ekurhuleni murders","enca_0930","TV news report on the national-level investigation team (30 Sept).",["inv-address"])
M("m-sabc-poi","video / broadcast coverage","SABC: three persons of interest questioned","sabc_0920","Broadcast coverage of the 20 Sept briefing.",["inv-poi"])
M("m-sabc-0926","video / broadcast coverage","SABC: Gauteng police cannot rule out serial killer","sabc_0926","Commissioner Mthombeni at the Tembisa scene (26 Sept).",["inv-mthombeni"])
M("m-bbc-explainer","explainer","BBC: What we know after bodies of 12 women found","bbc_12","Case-by-case explainer (28 Sept). Contains photos of some victims supplied by families.",["mahlangu-found","nhlanzi-shot"])
M("m-dm-explainer","explainer","Daily Maverick: here's what we know about the killings","dm_0928","Detailed explainer with similarities and differences (28 Sept).",["inv-dm-analysis"])
M("m-tsa-explainer","explainer","The South African: what we know about all 10 women","tsa_0926","Profiles of the first ten women (26 Sept).",[])
M("m-dm-analysis","analysis","Daily Maverick: Ekurhuleni murders expose SA's femicide failures","dm_0927","Analysis including Labuschagne and SAPS comments (27 Sept).",["inv-labuschagne","inv-mosikili"])
M("m-st-expert","expert interview","Sunday Times: treat as possible serial murders until proven otherwise","st_0916","Interview with Prof Gérard Labuschagne on SAPS serial-murder investigation policy.",["inv-labuschagne"])
M("m-kekana","tribute / profile","Daily Maverick: a brother's search for Itumeleng Kekana","dm_kekana","Family account of her disappearance and the search. Contains a photo of her (not embedded here).",["kekana-missing","kekana-found"])
M("m-mjobo","tribute / profile","eNCA: Nomfesane Mjobo's family and friends honour her memory","enca_mjobo","Vigil coverage. May contain photos (not embedded here).",["mjobo-vigil"])
M("m-runner","tribute / profile","BBC: body of missing runner found","bbc_runner","Report on Elizabeth Moselakgomo's disappearance and discovery.",["moselakgomo-found"])
M("m-court","court coverage","TimesLIVE: accused to remain in custody as bail date postponed","timeslive_0929","29 Sept court appearance in the Nxumalo case. Note: this report names the accused; this site does not.",["nxumalo-court"])
M("m-cnn","international coverage","CNN: 'Women are terrified'","cnn_0918","International coverage including the reaction to police safety advice.",["inv-backlash"])
M("m-wapo","international coverage","Washington Post: nine bodies raise fears of serial murder, femicide","wapo_0918","International coverage (18 Sept). Read via search snippet only (paywall).",[])
M("m-boundary","dataset","Ekurhuleni municipal boundary (geoBoundaries)","geob","Public boundary data used for the map outline (simplified). CC BY 3.0 IGO.",[])

NOT_PUBLIC = [
 "Post-mortem results for most victims: only preliminary causes reported in the media are shown here, with attribution.",
 "What the forensic evidence links: police said on 23 Sept that forensics link some persons of interest to some victims, but did not say which people, which victims, or what evidence.",
 "Identities of persons of interest: not released by police, and intentionally not named on this site.",
 "The identities of two women (Clayville, 7 Sept; Springs, 27 Sept) and the woman found in Soweto (20 Sept), as of the latest reports found.",
 "Exact locations where bodies were found: map pins are placed at suburb or road level only.",
 "Charge sheets and court documents: not publicly posted. Court information comes from news reports.",
 "An official, consolidated SAPS case list with dates and places: the list here is compiled from several statements and reports.",
]

# ---------------- approximate distances (from the approximate pins) ----------------
def hav(a, b):
    R = 6371.0
    la1, lo1, la2, lo2 = map(math.radians, (a[0], a[1], b[0], b[1]))
    h = math.sin((la2-la1)/2)**2 + math.cos(la1)*math.cos(la2)*math.sin((lo2-lo1)/2)**2
    return 2*R*math.asin(math.sqrt(h))
KP = (-26.096, 28.234)   # Kempton Park centre (OSM/Nominatim place node, rounded)
for c in CASES:
    c["found"]["kmFromKemptonPark"] = round(hav(KP, (c["found"]["lat"], c["found"]["lng"])), 0)
eku = [c for c in CASES if c["id"] not in ("soweto",)]
within10 = [c["name"] for c in eku if c["found"]["kmFromKemptonPark"] <= 10]
within20 = [c for c in eku if c["found"]["kmFromKemptonPark"] <= 20]
far = sorted(eku, key=lambda c: -c["found"]["kmFromKemptonPark"])[0]
DIST = dict(center="Kempton Park centre (approx. -26.096, 28.234)", within10=len(within10), within20=len(within20), total=len(eku),
            farthest=dict(name=far["name"], km=far["found"]["kmFromKemptonPark"]),
            note="Straight-line distances between approximate, area-level pins; they are indicative only (±2-3 km) and are not evidence of any link.")


# ---------------- intervals (time between cases) ----------------
from datetime import datetime as _dt
def _t(date, time):
    """time like '≈06:40' -> datetime; None when no clock time was reported."""
    import re as _re
    m = _re.search(r'(\d{2}):(\d{2})', time or '')
    return _dt.fromisoformat(date + (f'T{m.group(1)}:{m.group(2)}' if m else 'T00:00')), bool(m)
def _gap(d1, t1, d2, t2):
    a, ha = _t(d1, t1); b, hb = _t(d2, t2)
    days = (_dt.fromisoformat(d2) - _dt.fromisoformat(d1)).days
    out = dict(days=days)
    if ha and hb: out["hours"] = round((b - a).total_seconds() / 3600, 1)
    return out
order = sorted([c for c in CASES if c["id"] != "soweto"], key=lambda c: (c["found"]["date"], c["found"].get("time") or ""))
INTERVALS = []
for a, b in zip(order, order[1:]):
    g = _gap(a["found"]["date"], a["found"].get("time"), b["found"]["date"], b["found"].get("time"))
    g.update(dict(fromId=a["id"], toId=b["id"], fromDate=a["found"]["date"], toDate=b["found"]["date"],
                  approximate=bool((a["found"].get("time") or "").startswith("≈") or (b["found"].get("time") or "").startswith("≈"))))
    INTERVALS.append(g)
for c in CASES:
    ls = c.get("lastSeen")
    if ls and ls.get("date"):
        c["lastSeenToFound"] = _gap(ls["date"], ls.get("time"), c["found"]["date"], c["found"].get("time"))

# ---------------- validation + output ----------------
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
lanes = {c["id"] for c in CASES} | {INV}
ids = [e["id"] for e in EV]; assert len(ids) == len(set(ids)), "dup ids"
for e in EV:
    assert e["lane"] in lanes, e["id"]; assert e["sources"], e["id"]
    assert e["status"] in (POL, OFF, CRT, MED, EXP, SCH), e["id"]
for m in MEDIA:
    for i in m["events"]: assert i in ids, (m["id"], i)
for e in EV:
    e["media"] = [m["id"] for m in MEDIA if e["id"] in m["events"]]
    e["caseId"] = e["lane"] if e["lane"] != INV else None
for c in CASES:
    c["events"] = [e["id"] for e in sorted(EV, key=lambda x: x["datetime"]) if e["lane"] == c["id"]]
EV.sort(key=lambda e: (e["datetime"][:16], e["id"]))
meta = {"generated": "2026-09-30", "asOf": "2026-09-30", "timezoneNote": "All times are South African Standard Time (SAST, UTC+2).",
        "eventCount": len(EV), "caseCount": len(CASES), "distance": DIST, "intervals": INTERVALS}
DATA = {"meta": meta, "cases": CASES, "events": EV, "patterns": PATTERNS, "conflicts": CONFLICTS}
MED_ = {"media": MEDIA, "notPublic": NOT_PUBLIC}
os.makedirs(os.path.join(root, "data"), exist_ok=True)
json.dump({"meta": meta, "cases": CASES}, open(os.path.join(root, "data", "cases.json"), "w"), indent=1, ensure_ascii=False)
json.dump({"meta": meta, "events": EV, "patterns": PATTERNS, "conflicts": CONFLICTS}, open(os.path.join(root, "data", "events.json"), "w"), indent=1, ensure_ascii=False)
json.dump(MED_, open(os.path.join(root, "data", "media.json"), "w"), indent=1, ensure_ascii=False)
with open(os.path.join(root, "js", "data.js"), "w") as f:
    f.write("// Generated by tools/build_data.py (lets the site run from file:// without fetch).\n")
    f.write("window.CASE_DATA = " + json.dumps(DATA, ensure_ascii=False) + ";\n")
    f.write("window.MEDIA_DATA = " + json.dumps(MED_, ensure_ascii=False) + ";\n")
urls = set()
for e in EV:
    for s in e["sources"]: urls.add(s["url"])
for c in CASES:
    for s in c["sources"]: urls.add(s["url"])
for m in MEDIA: urls.add(m["url"])
for p in PATTERNS.values():
    for x in p:
        for s in x["sources"]: urls.add(s["url"])
unused = [k for k, v in S.items() if v[1] not in urls]
print("cases", len(CASES), "| events", len(EV), "| unique sources", len(urls), "| unused registry keys", unused)
print("distance", DIST, [ (c["name"], c["found"]["kmFromKemptonPark"]) for c in CASES])
